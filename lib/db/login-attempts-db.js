import { prisma } from '../prisma.js'
import { toDateTimeString, toOptionalString, toRequiredString } from './core-mappers.js'

function toDateTimeValue(value, fallback = null) {
  if (!value) {
    return fallback
  }

  const candidate = value instanceof Date ? value : new Date(value)
  return Number.isNaN(candidate.getTime()) ? fallback : candidate
}

function normalizeUsername(value) {
  return toRequiredString(value).toLowerCase()
}

function normalizeFailedAt(value) {
  return Array.isArray(value) ? value.map(item => toDateTimeString(item)).filter(Boolean) : []
}

function mapLoginAttemptRecord(record) {
  if (!record) {
    return null
  }

  return {
    username: normalizeUsername(record.username),
    failedAt: normalizeFailedAt(record.failedAt),
    blockedUntil: toOptionalString(toDateTimeString(record.blockedUntil)) || '',
  }
}

function buildLoginAttemptMutationData(data, currentRecord = null) {
  return {
    username:
      data?.username !== undefined
        ? normalizeUsername(data.username)
        : normalizeUsername(currentRecord?.username),
    failedAt:
      data?.failedAt !== undefined
        ? normalizeFailedAt(data.failedAt)
        : normalizeFailedAt(currentRecord?.failedAt),
    blockedUntil:
      data?.blockedUntil !== undefined
        ? toDateTimeValue(data.blockedUntil)
        : toDateTimeValue(currentRecord?.blockedUntil),
  }
}

export async function getAllLoginAttemptsDb() {
  const loginAttempts = await prisma.loginAttempt.findMany({
    orderBy: [{ username: 'asc' }],
  })

  return loginAttempts.map(mapLoginAttemptRecord).filter(Boolean)
}

export async function getLoginAttemptByUsernameDb(username) {
  const normalizedUsername = normalizeUsername(username)

  if (!normalizedUsername) {
    return null
  }

  const loginAttempt = await prisma.loginAttempt.findUnique({
    where: {
      username: normalizedUsername,
    },
  })

  return mapLoginAttemptRecord(loginAttempt)
}

export async function upsertLoginAttemptDb(data) {
  const nextLoginAttemptState = buildLoginAttemptMutationData(data, null)

  if (!nextLoginAttemptState.username) {
    return null
  }

  const loginAttempt = await prisma.loginAttempt.upsert({
    where: {
      username: nextLoginAttemptState.username,
    },
    create: nextLoginAttemptState,
    update: nextLoginAttemptState,
  })

  return mapLoginAttemptRecord(loginAttempt)
}

export async function clearLoginAttemptDb(username) {
  const normalizedUsername = normalizeUsername(username)

  if (!normalizedUsername) {
    return 0
  }

  const result = await prisma.loginAttempt.deleteMany({
    where: {
      username: normalizedUsername,
    },
  })

  return Number(result.count || 0)
}

export async function replaceAllLoginAttemptsDb(records = []) {
  const normalizedRecords = Array.isArray(records)
    ? records
        .map(record => {
          const nextLoginAttemptState = buildLoginAttemptMutationData(record, null)

          if (!nextLoginAttemptState.username) {
            return null
          }

          return nextLoginAttemptState
        })
        .filter(Boolean)
    : []

  await prisma.$transaction(async transaction => {
    await transaction.loginAttempt.deleteMany()

    if (normalizedRecords.length > 0) {
      await transaction.loginAttempt.createMany({
        data: normalizedRecords,
      })
    }
  })

  return normalizedRecords.map(mapLoginAttemptRecord).filter(Boolean)
}
