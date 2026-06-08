import { NextResponse } from 'next/server'
import { canManageEntireApp } from '../../../../lib/auth.js'
import { isDailyPlanLocked } from '../../../../lib/daily-plan-lock.js'
import { hasPermission } from '../../../../lib/permissions.js'
import { getServerSession } from '../../../../lib/server-session.js'
import {
  canAccessAssignment,
  canAccessWork,
  isChefPersonAllowedForWork,
  isDailyPlanStructureUpdate,
} from '../../../../lib/work-assignment-policy.js'
import {
  deleteWorkAssignmentData,
  getWorkAssignmentByIdData,
  updateWorkAssignmentData,
} from '../../../../lib/work-assignments.js'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'work_assignments.read')) {
      return NextResponse.json({ error: 'Sem permissao para consultar afetacoes.' }, { status: 403 })
    }

    const { id } = await params
    const assignment = await getWorkAssignmentByIdData(id)

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

    if (!hasPermission(session, 'work_assignments.update')) {
      return NextResponse.json({ error: 'Sem permissao para atualizar afetacoes.' }, { status: 403 })
    }

    const { id } = await params
    const currentAssignment = await getWorkAssignmentByIdData(id)

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

    if (workId !== undefined && !canAccessWork(session, workId)) {
      return NextResponse.json({ error: 'Sem permissao para mover a afetacao para essa obra.' }, { status: 403 })
    }

    if (!(await isChefPersonAllowedForWork(session, {
      workPlanId: targetWorkPlanId,
      date: targetDate,
      workId: targetWorkId,
      personId: targetPersonId,
    }))) {
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

    const assignment = await updateWorkAssignmentData(id, {
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
    }, {
      actorSession: shouldAutoSubmitFromAdmin ? session : null,
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

    if (!hasPermission(session, 'work_assignments.delete')) {
      return NextResponse.json({ error: 'Sem permissao para remover afetacoes.' }, { status: 403 })
    }

    const { id } = await params
    const assignment = await getWorkAssignmentByIdData(id)

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

    const deleted = await deleteWorkAssignmentData(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Afetacao removida com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover afetacao' }, { status: 500 })
  }
}
