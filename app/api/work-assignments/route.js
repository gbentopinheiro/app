import { NextResponse } from 'next/server'
import { createWorkAssignment, getAllWorkAssignments, getAssignmentDefaults } from '../../../lib/work-assignments.js'
import { canManageEntireApp } from '../../../lib/auth.js'
import { getServerSession } from '../../../lib/server-session.js'
import { ROLE_CHEF } from '../../../lib/roles.js'

function canAccessWork(session, workId) {
  if (!session) return false
  if (canManageEntireApp(session.role)) return true
  return session.workIds.includes(Number(workId))
}

function filterAssignmentsForSession(assignments, session) {
  if (!session || canManageEntireApp(session.role)) {
    return assignments
  }

  return assignments.filter(assignment => canAccessWork(session, assignment.workId))
}

function filterDefaultsForSession(defaults, session) {
  if (!session || canManageEntireApp(session.role)) {
    return defaults
  }

  return {
    ...defaults,
    works: defaults.works.filter(work => canAccessWork(session, work.id)),
  }
}

function getChefReferenceAssignments(session, filters = {}) {
  if (!session || session.role !== ROLE_CHEF) {
    return []
  }

  const scopedFilters = {}

  if (filters.workPlanId) {
    scopedFilters.workPlanId = filters.workPlanId
  } else if (filters.date) {
    scopedFilters.date = filters.date
  }

  if (!scopedFilters.workPlanId && !scopedFilters.date) {
    return []
  }

  return filterAssignmentsForSession(getAllWorkAssignments(scopedFilters), session)
}

function buildPlannedPeopleByWork(assignments) {
  const groupedPeople = new Map()

  assignments.forEach(assignment => {
    const workId = Number(assignment.workId)
    const personId = Number(assignment.person?.id || assignment.personId)

    if (!workId || !personId || !assignment.person) {
      return
    }

    const currentWorkPeople = groupedPeople.get(workId) || new Map()

    currentWorkPeople.set(personId, {
      id: assignment.person.id,
      name: assignment.person.name,
      defaultHourlyPrice: assignment.person.defaultHourlyPrice,
    })

    groupedPeople.set(workId, currentWorkPeople)
  })

  return Object.fromEntries(
    Array.from(groupedPeople.entries()).map(([workId, peopleMap]) => [
      String(workId),
      Array.from(peopleMap.values()).sort((left, right) => left.name.localeCompare(right.name)),
    ]),
  )
}

function extendDefaultsForChef(defaults, session, filters = {}) {
  const nextDefaults = filterDefaultsForSession(defaults, session)
  const referenceAssignments = getChefReferenceAssignments(session, filters)
  const plannedPeopleByWork = buildPlannedPeopleByWork(referenceAssignments)
  const allowedPeople = Array.from(
    new Map(
      Object.values(plannedPeopleByWork)
        .flat()
        .map(person => [person.id, person]),
    ).values(),
  ).sort((left, right) => left.name.localeCompare(right.name))

  return {
    ...nextDefaults,
    people: allowedPeople,
    plannedPeopleByWork,
    restrictPeopleByWork: true,
  }
}

function isChefPersonAllowedForWork(session, { workPlanId, date, workId, personId }) {
  if (!session || session.role !== ROLE_CHEF) {
    return true
  }

  const referenceAssignments = getChefReferenceAssignments(session, { workPlanId, date })

  return referenceAssignments.some(
    assignment =>
      Number(assignment.workId) === Number(workId) &&
      Number(assignment.personId) === Number(personId),
  )
}

export async function GET(request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessão obrigatória.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeDefaults = searchParams.get('includeDefaults') === 'true'
    const filters = {
      workPlanId: searchParams.get('workPlanId'),
      workId: searchParams.get('workId'),
      personId: searchParams.get('personId'),
      date: searchParams.get('date'),
    }

    if (session.role === ROLE_CHEF && filters.workId && !canAccessWork(session, filters.workId)) {
      return NextResponse.json({ error: 'Sem permissão para esta obra.' }, { status: 403 })
    }

    const assignments = filterAssignmentsForSession(getAllWorkAssignments(filters), session)

    if (includeDefaults) {
      return NextResponse.json({
        items: assignments,
        defaults:
          session.role === ROLE_CHEF
            ? extendDefaultsForChef(getAssignmentDefaults(), session, filters)
            : filterDefaultsForSession(getAssignmentDefaults(), session),
      })
    }

    return NextResponse.json(assignments)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter afetações' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessão obrigatória.' }, { status: 401 })
    }

    const body = await request.json()
    const { workPlanId, workId, personId, date, hours, hourlyCost, notes } = body

    if (!workId || !personId || (!workPlanId && !date)) {
      return NextResponse.json({ error: 'workPlanId, workId e personId são obrigatórios' }, { status: 400 })
    }

    if (!canAccessWork(session, workId)) {
      return NextResponse.json({ error: 'Sem permissão para registar horas nesta obra.' }, { status: 403 })
    }

    if (!isChefPersonAllowedForWork(session, { workPlanId, date, workId, personId })) {
      return NextResponse.json(
        { error: 'O chefe só pode registar pessoas colocadas pelo administrador no plano diário dessa obra.' },
        { status: 403 },
      )
    }

    if (date && Number.isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: 'date tem de ser uma data válida' }, { status: 400 })
    }

    if (hours === undefined || Number(hours) < 0) {
      return NextResponse.json({ error: 'hours tem de ser 0 ou maior' }, { status: 400 })
    }

    if (hourlyCost !== undefined && Number(hourlyCost) < 0) {
      return NextResponse.json({ error: 'hourlyCost não pode ser negativo' }, { status: 400 })
    }

    const assignment = createWorkAssignment({ workPlanId, workId, personId, date, hours, hourlyCost, notes })
    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    const status = error.message.includes('não encontrado') ? 404 : 500
    return NextResponse.json({ error: error.message || 'Erro ao criar afetação' }, { status })
  }
}
