import { normalizeAccountType } from '../account-types.js'
import { prisma } from '../prisma.js'
import { isSupportedRole, normalizeRole } from '../roles.js'
import { toDateTimeString, toOptionalString, toPositiveInt, toRequiredString } from './core-mappers.js'

const MAX_LOGIN_EVENTS_DB = 2000

function toDateTimeValue(value, fallback = null) {
  if (!value) {
    return fallback
  }

  const candidate = value instanceof Date ? value : new Date(value)
  return Number.isNaN(candidate.getTime()) ? fallback : candidate
}

function normalizeLoginEventRole(value) {
  const normalizedValue = String(value || '').trim().toLowerCase()

  if (!normalizedValue || !isSupportedRole(normalizedValue)) {
    return null
  }

  return normalizeRole(normalizedValue)
}

function mapLoginEventRecord(record) {
  if (!record) {
    return null
  }

  return {
    id: Number(record.id),
    userId: toPositiveInt(record.userId, null),
    personId: toPositiveInt(record.personId, null),
    username: toRequiredString(record.username),
    name: toRequiredString(record.name || record.username),
    role: record.role ? normalizeRole(record.role) : '',
    accountType: normalizeAccountType(record.accountType),
    loginAt: toDateTimeString(record.loginAt),
    userAgent: toRequiredString(record.userAgent),
  }
}

function buildLoginEventMutationData(data, currentLoginEvent = null) {
  const accountType = normalizeAccountType(
    data?.accountType,
    normalizeAccountType(currentLoginEvent?.accountType),
  )
  const loginAt =
    data?.loginAt !== undefined
      ? toDateTimeValue(data.loginAt)
      : toDateTimeValue(currentLoginEvent?.loginAt)

  return {
    userId:
      data?.userId !== undefined
        ? toPositiveInt(data.userId, null)
        : toPositiveInt(currentLoginEvent?.userId, null),
    personId:
      data?.personId !== undefined
        ? toPositiveInt(data.personId, null)
        : toPositiveInt(currentLoginEvent?.personId, null),
    username:
      data?.username !== undefined
        ? toRequiredString(data.username)
        : toRequiredString(currentLoginEvent?.username),
    name:
      data?.name !== undefined
        ? toOptionalString(data.name)
        : toOptionalString(currentLoginEvent?.name),
    role:
      data?.role !== undefined
        ? normalizeLoginEventRole(data.role)
        : normalizeLoginEventRole(currentLoginEvent?.role),
    accountType,
    loginAt,
    userAgent:
      data?.userAgent !== undefined
        ? toOptionalString(data.userAgent)
        : toOptionalString(currentLoginEvent?.userAgent),
  }
}

async function getNextLoginEventIdDb() {
  const result = await prisma.loginEvent.aggregate({
    _max: {
      id: true,
    },
  })

  return Number(result?._max?.id || 0) + 1
}

async function trimLoginEventsDb(limit = MAX_LOGIN_EVENTS_DB) {
  const normalizedLimit = Math.max(Number(limit) || 0, 0)

  if (!normalizedLimit) {
    return
  }

  const staleRecords = await prisma.loginEvent.findMany({
    orderBy: [{ loginAt: 'desc' }, { id: 'desc' }],
    skip: normalizedLimit,
    select: {
      id: true,
    },
  })

  if (staleRecords.length === 0) {
    return
  }

  await prisma.loginEvent.deleteMany({
    where: {
      id: {
        in: staleRecords.map(record => Number(record.id)),
      },
    },
  })
}

export async function getAllLoginEventsDb() {
  const loginEvents = await prisma.loginEvent.findMany({
    orderBy: [{ loginAt: 'desc' }, { id: 'desc' }],
  })

  return loginEvents.map(mapLoginEventRecord)
}

export async function createLoginEventDb(data) {
  const nextLoginEventState = buildLoginEventMutationData(
    {
      ...data,
      loginAt: data?.loginAt || new Date().toISOString(),
    },
    null,
  )

  if (!nextLoginEventState.username || !nextLoginEventState.loginAt) {
    return null
  }

  const loginEvent = await prisma.loginEvent.create({
    data: {
      id: toPositiveInt(data?.id) || (await getNextLoginEventIdDb()),
      ...nextLoginEventState,
    },
  })

  await trimLoginEventsDb()
  return mapLoginEventRecord(loginEvent)
}

export async function replaceAllLoginEventsDb(loginEvents = []) {
  const normalizedLoginEvents = Array.isArray(loginEvents)
    ? loginEvents
        .map((loginEvent, index) => {
          const nextLoginEventState = buildLoginEventMutationData(loginEvent, null)
          const normalizedId = toPositiveInt(loginEvent?.id, index + 1)

          if (!normalizedId || !nextLoginEventState.username || !nextLoginEventState.loginAt) {
            return null
          }

          return {
            id: normalizedId,
            ...nextLoginEventState,
          }
        })
        .filter(Boolean)
    : []

  await prisma.$transaction(async transaction => {
    await transaction.loginEvent.deleteMany()

    if (normalizedLoginEvents.length > 0) {
      await transaction.loginEvent.createMany({
        data: normalizedLoginEvents,
      })
    }
  })

  return normalizedLoginEvents
    .map(loginEvent => mapLoginEventRecord(loginEvent))
    .filter(Boolean)
}
