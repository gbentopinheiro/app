import { prisma } from '../prisma.js'
import { toDateTimeString, toOptionalString, toPositiveInt, toRequiredString } from './core-mappers.js'

const MAX_AUDIT_TRAIL_EVENTS_DB = 10000

function toDateTimeValue(value, fallback = null) {
  if (!value) {
    return fallback
  }

  const candidate = value instanceof Date ? value : new Date(value)
  return Number.isNaN(candidate.getTime()) ? fallback : candidate
}

function toJsonObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return JSON.parse(JSON.stringify(value))
}

function mapAuditTrailEventRecord(record) {
  if (!record) {
    return null
  }

  return {
    id: toRequiredString(record.id),
    timestamp: toDateTimeString(record.timestamp),
    username: toRequiredString(record.username || 'system') || 'system',
    action: toRequiredString(record.action),
    entity: toRequiredString(record.entity),
    entityId: toPositiveInt(record.entityId, null),
    details: toJsonObject(record.details),
    result: toRequiredString(record.result || 'success') || 'success',
    errorMessage: toOptionalString(record.errorMessage),
  }
}

function buildAuditTrailEventMutationData(data, currentRecord = null) {
  return {
    id:
      data?.id !== undefined
        ? toRequiredString(data.id)
        : toRequiredString(currentRecord?.id),
    timestamp:
      data?.timestamp !== undefined
        ? toDateTimeValue(data.timestamp)
        : toDateTimeValue(currentRecord?.timestamp),
    username:
      data?.username !== undefined
        ? toRequiredString(data.username || 'system') || 'system'
        : toRequiredString(currentRecord?.username || 'system') || 'system',
    action:
      data?.action !== undefined
        ? toRequiredString(data.action)
        : toRequiredString(currentRecord?.action),
    entity:
      data?.entity !== undefined
        ? toRequiredString(data.entity)
        : toRequiredString(currentRecord?.entity),
    entityId:
      data?.entityId !== undefined
        ? toPositiveInt(data.entityId, null)
        : toPositiveInt(currentRecord?.entityId, null),
    details:
      data?.details !== undefined
        ? toJsonObject(data.details)
        : toJsonObject(currentRecord?.details),
    result:
      data?.result !== undefined
        ? toRequiredString(data.result || 'success') || 'success'
        : toRequiredString(currentRecord?.result || 'success') || 'success',
    errorMessage:
      data?.errorMessage !== undefined
        ? toOptionalString(data.errorMessage)
        : toOptionalString(currentRecord?.errorMessage),
  }
}

async function trimAuditTrailEventsDb(limit = MAX_AUDIT_TRAIL_EVENTS_DB) {
  const normalizedLimit = Math.max(Number(limit) || 0, 0)

  if (!normalizedLimit) {
    return
  }

  const staleRecords = await prisma.auditTrailEvent.findMany({
    orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
    skip: normalizedLimit,
    select: {
      id: true,
    },
  })

  if (staleRecords.length === 0) {
    return
  }

  await prisma.auditTrailEvent.deleteMany({
    where: {
      id: {
        in: staleRecords.map(record => String(record.id)),
      },
    },
  })
}

export async function getAllAuditTrailEventsDb() {
  const auditTrailEvents = await prisma.auditTrailEvent.findMany({
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
  })

  return auditTrailEvents.map(mapAuditTrailEventRecord).filter(Boolean)
}

export async function createAuditTrailEventDb(data) {
  const nextAuditTrailEventState = buildAuditTrailEventMutationData(
    {
      ...data,
      timestamp: data?.timestamp || new Date().toISOString(),
    },
    null,
  )

  if (
    !nextAuditTrailEventState.id ||
    !nextAuditTrailEventState.timestamp ||
    !nextAuditTrailEventState.action ||
    !nextAuditTrailEventState.entity
  ) {
    return null
  }

  let loginEventId = nextAuditTrailEventState.id
  let duplicateSuffix = 1

  while (await prisma.auditTrailEvent.findUnique({ where: { id: loginEventId }, select: { id: true } })) {
    loginEventId = `${nextAuditTrailEventState.id}-${duplicateSuffix++}`
  }

  const auditTrailEvent = await prisma.auditTrailEvent.create({
    data: {
      ...nextAuditTrailEventState,
      id: loginEventId,
    },
  })

  await trimAuditTrailEventsDb()
  return mapAuditTrailEventRecord(auditTrailEvent)
}

export async function replaceAllAuditTrailEventsDb(auditTrailEvents = []) {
  const normalizedAuditTrailEvents = Array.isArray(auditTrailEvents)
    ? auditTrailEvents
        .map((auditTrailEvent, index) => {
          const nextAuditTrailEventState = buildAuditTrailEventMutationData(auditTrailEvent, null)
          const normalizedId = toRequiredString(auditTrailEvent?.id || String(Date.now() + index))

          if (
            !normalizedId ||
            !nextAuditTrailEventState.timestamp ||
            !nextAuditTrailEventState.action ||
            !nextAuditTrailEventState.entity
          ) {
            return null
          }

          return {
            ...nextAuditTrailEventState,
            id: normalizedId,
          }
        })
        .filter(Boolean)
    : []

  await prisma.$transaction(async transaction => {
    await transaction.auditTrailEvent.deleteMany()

    if (normalizedAuditTrailEvents.length > 0) {
      await transaction.auditTrailEvent.createMany({
        data: normalizedAuditTrailEvents,
      })
    }
  })

  return normalizedAuditTrailEvents.map(mapAuditTrailEventRecord).filter(Boolean)
}
