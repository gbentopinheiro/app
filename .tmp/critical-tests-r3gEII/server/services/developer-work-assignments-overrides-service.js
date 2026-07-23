import { canManageEntireApp } from '../../lib/auth.js'
import {
  assertDeveloperOverrideWorkAssignment,
  validateDeveloperOverrideAssignmentScope,
} from '../../lib/developer-daily-plan-override-policy.js'
import {
  DEVELOPER_OVERRIDE_ENTITY_WORK_ASSIGNMENT,
  DEVELOPER_OVERRIDE_TYPE_DAILY_PLAN_LOCK,
  DEVELOPER_WORK_ASSIGNMENTS_OVERRIDE_PERMISSION,
  isDeveloperOverrideSession,
  normalizeDeveloperOverrideReason,
  safeRecordDeveloperOverrideEvent,
} from '../../lib/developer-override-events.js'
import { hasPermission } from '../../lib/permissions.js'
import {
  createWorkAssignmentData,
  deleteWorkAssignmentData,
  getWorkAssignmentByIdData,
  updateWorkAssignmentData,
} from '../../lib/work-assignments.js'
import { HttpError } from '../errors/http-error.js'

export function normalizeDeveloperWorkAssignmentOverrideReason(value) {
  return normalizeDeveloperOverrideReason(value)
}

export async function readDeveloperWorkAssignmentOverrideBody(request) {
  try {
    return await request.json()
  } catch (error) {
    throw new Error('Corpo JSON invalido.')
  }
}

function ensureDeveloperOverrideSession(session) {
  if (!session) {
    throw new HttpError(401, 'Sessao obrigatoria.')
  }

  if (!isDeveloperOverrideSession(session)) {
    throw new HttpError(403, 'Sessao de developer obrigatoria.')
  }

  if (!hasPermission(session, DEVELOPER_WORK_ASSIGNMENTS_OVERRIDE_PERMISSION)) {
    throw new HttpError(403, 'Sem permissao para override tecnico de afetacoes.')
  }
}

function ensureDeveloperOverrideReason(reason) {
  if (!reason) {
    throw new HttpError(400, 'reason e obrigatorio.')
  }
}

function validateCreateOverridePayload(body) {
  const { workPlanId, workId, personId, date, hours, hourlyCost } = body || {}

  if (!workId || !personId || (!workPlanId && !date)) {
    throw new HttpError(400, 'workPlanId, workId e personId sao obrigatorios')
  }

  if (date && Number.isNaN(new Date(date).getTime())) {
    throw new HttpError(400, 'date tem de ser uma data valida')
  }

  if (hours === undefined || Number(hours) < 0) {
    throw new HttpError(400, 'hours tem de ser 0 ou maior')
  }

  if (hourlyCost !== undefined && Number(hourlyCost) < 0) {
    throw new HttpError(400, 'hourlyCost nao pode ser negativo')
  }
}

function validateUpdateOverridePayload(body) {
  const { date, hours, hourlyCost } = body || {}

  if (date && Number.isNaN(new Date(date).getTime())) {
    throw new HttpError(400, 'date tem de ser uma data valida')
  }

  if (hours !== undefined && Number(hours) < 0) {
    throw new HttpError(400, 'hours tem de ser 0 ou maior')
  }

  if (hourlyCost !== undefined && Number(hourlyCost) < 0) {
    throw new HttpError(400, 'hourlyCost nao pode ser negativo')
  }
}

export async function auditDeveloperWorkAssignmentOverrideFailure({
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

export async function recordDeveloperWorkAssignmentOverrideSuccess({
  session,
  action,
  reason,
  entityId,
  targetDate,
  beforeState,
  afterState,
}) {
  return safeRecordDeveloperOverrideEvent({
    developerUserId: session?.userId || null,
    developerUsername: session?.username || session?.name || 'developer',
    permissionKeyUsed: DEVELOPER_WORK_ASSIGNMENTS_OVERRIDE_PERMISSION,
    overrideType: DEVELOPER_OVERRIDE_TYPE_DAILY_PLAN_LOCK,
    entityType: DEVELOPER_OVERRIDE_ENTITY_WORK_ASSIGNMENT,
    entityId,
    targetDate,
    action,
    reason,
    beforeState,
    afterState,
    result: 'success',
    errorMessage: null,
  })
}

export async function getDeveloperOverrideWorkAssignmentService(session, id) {
  ensureDeveloperOverrideSession(session)

  const assignment = await getWorkAssignmentByIdData(id)

  if (!assignment) {
    throw new HttpError(404, 'Afetacao nao encontrada')
  }

  await assertDeveloperOverrideWorkAssignment(assignment)

  return assignment
}

export async function createDeveloperOverrideWorkAssignmentService(session, body, context = {}) {
  ensureDeveloperOverrideSession(session)
  ensureDeveloperOverrideReason(context.reason)
  validateCreateOverridePayload(body)

  const {
    workPlanId,
    workId,
    personId,
    date,
    hours,
    hourlyCost,
    manualHourlyCost,
    notes,
    hasWorkAccess,
  } = body || {}

  const targetScope = await validateDeveloperOverrideAssignmentScope({
    workPlanId,
    workId,
    personId,
    date,
  })
  context.targetDate = targetScope.targetDate

  return createWorkAssignmentData({
    workPlanId: targetScope.workPlan.id,
    workId,
    personId,
    hours,
    hourlyCost,
    manualHourlyCost,
    notes,
    hasWorkAccess,
  })
}

export async function updateDeveloperOverrideWorkAssignmentService(session, id, body, context = {}) {
  const { workPlanId, workId, personId, date, hours, hourlyCost, manualHourlyCost, notes, hasWorkAccess, submitted } = body || {}

  context.entityId = Number(id)
  context.beforeState = await getWorkAssignmentByIdData(id)
  context.targetDate = date !== undefined ? date : context.beforeState?.date || null

  ensureDeveloperOverrideSession(session)

  if (!context.beforeState) {
    throw new HttpError(404, 'Afetacao nao encontrada')
  }

  await assertDeveloperOverrideWorkAssignment(context.beforeState)
  ensureDeveloperOverrideReason(context.reason)
  validateUpdateOverridePayload(body)

  const targetScope = await validateDeveloperOverrideAssignmentScope({
    currentAssignment: context.beforeState,
    workPlanId,
    workId,
    personId,
    date,
  })
  context.targetDate = targetScope.targetDate

  const shouldAutoSubmitFromAdmin = canManageEntireApp(session.role) && hours !== undefined

  if (submitted !== undefined && !shouldAutoSubmitFromAdmin) {
    throw new HttpError(403, 'O status so pode ser alterado pelo fluxo de submissao do chefe.')
  }

  const submittedAt = shouldAutoSubmitFromAdmin
    ? context.beforeState.submittedAt || new Date().toISOString()
    : undefined
  const submittedBy = shouldAutoSubmitFromAdmin
    ? context.beforeState.submittedBy || session.name || session.id || 'Administrador'
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
    throw new HttpError(404, 'Afetacao nao encontrada')
  }

  return assignment
}

export async function deleteDeveloperOverrideWorkAssignmentService(session, id, context = {}) {
  context.entityId = Number(id)
  context.beforeState = await getWorkAssignmentByIdData(id)
  context.targetDate = context.beforeState?.date || null

  ensureDeveloperOverrideSession(session)

  if (!context.beforeState) {
    throw new HttpError(404, 'Afetacao nao encontrada')
  }

  await assertDeveloperOverrideWorkAssignment(context.beforeState)
  ensureDeveloperOverrideReason(context.reason)

  const deleted = await deleteWorkAssignmentData(id)

  if (!deleted) {
    throw new HttpError(404, 'Afetacao nao encontrada')
  }

  return {
    message: 'Afetacao removida com override tecnico do bloqueio diario.',
  }
}
