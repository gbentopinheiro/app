import { NextResponse } from 'next/server'
import { canManageEntireApp } from '../../../../lib/auth.js'
import { isDailyPlanLocked } from '../../../../lib/daily-plan-lock.js'
import { isChefRole } from '../../../../lib/roles.js'
import { getServerSession } from '../../../../lib/server-session.js'
import { deleteWorkAssignment, getAllWorkAssignments, getWorkAssignmentById, updateWorkAssignment } from '../../../../lib/work-assignments.js'

function canAccessAssignment(session, assignment) {
  if (!session || !assignment) return false
  if (canManageEntireApp(session.role)) return true
  return session.workIds.includes(Number(assignment.workId))
}

function getChefReferenceAssignments(session, filters = {}) {
  if (!session || !isChefRole(session.role)) {
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
  if (!session || !isChefRole(session.role)) {
    return true
  }

  const referenceAssignments = getChefReferenceAssignments(session, { workPlanId, date })

  return referenceAssignments.some(
    assignment =>
      Number(assignment.workId) === Number(workId) &&
      Number(assignment.personId) === Number(personId),
  )
}

function isDailyPlanStructureUpdate(body) {
  return (
    body.workPlanId !== undefined ||
    body.workId !== undefined ||
    body.personId !== undefined ||
    body.date !== undefined ||
    body.hourlyCost !== undefined ||
    body.notes !== undefined ||
    body.manualHourlyCost !== undefined ||
    body.hasWorkAccess !== undefined
  )
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    const { id } = await params
    const assignment = getWorkAssignmentById(id)

    if (!assignment) {
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    if (!canAccessAssignment(session, assignment)) {
      return NextResponse.json({ error: 'Sem permissao para esta afetacao.' }, { status: 403 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter afetacao' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    const { id } = await params
    const currentAssignment = getWorkAssignmentById(id)

    if (!currentAssignment) {
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    if (!canAccessAssignment(session, currentAssignment)) {
      return NextResponse.json({ error: 'Sem permissao para esta afetacao.' }, { status: 403 })
    }

    const body = await request.json()
    const { workPlanId, workId, personId, date, hours, hourlyCost, manualHourlyCost, notes, hasWorkAccess, submitted } = body
    
    if (isDailyPlanLocked(currentAssignment.date) && isDailyPlanStructureUpdate(body)) {
      return NextResponse.json(
        { error: 'Depois das 08:00 ja nao e possivel alterar o plano diario deste dia.' },
        { status: 403 },
      )
    }

    const targetWorkId = workId !== undefined ? Number(workId) : Number(currentAssignment.workId)
    const targetPersonId = personId !== undefined ? Number(personId) : Number(currentAssignment.personId)
    const targetWorkPlanId = workPlanId !== undefined ? workPlanId : currentAssignment.workPlan?.id
    const targetDate = date !== undefined ? date : currentAssignment.date

    if (isChefRole(session.role) && workId !== undefined && !session.workIds.includes(Number(workId))) {
      return NextResponse.json({ error: 'Sem permissao para mover a afetacao para essa obra.' }, { status: 403 })
    }

    if (!isChefPersonAllowedForWork(session, {
      workPlanId: targetWorkPlanId,
      date: targetDate,
      workId: targetWorkId,
      personId: targetPersonId,
    })) {
      return NextResponse.json(
        { error: 'O chefe so pode registar pessoas colocadas pelo administrador no plano diario dessa obra.' },
        { status: 403 },
      )
    }

    if (date && Number.isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: 'date tem de ser uma data valida' }, { status: 400 })
    }

    if (hours !== undefined && Number(hours) < 0) {
      return NextResponse.json({ error: 'hours tem de ser 0 ou maior' }, { status: 400 })
    }

    if (hourlyCost !== undefined && Number(hourlyCost) < 0) {
      return NextResponse.json({ error: 'hourlyCost nao pode ser negativo' }, { status: 400 })
    }

    const shouldAutoSubmitFromAdmin = canManageEntireApp(session.role) && hours !== undefined

    if (submitted !== undefined && !shouldAutoSubmitFromAdmin) {
      return NextResponse.json(
        { error: 'O status so pode ser alterado pelo fluxo de submissao do chefe.' },
        { status: 403 },
      )
    }

    const submittedAt = shouldAutoSubmitFromAdmin
      ? currentAssignment.submittedAt || new Date().toISOString()
      : undefined
    const submittedBy = shouldAutoSubmitFromAdmin
      ? currentAssignment.submittedBy || session.name || session.id || 'Administrador'
      : undefined

    const assignment = updateWorkAssignment(id, {
      workPlanId,
      workId,
      personId,
      date,
      hours,
      hourlyCost,
      manualHourlyCost,
      notes,
      hasWorkAccess,
      submitted: shouldAutoSubmitFromAdmin ? true : undefined,
      submittedAt,
      submittedBy,
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    const status = String(error.message || '').includes('nao encontrado') ? 404 : 500
    return NextResponse.json({ error: error.message || 'Erro ao atualizar afetacao' }, { status })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    const { id } = await params
    const assignment = getWorkAssignmentById(id)

    if (!assignment) {
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    if (!canAccessAssignment(session, assignment)) {
      return NextResponse.json({ error: 'Sem permissao para esta afetacao.' }, { status: 403 })
    }

    if (isDailyPlanLocked(assignment.date)) {
      return NextResponse.json(
        { error: 'Depois das 08:00 ja nao e possivel alterar o plano diario deste dia.' },
        { status: 403 },
      )
    }

    const deleted = deleteWorkAssignment(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Afetacao removida com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover afetacao' }, { status: 500 })
  }
}
