import { ACCOUNT_TYPE_ADMIN } from '../account-types.js'
import { prisma } from '../prisma.js'
import { mapPersonRecord, toDateTimeString, toPositiveInt, toRequiredString } from './core-mappers.js'

function getAdminIncludes() {
  return {
    person: true,
  }
}

function mapAdminRecord(record) {
  if (!record) {
    return null
  }

  return {
    id: Number(record.id),
    personId: toPositiveInt(record.personId, null),
    username: toRequiredString(record.username),
    passwordHash: toRequiredString(record.passwordHash),
    password: toRequiredString(record.passwordHash),
    name: toRequiredString(record.name || record.person?.name || record.username) || 'Administrador',
    role: record.person?.role || record.role || 'admin',
    accountType: ACCOUNT_TYPE_ADMIN,
    active: record.active !== false,
    deactivatedAt: toDateTimeString(record.deactivatedAt),
    deletedAt: toDateTimeString(record.deletedAt),
    lastLoginAt: toDateTimeString(record.lastLoginAt),
    legacySource: toRequiredString(record.legacySource) || null,
    legacySourceId: toPositiveInt(record.legacySourceId, null),
    person: record.person ? mapPersonRecord(record.person) : null,
  }
}

export async function getAllAdminsDb() {
  const admins = await prisma.user.findMany({
    where: {
      accountType: ACCOUNT_TYPE_ADMIN,
    },
    include: getAdminIncludes(),
    orderBy: [{ username: 'asc' }, { id: 'asc' }],
  })

  return admins.map(mapAdminRecord)
}

export async function getAdminByIdDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const admin = await prisma.user.findFirst({
    where: {
      id: normalizedId,
      accountType: ACCOUNT_TYPE_ADMIN,
    },
    include: getAdminIncludes(),
  })

  return mapAdminRecord(admin)
}

export async function getAdminByUsernameDb(username) {
  const normalizedUsername = toRequiredString(username)

  if (!normalizedUsername) {
    return null
  }

  const admin = await prisma.user.findFirst({
    where: {
      username: normalizedUsername,
      accountType: ACCOUNT_TYPE_ADMIN,
    },
    include: getAdminIncludes(),
  })

  return mapAdminRecord(admin)
}

export async function updateAdminPasswordDb(id, passwordHash) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const currentAdmin = await prisma.user.findFirst({
    where: {
      id: normalizedId,
      accountType: ACCOUNT_TYPE_ADMIN,
    },
    include: getAdminIncludes(),
  })

  if (!currentAdmin) {
    return null
  }

  const admin = await prisma.user.update({
    where: { id: normalizedId },
    data: {
      passwordHash: toRequiredString(passwordHash),
    },
    include: getAdminIncludes(),
  })

  return mapAdminRecord(admin)
}
