import { prisma } from '../prisma.js'
import { normalizeAccountType } from '../account-types.js'
import { normalizeAccessProfile, resolveAccessProfileForUser } from '../access-profiles.js'
import { getAccessProfilePermissionKeys } from '../permissions.js'
import { normalizeRole } from '../roles.js'
import {
  mapPersonRecord,
  toDateTimeString,
  toPositiveInt,
  toRequiredString,
} from './core-mappers.js'

function getUserIncludes() {
  return {
    accessProfile: {
      select: {
        id: true,
        key: true,
        name: true,
      },
    },
    person: true,
  }
}

function mapUserRecord(record) {
  if (!record) {
    return null
  }

  const role = record.role ? normalizeRole(record.role) : ''
  const accountType = normalizeAccountType(record.accountType)
  const accessProfile = normalizeAccessProfile(
    record.accessProfile?.key || resolveAccessProfileForUser({ role, accountType }),
  )

  return {
    id: Number(record.id),
    personId: toPositiveInt(record.personId, null),
    accessProfileId: toPositiveInt(record.accessProfileId ?? record.accessProfile?.id, null),
    accessProfile,
    permissionKeys: [...getAccessProfilePermissionKeys(accessProfile)],
    username: toRequiredString(record.username),
    passwordHash: toRequiredString(record.passwordHash),
    password: toRequiredString(record.passwordHash),
    role,
    accountType,
    name: toRequiredString(record.name || record.username),
    active: record.active !== false,
    deactivatedAt: toDateTimeString(record.deactivatedAt),
    deletedAt: toDateTimeString(record.deletedAt),
    lastLoginAt: toDateTimeString(record.lastLoginAt),
    legacySource: toRequiredString(record.legacySource) || null,
    legacySourceId: toPositiveInt(record.legacySourceId, null),
    person: record.person ? mapPersonRecord(record.person) : null,
  }
}

export async function getAllUsersDb() {
  const users = await prisma.user.findMany({
    include: getUserIncludes(),
    orderBy: [{ username: 'asc' }, { id: 'asc' }],
  })

  return users.map(mapUserRecord)
}

export async function getUserByIdDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: normalizedId },
    include: getUserIncludes(),
  })

  return mapUserRecord(user)
}

export async function getUserByUsernameDb(username) {
  const normalizedUsername = String(username || '').trim()

  if (!normalizedUsername) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { username: normalizedUsername },
    include: getUserIncludes(),
  })

  return mapUserRecord(user)
}

export async function getUserByPersonIdDb(personId) {
  const normalizedPersonId = toPositiveInt(personId)

  if (!normalizedPersonId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { personId: normalizedPersonId },
    include: getUserIncludes(),
  })

  return mapUserRecord(user)
}

export async function updateUserPasswordDb(id, passwordHash) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const user = await prisma.user.update({
    where: { id: normalizedId },
    data: {
      passwordHash: toRequiredString(passwordHash),
    },
    include: getUserIncludes(),
  })

  return mapUserRecord(user)
}

export async function updateUserLastLoginDb(id, loginAt = new Date().toISOString()) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const candidate = new Date(loginAt)

  const user = await prisma.user.update({
    where: { id: normalizedId },
    data: {
      lastLoginAt: Number.isNaN(candidate.getTime()) ? new Date() : candidate,
    },
    include: getUserIncludes(),
  })

  return mapUserRecord(user)
}
