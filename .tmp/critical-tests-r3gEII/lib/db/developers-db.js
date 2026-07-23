import { ACCOUNT_TYPE_DEVELOPER } from '../account-types.js'
import { prisma } from '../prisma.js'
import { toDateTimeString, toPositiveInt, toRequiredString } from './core-mappers.js'

function getDeveloperIncludes() {
  return {
    person: true,
  }
}

function mapDeveloperRecord(record) {
  if (!record) {
    return null
  }

  return {
    id: Number(record.id),
    personId: null,
    username: toRequiredString(record.username),
    passwordHash: toRequiredString(record.passwordHash),
    password: toRequiredString(record.passwordHash),
    name: toRequiredString(record.name || record.username) || 'Programador',
    role: 'developer',
    accountType: ACCOUNT_TYPE_DEVELOPER,
    active: record.active !== false,
    deactivatedAt: toDateTimeString(record.deactivatedAt),
    deletedAt: toDateTimeString(record.deletedAt),
    lastLoginAt: toDateTimeString(record.lastLoginAt),
    legacySource: toRequiredString(record.legacySource) || null,
    legacySourceId: toPositiveInt(record.legacySourceId, null),
    person: null,
  }
}

export async function getAllDevelopersDb() {
  const developers = await prisma.user.findMany({
    where: {
      accountType: ACCOUNT_TYPE_DEVELOPER,
    },
    include: getDeveloperIncludes(),
    orderBy: [{ username: 'asc' }, { id: 'asc' }],
  })

  return developers.map(mapDeveloperRecord)
}

export async function getDeveloperByIdDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const developer = await prisma.user.findFirst({
    where: {
      id: normalizedId,
      accountType: ACCOUNT_TYPE_DEVELOPER,
    },
    include: getDeveloperIncludes(),
  })

  return mapDeveloperRecord(developer)
}

export async function getDeveloperByUsernameDb(username) {
  const normalizedUsername = toRequiredString(username)

  if (!normalizedUsername) {
    return null
  }

  const developer = await prisma.user.findFirst({
    where: {
      username: normalizedUsername,
      accountType: ACCOUNT_TYPE_DEVELOPER,
    },
    include: getDeveloperIncludes(),
  })

  return mapDeveloperRecord(developer)
}

export async function updateDeveloperPasswordDb(id, passwordHash) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const currentDeveloper = await prisma.user.findFirst({
    where: {
      id: normalizedId,
      accountType: ACCOUNT_TYPE_DEVELOPER,
    },
    include: getDeveloperIncludes(),
  })

  if (!currentDeveloper) {
    return null
  }

  const developer = await prisma.user.update({
    where: { id: normalizedId },
    data: {
      passwordHash: toRequiredString(passwordHash),
    },
    include: getDeveloperIncludes(),
  })

  return mapDeveloperRecord(developer)
}
