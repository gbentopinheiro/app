import { NextResponse } from 'next/server'
import {
  classifyDeveloperOverrideError,
  DEVELOPER_OVERRIDE_ENTITY_WORK_ASSIGNMENT,
  DEVELOPER_OVERRIDE_TYPE_DAILY_PLAN_LOCK,
  DEVELOPER_WORK_ASSIGNMENTS_OVERRIDE_PERMISSION,
  isDeveloperOverrideSession,
  normalizeDeveloperOverrideReason,
  safeRecordDeveloperOverrideEvent,
} from '../../../../../lib/developer-override-events.js'
import { validateDeveloperOverrideAssignmentScope } from '../../../../../lib/developer-daily-plan-override-policy.js'
import { hasPermission } from '../../../../../lib/permissions.js'
import { getServerSession } from '../../../../../lib/server-session.js'
import { createWorkAssignmentData } from '../../../../../lib/work-assignments.js'

async function readOverrideBody(request) {
  try {
    return await request.json()
  } catch (error) {
    throw new Error('Corpo JSON invalido.')
  }
}

async function auditOverrideFailure({ session, reason, targetDate, entityId, errorMessage }) {
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
    action: 'create',
    reason,
    beforeState: null,
    afterState: null,
    result: 'failure',
    errorMessage,
  })
}

export async function POST(request) {
  let session = null
  let reason = ''
  let targetDate = null

  try {
    session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    const body = await readOverrideBody(request)
    reason = normalizeDeveloperOverrideReason(body.reason)

    if (!isDeveloperOverrideSession(session)) {
      await auditOverrideFailure({
        session,
        reason,
        targetDate: body.date || null,
        entityId: null,
        errorMessage: 'Sessao de developer obrigatoria.',
      })
      return NextResponse.json({ error: 'Sessao de developer obrigatoria.' }, { status: 403 })
    }

    if (!hasPermission(session, DEVELOPER_WORK_ASSIGNMENTS_OVERRIDE_PERMISSION)) {
      await auditOverrideFailure({
        session,
        reason,
        targetDate: body.date || null,
        entityId: null,
        errorMessage: 'Sem permissao para override tecnico de afetacoes.',
      })
      return NextResponse.json({ error: 'Sem permissao para override tecnico de afetacoes.' }, { status: 403 })
    }

    if (!reason) {
      await auditOverrideFailure({
        session,
        reason,
        targetDate: body.date || null,
        entityId: null,
        errorMessage: 'reason e obrigatorio.',
      })
      return NextResponse.json({ error: 'reason e obrigatorio.' }, { status: 400 })
    }

    const { workPlanId, workId, personId, date, hours, hourlyCost, manualHourlyCost, notes, hasWorkAccess } = body

    if (!workId || !personId || (!workPlanId && !date)) {
      await auditOverrideFailure({
        session,
        reason,
        targetDate,
        entityId: null,
        errorMessage: 'workPlanId, workId e personId sao obrigatorios',
      })
      return NextResponse.json({ error: 'workPlanId, workId e personId sao obrigatorios' }, { status: 400 })
    }

    if (date && Number.isNaN(new Date(date).getTime())) {
      await auditOverrideFailure({
        session,
        reason,
        targetDate,
        entityId: null,
        errorMessage: 'date tem de ser uma data valida',
      })
      return NextResponse.json({ error: 'date tem de ser uma data valida' }, { status: 400 })
    }

    if (hours === undefined || Number(hours) < 0) {
      await auditOverrideFailure({
        session,
        reason,
        targetDate,
        entityId: null,
        errorMessage: 'hours tem de ser 0 ou maior',
      })
      return NextResponse.json({ error: 'hours tem de ser 0 ou maior' }, { status: 400 })
    }

    if (hourlyCost !== undefined && Number(hourlyCost) < 0) {
      await auditOverrideFailure({
        session,
        reason,
        targetDate,
        entityId: null,
        errorMessage: 'hourlyCost nao pode ser negativo',
      })
      return NextResponse.json({ error: 'hourlyCost nao pode ser negativo' }, { status: 400 })
    }

    const targetScope = await validateDeveloperOverrideAssignmentScope({
      workPlanId,
      workId,
      personId,
      date,
    })
    targetDate = targetScope.targetDate

    const assignment = await createWorkAssignmentData({
      workPlanId: targetScope.workPlan.id,
      workId,
      personId,
      hours,
      hourlyCost,
      manualHourlyCost,
      notes,
      hasWorkAccess,
    })

    const auditEvent = await safeRecordDeveloperOverrideEvent({
      developerUserId: session.userId || null,
      developerUsername: session.username || session.name || 'developer',
      permissionKeyUsed: DEVELOPER_WORK_ASSIGNMENTS_OVERRIDE_PERMISSION,
      overrideType: DEVELOPER_OVERRIDE_TYPE_DAILY_PLAN_LOCK,
      entityType: DEVELOPER_OVERRIDE_ENTITY_WORK_ASSIGNMENT,
      entityId: assignment?.id || null,
      targetDate,
      action: 'create',
      reason,
      beforeState: null,
      afterState: assignment,
      result: 'success',
      errorMessage: null,
    })

    return NextResponse.json(
      {
        item: assignment,
        message: 'Afetacao criada com override tecnico do bloqueio diario.',
        overrideEventId: auditEvent?.id || null,
      },
      { status: 201 },
    )
  } catch (error) {
    const classifiedError = classifyDeveloperOverrideError(error, 'Erro ao criar afetacao com override tecnico.')

    await auditOverrideFailure({
      session,
      reason,
      targetDate,
      entityId: null,
      errorMessage: classifiedError.message,
    })

    return NextResponse.json({ error: classifiedError.message }, { status: classifiedError.status })
  }
}
