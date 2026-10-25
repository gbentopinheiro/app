import { ACCOUNT_TYPE_OPERATIONAL } from '../account-types.js'
import { prisma } from '../prisma.js'
import { normalizeRole } from '../roles.js'
import {
  mapPersonRecord,
  mapWorkRecord,
  toDateOnlyString,
  toDateTimeString,
  toPositiveInt,
  toRequiredString,
} from './core-mappers.js'

// Only the relations needed by the existing work-access rule. Fetch once per
// collection of identities, without hours, prices or assignment audit joins.
export async function getAccessIdentityWorkRelationsDb(personIds, db = prisma) {
  const ids = [...new Set(personIds.map(id => toPositiveInt(id, null)).filter(Boolean))]
  if (ids.length === 0) return { assignments: [], extraGrants: [] }

  const workSelect = { id: true, number: true, name: true, clientId: true }
  const [assignments, extraGrants] = await Promise.all([
    db.workAssignment.findMany({
      where: { personId: { in: ids } },
      select: {
        id: true, personId: true, workPlanId: true, workId: true,
        planningVisible: true, assignmentPurpose: true,
        person: { select: { role: true } },
        workPlan: { select: { date: true } },
        work: { select: workSelect },
      },
      orderBy: [{ workPlanId: 'asc' }, { workId: 'asc' }, { id: 'asc' }],
    }),
    db.workExtraAccessGrant.findMany({
      where: { personId: { in: ids } },
      select: { personId: true, work: { select: workSelect } },
      orderBy: [{ personId: 'asc' }, { workId: 'asc' }, { id: 'asc' }],
    }),
  ])

  return {
    assignments: assignments.map(assignment => ({
      ...assignment,
      date: toDateOnlyString(assignment.workPlan?.date),
      person: assignment.person ? { role: normalizeRole(assignment.person.role) } : null,
      work: assignment.work ? mapWorkRecord(assignment.work) : null,
    })),
    extraGrants: extraGrants.map(grant => ({
      personId: grant.personId,
      work: grant.work ? mapWorkRecord(grant.work) : null,
    })),
  }
}

function getAccessIdentityIncludes() {
  return {
    person: true,
  }
}

function mapAccessIdentityUserRecord(record) {
  if (!record) {
    return null
  }

  return {
    id: Number(record.id),
    personId: toPositiveInt(record.personId, null),
    username: toRequiredString(record.username),
    passwordHash: toRequiredString(record.passwordHash),
    password: toRequiredString(record.passwordHash),
    role: record.role ? normalizeRole(record.role) : '',
    accountType: ACCOUNT_TYPE_OPERATIONAL,
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

async function getNextUserIdDb() {
  const result = await prisma.user.aggregate({
    _max: {
      id: true,
    },
  })

  return Number(result?._max?.id || 0) + 1
}

export async function getAllAccessIdentitiesDb() {
  const users = await prisma.user.findMany({
    where: {
      accountType: ACCOUNT_TYPE_OPERATIONAL,
    },
    include: getAccessIdentityIncludes(),
    orderBy: [{ username: 'asc' }, { id: 'asc' }],
  })

  return users.map(mapAccessIdentityUserRecord)
}

export async function getAccessIdentityByIdDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const user = await prisma.user.findFirst({
    where: {
      id: normalizedId,
      accountType: ACCOUNT_TYPE_OPERATIONAL,
    },
    include: getAccessIdentityIncludes(),
  })

  return mapAccessIdentityUserRecord(user)
}

export async function getAccessIdentityByUsernameDb(username) {
  const normalizedUsername = toRequiredString(username)

  if (!normalizedUsername) {
    return null
  }

  const user = await prisma.user.findFirst({
    where: {
      username: normalizedUsername,
      accountType: ACCOUNT_TYPE_OPERATIONAL,
    },
    include: getAccessIdentityIncludes(),
  })

  return mapAccessIdentityUserRecord(user)
}

export async function getAccessIdentityByPersonIdDb(personId) {
  const normalizedPersonId = toPositiveInt(personId)

  if (!normalizedPersonId) {
    return null
  }

  const user = await prisma.user.findFirst({
    where: {
      personId: normalizedPersonId,
      accountType: ACCOUNT_TYPE_OPERATIONAL,
    },
    include: getAccessIdentityIncludes(),
  })

  return mapAccessIdentityUserRecord(user)
}

export async function createAccessIdentityDb(data) {
  const user = await prisma.user.create({
    data: {
      id: toPositiveInt(data?.id) || (await getNextUserIdDb()),
      personId: toPositiveInt(data?.personId, null),
      username: toRequiredString(data?.username),
      passwordHash: toRequiredString(data?.passwordHash),
      role: data?.role ? normalizeRole(data.role) : null,
      accountType: ACCOUNT_TYPE_OPERATIONAL,
      name: toRequiredString(data?.name) || null,
      active: data?.active !== false,
      deactivatedAt: data?.deactivatedAt ? new Date(data.deactivatedAt) : null,
      deletedAt: data?.deletedAt ? new Date(data.deletedAt) : null,
      lastLoginAt: data?.lastLoginAt ? new Date(data.lastLoginAt) : null,
      legacySource: toRequiredString(data?.legacySource || 'access_identity') || 'access_identity',
      legacySourceId: toPositiveInt(data?.legacySourceId, null),
    },
    include: getAccessIdentityIncludes(),
  })

  return mapAccessIdentityUserRecord(user)
}

export async function updateAccessIdentityDb(id, data) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const currentUser = await prisma.user.findFirst({
    where: {
      id: normalizedId,
      accountType: ACCOUNT_TYPE_OPERATIONAL,
    },
    include: getAccessIdentityIncludes(),
  })

  if (!currentUser) {
    return null
  }

  const user = await prisma.user.update({
    where: { id: normalizedId },
    data: {
      personId: data?.personId !== undefined ? toPositiveInt(data.personId, null) : currentUser.personId,
      username: data?.username !== undefined ? toRequiredString(data.username) : currentUser.username,
      passwordHash: data?.passwordHash !== undefined ? toRequiredString(data.passwordHash) : currentUser.passwordHash,
      role:
        data?.role !== undefined
          ? (data.role ? normalizeRole(data.role) : null)
          : currentUser.role,
      name: data?.name !== undefined ? toRequiredString(data.name) || null : currentUser.name,
      active: data?.active !== undefined ? data.active === true : currentUser.active,
      deactivatedAt:
        data?.deactivatedAt !== undefined
          ? (data.deactivatedAt ? new Date(data.deactivatedAt) : null)
          : currentUser.deactivatedAt,
      deletedAt:
        data?.deletedAt !== undefined
          ? (data.deletedAt ? new Date(data.deletedAt) : null)
          : currentUser.deletedAt,
      lastLoginAt:
        data?.lastLoginAt !== undefined
          ? (data.lastLoginAt ? new Date(data.lastLoginAt) : null)
          : currentUser.lastLoginAt,
      legacySource:
        data?.legacySource !== undefined
          ? toRequiredString(data.legacySource) || null
          : currentUser.legacySource,
      legacySourceId:
        data?.legacySourceId !== undefined
          ? toPositiveInt(data.legacySourceId, null)
          : currentUser.legacySourceId,
    },
    include: getAccessIdentityIncludes(),
  })

  return mapAccessIdentityUserRecord(user)
}

export async function deleteAccessIdentityDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return false
  }

  try {
    await prisma.user.delete({
      where: {
        id: normalizedId,
      },
    })
    return true
  } catch (error) {
    return false
  }
}

export async function deleteAccessIdentityByPersonIdDb(personId) {
  const identity = await getAccessIdentityByPersonIdDb(personId)

  if (!identity) {
    return false
  }

  return deleteAccessIdentityDb(identity.id)
}
