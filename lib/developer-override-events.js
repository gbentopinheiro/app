import { logAuditEvent } from './audit-trail.js'
import { prisma } from './prisma.js'

export const DEVELOPER_WORK_PLANS_OVERRIDE_PERMISSION = 'developer.work_plans.override_lock'
export const DEVELOPER_WORK_ASSIGNMENTS_OVERRIDE_PERMISSION = 'developer.work_assignments.override_lock'
export const DEVELOPER_OVERRIDE_TYPE_DAILY_PLAN_LOCK = 'daily_plan_lock'
export const DEVELOPER_OVERRIDE_ENTITY_WORK_ASSIGNMENT = 'work_assignment'

export function isDeveloperOverrideSession(session) {
  if (!session) {
    return false
  }

  return (
    String(session.accessProfile || '').trim() === 'developer' ||
    String(session.accountType || '').trim() === 'developer' ||
    String(session.role || '').trim() === 'developer'
  )
}

export function normalizeDeveloperOverrideReason(value) {
  return String(value || '').trim()
}

export function serializeDeveloperOverrideState(value) {
  if (value === undefined || value === null) {
    return null
  }

  return JSON.parse(JSON.stringify(value))
}

export function classifyDeveloperOverrideError(error, fallbackMessage = 'Erro ao aplicar override tecnico.') {
  const message = String(error?.message || fallbackMessage).trim() || fallbackMessage
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('sessao obrigatoria')) {
    return { status: 401, message }
  }

  if (normalizedMessage.includes('sem permissao')) {
    return { status: 403, message }
  }

  if (
    normalizedMessage.includes('obrigatori') ||
    normalizedMessage.includes('json invalido') ||
    normalizedMessage.includes('coincidir com a data do work plan') ||
    normalizedMessage.includes('data valida') ||
    normalizedMessage.includes('0 ou maior') ||
    normalizedMessage.includes('nao pode ser negativo')
  ) {
    return { status: 400, message }
  }

  if (normalizedMessage.includes('nao encontrada') || normalizedMessage.includes('nao encontrado')) {
    return { status: 404, message }
  }

  if (normalizedMessage.includes('fora do contexto tecnico permitido')) {
    return { status: 403, message }
  }

  if (
    normalizedMessage.includes('ja foi submetida') ||
    normalizedMessage.includes('nao faz parte do plano diario alvo') ||
    normalizedMessage.includes('mesma empresa') ||
    normalizedMessage.includes('nao pode ser modificada') ||
    normalizedMessage.includes('duplic')
  ) {
    return { status: 409, message }
  }

  return { status: 500, message }
}

function normalizeDeveloperOverrideTargetDate(value) {
  if (!value) {
    return null
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
  }

  const rawValue = String(value).trim()
  const dateMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (dateMatch) {
    return new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T00:00:00.000Z`)
  }

  const parsedValue = new Date(rawValue)

  if (Number.isNaN(parsedValue.getTime())) {
    return null
  }

  return new Date(Date.UTC(parsedValue.getUTCFullYear(), parsedValue.getUTCMonth(), parsedValue.getUTCDate()))
}

export async function recordDeveloperOverrideEvent({
  developerUserId = null,
  developerUsername = 'developer',
  permissionKeyUsed,
  overrideType,
  entityType,
  entityId = null,
  targetDate = null,
  action,
  reason,
  beforeState = null,
  afterState = null,
  result = 'success',
  errorMessage = null,
}) {
  const recordData = {
    developerUserId: developerUserId ? Number(developerUserId) : null,
    developerUsername: String(developerUsername || 'developer').trim() || 'developer',
    permissionKeyUsed: String(permissionKeyUsed || '').trim(),
    overrideType: String(overrideType || '').trim(),
    entityType: String(entityType || '').trim(),
    entityId: entityId !== undefined && entityId !== null ? Number(entityId) : null,
    targetDate: normalizeDeveloperOverrideTargetDate(targetDate),
    action: String(action || '').trim(),
    reason: normalizeDeveloperOverrideReason(reason),
    beforeState: serializeDeveloperOverrideState(beforeState),
    afterState: serializeDeveloperOverrideState(afterState),
    result: String(result || 'success').trim() || 'success',
    errorMessage: errorMessage ? String(errorMessage) : null,
  }

  const event = await prisma.developerOverrideEvent.create({
    data: recordData,
  })

  try {
    await logAuditEvent({
      username: recordData.developerUsername,
      action: `developer_override_${recordData.action}`,
      entity: recordData.entityType,
      entityId: recordData.entityId,
      details: {
        overrideType: recordData.overrideType,
        permissionKeyUsed: recordData.permissionKeyUsed,
        reason: recordData.reason,
        targetDate:
          recordData.targetDate instanceof Date && !Number.isNaN(recordData.targetDate.getTime())
            ? recordData.targetDate.toISOString().slice(0, 10)
            : null,
        beforeState: recordData.beforeState,
        afterState: recordData.afterState,
      },
      result: recordData.result,
      errorMessage: recordData.errorMessage,
    })
  } catch (auditTrailError) {
    console.error('Falha ao espelhar override tecnico no trilho de auditoria legado:', auditTrailError)
  }

  return event
}

export async function safeRecordDeveloperOverrideEvent(payload) {
  try {
    return await recordDeveloperOverrideEvent(payload)
  } catch (error) {
    console.error('Falha ao registar evento de developer override:', error)
    return null
  }
}
