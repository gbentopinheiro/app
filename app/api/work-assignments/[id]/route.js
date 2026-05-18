import { NextResponse } from 'next/server'
import { deleteWorkAssignment, getAllWorkAssignments, getWorkAssignmentById, updateWorkAssignment } from '../../../../lib/work-assignments.js'
import { canManageEntireApp } from '../../../../lib/auth.js'
import { getServerSession } from '../../../../lib/server-session.js'
import { ROLE_CHEF } from '../../../../lib/roles.js'

function canAccessAssignment(session, assignment) {
  if (!session || !assignment) return false
  if (canManageEntireApp(session.role)) return true
  return session.workIds.includes(Number(assignment.workId))
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

  return getAllWorkAssignments(scopedFilters).filter(
    assignment => session.workIds.includes(Number(assignment.workId)),
  )
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

export async function GET(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessão obrigatória.' }, { status: 401 })
    }

    const { id } = await params
    const assignment = getWorkAssignmentById(id)

    if (!assignment) {
      return NextResponse.json({ error: 'Afetação não encontrada' }, { status: 404 })
    }

    if (!canAccessAssignment(session, assignment)) {
      return NextResponse.json({ error: 'Sem permissão para esta afetação.' }, { status: 403 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter afetação' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessão obrigatória.' }, { status: 401 })
    }

    const { id } = await params
    const currentAssignment = getWorkAssignmentById(id)

    if (!currentAssignment) {
      return NextResponse.json({ error: 'Afetação não encontrada' }, { status: 404 })
    }

    if (!canAccessAssignment(session, currentAssignment)) {
      return NextResponse.json({ error: 'Sem permissão para esta afetação.' }, { status: 403 })
    }

    const body = await request.json()
    const { workPlanId, workId, personId, date, hours, hourlyCost, notes, submitted } = body
    const targetWorkId = workId !== undefined ? Number(workId) : Number(currentAssignment.workId)
    const targetPersonId = personId !== undefined ? Number(personId) : Number(currentAssignment.personId)
    const targetWorkPlanId = workPlanId !== undefined ? workPlanId : currentAssignment.workPlan?.id
    const targetDate = date !== undefined ? date : currentAssignment.date

    if (session.role === ROLE_CHEF && workId !== undefined && !session.workIds.includes(Number(workId))) {
      return NextResponse.json({ error: 'Sem permissão para mover a afetação para essa obra.' }, { status: 403 })
    }

    if (!isChefPersonAllowedForWork(session, {
      workPlanId: targetWorkPlanId,
      date: targetDate,
      workId: targetWorkId,
      personId: targetPersonId,
    })) {
      return NextResponse.json(
        { error: 'O chefe só pode registar pessoas colocadas pelo administrador no plano diário dessa obra.' },
        { status: 403 },
      )
    }

    if (date && Number.isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: 'date tem de ser uma data válida' }, { status: 400 })
    }

    if (hours !== undefined && Number(hours) < 0) {
      return NextResponse.json({ error: 'hours tem de ser 0 ou maior' }, { status: 400 })
    }

    if (hourlyCost !== undefined && Number(hourlyCost) < 0) {
      return NextResponse.json({ error: 'hourlyCost não pode ser negativo' }, { status: 400 })
    }

    if (submitted !== undefined) {
      return NextResponse.json(
        { error: 'O status só pode ser alterado pelo fluxo de submissão do chefe.' },
        { status: 403 },
      )
    }

    const assignment = updateWorkAssignment(id, {
      workPlanId,
      workId,
      personId,
      date,
      hours,
      hourlyCost,
      notes,
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Afetação não encontrada' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    const status = error.message.includes('não encontrado') ? 404 : 500
    return NextResponse.json({ error: error.message || 'Erro ao atualizar afetação' }, { status })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessão obrigatória.' }, { status: 401 })
    }

    const { id } = await params
    const assignment = getWorkAssignmentById(id)

    if (!assignment) {
      return NextResponse.json({ error: 'Afetação não encontrada' }, { status: 404 })
    }

    if (!canAccessAssignment(session, assignment)) {
      return NextResponse.json({ error: 'Sem permissão para esta afetação.' }, { status: 403 })
    }

    const deleted = deleteWorkAssignment(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Afetação não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Afetação removida com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover afetação' }, { status: 500 })
  }
}
