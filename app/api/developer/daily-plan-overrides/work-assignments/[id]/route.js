import { NextResponse } from 'next/server'
import { canManageEntireApp } from '../../../../../../lib/auth.js'
import {
  assertDeveloperOverrideWorkAssignment,
  validateDeveloperOverrideAssignmentScope,
} from '../../../../../../lib/developer-daily-plan-override-policy.js'
import {
  classifyDeveloperOverrideError,
  DEVELOPER_OVERRIDE_ENTITY_WORK_ASSIGNMENT,
  DEVELOPER_OVERRIDE_TYPE_DAILY_PLAN_LOCK,
  DEVELOPER_WORK_ASSIGNMENTS_OVERRIDE_PERMISSION,
  isDeveloperOverrideSession,
  normalizeDeveloperOverrideReason,
  safeRecordDeveloperOverrideEvent,
} from '../../../../../../lib/developer-override-events.js'
import { hasPermission } from '../../../../../../lib/permissions.js'
import { getServerSession } from '../../../../../../lib/server-session.js'
import {
  deleteWorkAssignmentData,
  getWorkAssignmentByIdData,
  updateWorkAssignmentData,
} from '../../../../../../lib/work-assignments.js'

async function readOverrideBody(request) {
  try {
    return await request.json()
  } catch (error) {
    throw new Error('Corpo JSON invalido.')
  }
}

async function auditOverrideFailure({
  session,
  action,
  reason,
  entityId,
  targetDate,
  beforeState,
  errorMessage,
}) {
  if (!session) {
    return null
  }

  return safeRecordDeveloperOverrideEvent({
    developerUserId: session.userId || null,
    developerUsername: session.username || session.name || 'developer',
    permissionKeyUsed: DEVELOPER_WORK_ASSIGNMENTS_OVERRIDE_PERMISSION,
    overrideType: DEVELOPER_OVERRIDE_TYPE_DAILY_PLAN_LOCK,
    entityType: DEVELOPER_OVERRIDE_ENTITY_WORK_ASSIGNMENT,
    entityId,
    targetDate,
    action,
    reason,
    beforeState,
    afterState: null,
    result: 'failure',
    errorMessage,
  })
}

async function requireOverrideSession(session, reason, entityId, targetDate, beforeState, action) {
  if (!session) {
    return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
  }

  if (!isDeveloperOverrideSession(session)) {
    await auditOverrideFailure({
      session,
      action,
      reason,
      entityId,
      targetDate,
      beforeState,
      errorMessage: 'Sessao de developer obrigatoria.',
    })
    return NextResponse.json({ error: 'Sessao de developer obrigatoria.' }, { status: 403 })
  }

  if (!hasPermission(session, DEVELOPER_WORK_ASSIGNMENTS_OVERRIDE_PERMISSION)) {
    await auditOverrideFailure({
      session,
      action,
      reason,
      entityId,
      targetDate,
      beforeState,
      errorMessage: 'Sem permissao para override tecnico de afetacoes.',
    })
    return NextResponse.json({ error: 'Sem permissao para override tecnico de afetacoes.' }, { status: 403 })
  }

  return null
}

export async function GET(_request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!isDeveloperOverrideSession(session)) {
      return NextResponse.json({ error: 'Sessao de developer obrigatoria.' }, { status: 403 })
    }

    if (!hasPermission(session, DEVELOPER_WORK_ASSIGNMENTS_OVERRIDE_PERMISSION)) {
      return NextResponse.json({ error: 'Sem permissao para override tecnico de afetacoes.' }, { status: 403 })
    }

    const { id } = await params
    const assignment = await getWorkAssignmentByIdData(id)

    if (!assignment) {
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    await assertDeveloperOverrideWorkAssignment(assignment)

    return NextResponse.json({ item: assignment })
  } catch (error) {
    const classifiedError = classifyDeveloperOverrideError(error, 'Erro ao carregar afetacao para override tecnico.')
    return NextResponse.json({ error: classifiedError.message }, { status: classifiedError.status })
  }
}

export async function PUT(request, { params }) {
  let session = null
  let reason = ''
  let beforeState = null
  let targetDate = null
  let entityId = null

  try {
    session = await getServerSession()
    const body = await readOverrideBody(request)
    reason = normalizeDeveloperOverrideReason(body.reason)
    const { id } = await params
    entityId = Number(id)

    beforeState = await getWorkAssignmentByIdData(id)
    targetDate = body.date !== undefined ? body.date : beforeState?.date || null

    const authFailureResponse = await requireOverrideSession(
      session,
      reason,
      entityId,
      targetDate,
      beforeState,
      'update',
    )

    if (authFailureResponse) {
      return authFailureResponse
    }

    if (!beforeState) {
      await auditOverrideFailure({
        session,
        action: 'update',
        reason,
        entityId,
        targetDate,
        beforeState: null,
        errorMessage: 'Afetacao nao encontrada',
      })
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    await assertDeveloperOverrideWorkAssignment(beforeState)

    if (!reason) {
      await auditOverrideFailure({
        session,
        action: 'update',
        reason,
        entityId,
        targetDate,
        beforeState,
        errorMessage: 'reason e obrigatorio.',
      })
      return NextResponse.json({ error: 'reason e obrigatorio.' }, { status: 400 })
    }

    const { workPlanId, workId, personId, date, hours, hourlyCost, manualHourlyCost, notes, hasWorkAccess, submitted } = body

    if (date && Number.isNaN(new Date(date).getTime())) {
      await auditOverrideFailure({
        session,
        action: 'update',
        reason,
        entityId,
        targetDate,
        beforeState,
        errorMessage: 'date tem de ser uma data valida',
      })
      return NextResponse.json({ error: 'date tem de ser uma data valida' }, { status: 400 })
    }

    if (hours !== undefined && Number(hours) < 0) {
      await auditOverrideFailure({
        session,
        action: 'update',
        reason,
        entityId,
        targetDate,
        beforeState,
        errorMessage: 'hours tem de ser 0 ou maior',
      })
      return NextResponse.json({ error: 'hours tem de ser 0 ou maior' }, { status: 400 })
    }

    if (hourlyCost !== undefined && Number(hourlyCost) < 0) {
      await auditOverrideFailure({
        session,
        action: 'update',
        reason,
        entityId,
        targetDate,
        beforeState,
        errorMessage: 'hourlyCost nao pode ser negativo',
      })
      return NextResponse.json({ error: 'hourlyCost nao pode ser negativo' }, { status: 400 })
    }

    const targetScope = await validateDeveloperOverrideAssignmentScope({
      currentAssignment: beforeState,
      workPlanId,
      workId,
      personId,
      date,
    })
    targetDate = targetScope.targetDate

    const shouldAutoSubmitFromAdmin = canManageEntireApp(session.role) && hours !== undefined

    if (submitted !== undefined && !shouldAutoSubmitFromAdmin) {
      await auditOverrideFailure({
        session,
        action: 'update',
        reason,
        entityId,
        targetDate,
        beforeState,
        errorMessage: 'O status so pode ser alterado pelo fluxo de submissao do chefe.',
      })
      return NextResponse.json(
        { error: 'O status so pode ser alterado pelo fluxo de submissao do chefe.' },
        { status: 403 },
      )
    }

    const submittedAt = shouldAutoSubmitFromAdmin
      ? beforeState.submittedAt || new Date().toISOString()
      : undefined
    const submittedBy = shouldAutoSubmitFromAdmin
      ? beforeState.submittedBy || session.name || session.id || 'Administrador'
      : undefined

    const assignment = await updateWorkAssignmentData(
      id,
      {
        workPlanId: targetScope.workPlan.id,
        workId: targetScope.work.id,
        personId: targetScope.person.id,
        hours,
        hourlyCost,
        manualHourlyCost,
        notes,
        hasWorkAccess,
        submitted: shouldAutoSubmitFromAdmin ? true : undefined,
        submittedAt,
        submittedBy,
      },
      {
        actorSession: shouldAutoSubmitFromAdmin ? session : null,
      },
    )

    if (!assignment) {
      await auditOverrideFailure({
        session,
        action: 'update',
        reason,
        entityId,
        targetDate,
        beforeState,
        errorMessage: 'Afetacao nao encontrada',
      })
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    const auditEvent = await safeRecordDeveloperOverrideEvent({
      developerUserId: session.userId || null,
      developerUsername: session.username || session.name || 'developer',
      permissionKeyUsed: DEVELOPER_WORK_ASSIGNMENTS_OVERRIDE_PERMISSION,
      overrideType: DEVELOPER_OVERRIDE_TYPE_DAILY_PLAN_LOCK,
      entityType: DEVELOPER_OVERRIDE_ENTITY_WORK_ASSIGNMENT,
      entityId: assignment.id,
      targetDate: assignment.date || targetDate,
      action: 'update',
      reason,
      beforeState,
      afterState: assignment,
      result: 'success',
      errorMessage: null,
    })

    return NextResponse.json({
      item: assignment,
      message: 'Afetacao atualizada com override tecnico do bloqueio diario.',
      overrideEventId: auditEvent?.id || null,
    })
  } catch (error) {
    const classifiedError = classifyDeveloperOverrideError(error, 'Erro ao atualizar afetacao com override tecnico.')

    await auditOverrideFailure({
      session,
      action: 'update',
      reason,
      entityId,
      targetDate,
      beforeState,
      errorMessage: classifiedError.message,
    })

    return NextResponse.json({ error: classifiedError.message }, { status: classifiedError.status })
  }
}

export async function DELETE(request, { params }) {
  let session = null
  let reason = ''
  let beforeState = null
  let targetDate = null
  let entityId = null

  try {
    session = await getServerSession()
    const body = await readOverrideBody(request)
    reason = normalizeDeveloperOverrideReason(body.reason)
    const { id } = await params
    entityId = Number(id)

    beforeState = await getWorkAssignmentByIdData(id)
    targetDate = beforeState?.date || null

    const authFailureResponse = await requireOverrideSession(
      session,
      reason,
      entityId,
      targetDate,
      beforeState,
      'delete',
    )

    if (authFailureResponse) {
      return authFailureResponse
    }

    if (!beforeState) {
      await auditOverrideFailure({
        session,
        action: 'delete',
        reason,
        entityId,
        targetDate,
        beforeState: null,
        errorMessage: 'Afetacao nao encontrada',
      })
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    await assertDeveloperOverrideWorkAssignment(beforeState)

    if (!reason) {
      await auditOverrideFailure({
        session,
        action: 'delete',
        reason,
        entityId,
        targetDate,
        beforeState,
        errorMessage: 'reason e obrigatorio.',
      })
      return NextResponse.json({ error: 'reason e obrigatorio.' }, { status: 400 })
    }

    const deleted = await deleteWorkAssignmentData(id)

    if (!deleted) {
      await auditOverrideFailure({
        session,
        action: 'delete',
        reason,
        entityId,
        targetDate,
        beforeState,
        errorMessage: 'Afetacao nao encontrada',
      })
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    const auditEvent = await safeRecordDeveloperOverrideEvent({
      developerUserId: session.userId || null,
      developerUsername: session.username || session.name || 'developer',
      permissionKeyUsed: DEVELOPER_WORK_ASSIGNMENTS_OVERRIDE_PERMISSION,
      overrideType: DEVELOPER_OVERRIDE_TYPE_DAILY_PLAN_LOCK,
      entityType: DEVELOPER_OVERRIDE_ENTITY_WORK_ASSIGNMENT,
      entityId,
      targetDate,
      action: 'delete',
      reason,
      beforeState,
      afterState: null,
      result: 'success',
      errorMessage: null,
    })

    return NextResponse.json({
      message: 'Afetacao removida com override tecnico do bloqueio diario.',
      overrideEventId: auditEvent?.id || null,
    })
  } catch (error) {
    const classifiedError = classifyDeveloperOverrideError(error, 'Erro ao remover afetacao com override tecnico.')

    await auditOverrideFailure({
      session,
      action: 'delete',
      reason,
      entityId,
      targetDate,
      beforeState,
      errorMessage: classifiedError.message,
    })

    return NextResponse.json({ error: classifiedError.message }, { status: classifiedError.status })
  }
}
