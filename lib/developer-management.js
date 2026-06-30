import fs from 'fs/promises'
import path from 'path'
import {
  ACCESS_PROFILE_DEVELOPER,
  ACCESS_PROFILE_DEFINITIONS,
  normalizeAccessProfile,
  resolveAccessProfileForUser,
} from './access-profiles.js'
import {
  ACCOUNT_TYPE_ADMIN,
  ACCOUNT_TYPE_DEVELOPER,
  ACCOUNT_TYPE_OPERATIONAL,
} from './account-types.js'
import { logAuditEvent } from './audit-trail.js'
import { getAllAccessIdentitiesData } from './access-identities.js'
import { getAllAdminsData } from './admins.js'
import { getAllClientsData } from './clients.js'
import { getAllCompaniesData } from './companies.js'
import { isMysqlDataSourceEnabled } from './data-source.js'
import { getAllDailyWorkNotesData } from './daily-work-notes.js'
import { getAllDevelopersData } from './developers.js'
import { getAllLoginEvents } from './login-audit.js'
import { clearFailedLoginAttempts, getLoginBlockState } from './login-attempts.js'
import { getAccessProfilePermissionKeys, PERMISSION_DEFINITIONS } from './permissions.js'
import { getAllPeopleData } from './people.js'
import { prisma } from './prisma.js'
import {
  getEntityRoleLabel,
  normalizeRole,
  roleRequiresAppAccess,
} from './roles.js'
import { getAllUsersData, getUserByIdData } from './users.js'
import { getAllWorkAssignmentsData } from './work-assignments.js'
import { getAllWorkPlansData } from './work-plans.js'
import { getAllWorksData } from './works.js'

const PACKAGE_JSON_PATH = path.join(process.cwd(), 'package.json')
const EXPORTS_DIR = path.join(process.cwd(), 'data', 'exports')
const NEXT_BUILD_ID_PATH = path.join(process.cwd(), '.next', 'BUILD_ID')

const ACCESS_PROFILE_DEFINITION_MAP = new Map(
  ACCESS_PROFILE_DEFINITIONS.map(definition => [definition.key, definition]),
)
const PERMISSION_DEFINITION_MAP = new Map(
  PERMISSION_DEFINITIONS.map(definition => [definition.key, definition]),
)
const ACCESS_PROFILE_ORDER = new Map(
  ACCESS_PROFILE_DEFINITIONS.map((definition, index) => [definition.key, index]),
)
const PERMISSION_ORDER = new Map(
  PERMISSION_DEFINITIONS.map((definition, index) => [definition.key, index]),
)
const LAST_DEVELOPER_LOCKOUT_MESSAGE =
  'N\u00e3o \u00e9 poss\u00edvel remover o acesso administrativo do \u00faltimo developer.'
const BASE_CRITICAL_DEVELOPER_PERMISSION_KEYS = Object.freeze([
  'developer.users.read',
  'developer.users.reset_password',
  'developer.feature_flags.read',
  'developer.feature_flags.manage',
  'developer.audit.read',
  'developer.data_integrity.read',
  'developer.diagnostics.read',
  'developer.data_management.read',
  'developer.dashboard.read',
])
const OPTIONAL_CRITICAL_DEVELOPER_PERMISSION_KEYS = Object.freeze([
  'developer.permissions.manage',
  'developer.access_profiles.manage',
])

function ensureMysqlDeveloperManagement() {
  if (!isMysqlDataSourceEnabled()) {
    throw new Error('A gestao tecnica de perfis e contas requer a base de dados MySQL ativa.')
  }
}

function toPositiveInt(value, fallback = null) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function toDateTimeString(value) {
  if (!value) {
    return null
  }

  const candidate = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(candidate.getTime())) {
    return null
  }

  return candidate.toISOString()
}

function toDateOnlyString(value) {
  const dateTime = toDateTimeString(value)
  return dateTime ? dateTime.slice(0, 10) : null
}

function normalizePermissionKeyList(permissionKeys = []) {
  return Array.from(
    new Set(
      (Array.isArray(permissionKeys) ? permissionKeys : [permissionKeys])
        .map(permissionKey => String(permissionKey || '').trim())
        .filter(Boolean),
    ),
  ).sort((left, right) =>
    (PERMISSION_ORDER.get(left) ?? Number.MAX_SAFE_INTEGER) -
      (PERMISSION_ORDER.get(right) ?? Number.MAX_SAFE_INTEGER) ||
    left.localeCompare(right, 'pt-PT'),
  )
}

function getCriticalDeveloperPermissionKeys() {
  return normalizePermissionKeyList([
    ...BASE_CRITICAL_DEVELOPER_PERMISSION_KEYS,
    ...OPTIONAL_CRITICAL_DEVELOPER_PERMISSION_KEYS.filter(permissionKey =>
      PERMISSION_DEFINITION_MAP.has(permissionKey),
    ),
  ])
}

function isTechnicalPermissionKey(permissionKey) {
  return String(permissionKey || '').trim().startsWith('developer.')
}

function isTechnicalPermissionSet(permissionKeys = []) {
  return normalizePermissionKeyList(permissionKeys).some(isTechnicalPermissionKey)
}

function hasCriticalDeveloperPermissions(permissionKeys = [], criticalPermissionKeys = getCriticalDeveloperPermissionKeys()) {
  const normalizedPermissionKeys = new Set(normalizePermissionKeyList(permissionKeys))
  return criticalPermissionKeys.every(permissionKey => normalizedPermissionKeys.has(permissionKey))
}

function mapDeveloperAccessProfileOption(profile, criticalPermissionKeys = getCriticalDeveloperPermissionKeys()) {
  return {
    id: profile.id,
    key: profile.key,
    name: profile.name,
    description: profile.description,
    isTechnicalProfile: isTechnicalPermissionSet(profile.permissionKeys),
    hasCriticalDeveloperPermissions: hasCriticalDeveloperPermissions(
      profile.permissionKeys,
      criticalPermissionKeys,
    ),
  }
}

async function getDeveloperAdministrativeCoverage(overrides = {}) {
  const [accessProfilesContext, developerUsers] = await Promise.all([
    getAccessProfilesCatalog(),
    prisma.user.findMany({
      where: {
        accountType: ACCOUNT_TYPE_DEVELOPER,
      },
      include: {
        accessProfile: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
      orderBy: [{ username: 'asc' }, { id: 'asc' }],
    }),
  ])

  const criticalPermissionKeys = getCriticalDeveloperPermissionKeys()
  const users = await Promise.all(
    developerUsers.map(async user => {
      const isTargetUser = Number(overrides.userId) === Number(user.id)
      const nextAccessProfileId =
        isTargetUser && overrides.accessProfileId !== undefined
          ? toPositiveInt(overrides.accessProfileId, null)
          : toPositiveInt(user.accessProfileId, null)
      const fallbackAccessProfileKey = normalizeAccessProfile(
        resolveAccessProfileForUser({ role: user.role, accountType: user.accountType }),
      )
      const resolvedProfile =
        (nextAccessProfileId ? accessProfilesContext.profilesById.get(nextAccessProfileId) : null) ||
        accessProfilesContext.profilesByKey.get(
          normalizeAccessProfile(user.accessProfile?.key || fallbackAccessProfileKey),
        ) ||
        null
      const resolvedAccessProfileKey = normalizeAccessProfile(
        resolvedProfile?.key || fallbackAccessProfileKey,
      )
      const permissionKeys =
        resolvedProfile && Number(overrides.profileId) === Number(resolvedProfile.id)
          ? normalizePermissionKeyList(overrides.permissionKeys)
          : resolvedProfile
            ? normalizePermissionKeyList(resolvedProfile.permissionKeys)
            : normalizePermissionKeyList(getAccessProfilePermissionKeys(resolvedAccessProfileKey))
      const active =
        isTargetUser && overrides.active !== undefined
          ? overrides.active === true
          : user.active !== false && !user.deactivatedAt && !user.deletedAt
      const blockedState =
        isTargetUser && overrides.unlockBlocked === true
          ? { blocked: false, retryAfterSeconds: 0 }
          : await getLoginBlockState(user.username)

      return {
        id: Number(user.id),
        username: String(user.username || '').trim(),
        accessProfileId: resolvedProfile?.id ?? nextAccessProfileId,
        accessProfileKey: resolvedAccessProfileKey,
        active,
        blocked: blockedState.blocked,
        permissionKeys,
        isTechnicalProfile: isTechnicalPermissionSet(permissionKeys),
        hasCriticalDeveloperPermissions: hasCriticalDeveloperPermissions(
          permissionKeys,
          criticalPermissionKeys,
        ),
      }
    }),
  )

  const availableUsers = users.filter(
    user => user.active && !user.blocked && user.hasCriticalDeveloperPermissions,
  )

  return {
    users,
    availableUsers,
    criticalPermissionKeys,
  }
}

async function assertDeveloperAdministrativeCoverageRetained(overrides = {}) {
  const [currentCoverage, nextCoverage] = await Promise.all([
    getDeveloperAdministrativeCoverage(),
    getDeveloperAdministrativeCoverage(overrides),
  ])

  if (currentCoverage.availableUsers.length > 0 && nextCoverage.availableUsers.length === 0) {
    throw new Error(LAST_DEVELOPER_LOCKOUT_MESSAGE)
  }

  return {
    currentCoverage,
    nextCoverage,
  }
}

function getAccountTypeLabel(accountType) {
  if (accountType === ACCOUNT_TYPE_ADMIN) {
    return 'Admin'
  }

  if (accountType === ACCOUNT_TYPE_DEVELOPER) {
    return 'Developer'
  }

  if (accountType === ACCOUNT_TYPE_OPERATIONAL) {
    return 'Operacional'
  }

  return 'Desconhecido'
}

async function getUserStatus(user) {
  const blockedState = await getLoginBlockState(user.username)

  if (blockedState.blocked) {
    return {
      key: 'blocked',
      label: 'Bloqueado',
      helper: `Tentativas falhadas ativas (${blockedState.retryAfterSeconds}s).`,
      blocked: true,
      retryAfterSeconds: blockedState.retryAfterSeconds,
    }
  }

  if (user.active === false || user.deletedAt || user.deactivatedAt) {
    return {
      key: 'inactive',
      label: 'Inativo',
      helper: user.deactivatedAt || user.deletedAt || 'Conta desativada.',
      blocked: false,
      retryAfterSeconds: 0,
    }
  }

  return {
    key: 'active',
    label: 'Ativo',
    helper: 'Conta operacional.',
    blocked: false,
    retryAfterSeconds: 0,
  }
}

function mapPermissionRecord(permission) {
  const key = String(permission?.key || '').trim()
  const definition = PERMISSION_DEFINITION_MAP.get(key)

  return {
    id: toPositiveInt(permission?.id),
    key,
    name: String(permission?.name || definition?.name || key).trim(),
    description: String(permission?.description || definition?.description || '').trim(),
    category: String(permission?.category || definition?.category || 'simple').trim(),
  }
}

function sortPermissions(left, right) {
  const leftOrder = PERMISSION_ORDER.get(left.key) ?? Number.MAX_SAFE_INTEGER
  const rightOrder = PERMISSION_ORDER.get(right.key) ?? Number.MAX_SAFE_INTEGER

  return leftOrder - rightOrder || left.key.localeCompare(right.key, 'pt-PT')
}

function mapAccessProfileRecord(profile) {
  const key = normalizeAccessProfile(profile?.key)
  const definition = ACCESS_PROFILE_DEFINITION_MAP.get(key)
  const permissions = Array.isArray(profile?.permissions)
    ? profile.permissions
      .map(entry => mapPermissionRecord(entry.permission || entry))
      .filter(permission => permission.key)
      .sort(sortPermissions)
    : []

  return {
    id: toPositiveInt(profile?.id),
    key,
    name: String(profile?.name || definition?.name || key).trim(),
    description: String(profile?.description || definition?.description || '').trim(),
    permissions,
    permissionKeys: permissions.map(permission => permission.key),
  }
}

async function mapManagedUser(user, context = {}) {
  const role = normalizeRole(user?.role)
  const accessProfileId = toPositiveInt(user?.accessProfileId, null)
  const hasExplicitAccessProfile = user?.hasExplicitAccessProfile === true || accessProfileId !== null
  const explicitProfile = accessProfileId ? context.accessProfilesById?.get(accessProfileId) : null
  const resolvedAccessProfileKey = normalizeAccessProfile(
    explicitProfile?.key || user?.accessProfile || resolveAccessProfileForUser({
      role,
      accountType: user?.accountType,
    }),
  )
  const resolvedProfile = explicitProfile || context.accessProfilesByKey?.get(resolvedAccessProfileKey) || null
  const status = await getUserStatus(user)

  return {
    id: Number(user.id),
    personId: toPositiveInt(user.personId, null),
    name: String(user.name || user.username || '').trim() || 'Sem nome',
    username: String(user.username || '').trim(),
    role,
    roleLabel: role ? getEntityRoleLabel(user) : 'Sem role',
    accountType: String(user.accountType || '').trim(),
    accountTypeLabel: getAccountTypeLabel(user.accountType),
    accessProfileId,
    accessProfileKey: explicitProfile?.key || null,
    accessProfileName: explicitProfile?.name || null,
    accessProfileDescription: explicitProfile?.description || null,
    hasExplicitAccessProfile,
    suggestedAccessProfileKey: resolvedAccessProfileKey,
    suggestedAccessProfileName: resolvedProfile?.name || ACCESS_PROFILE_DEFINITION_MAP.get(resolvedAccessProfileKey)?.name || null,
    active: user.active !== false,
    blocked: status.blocked,
    statusKey: status.key,
    statusLabel: status.label,
    statusHelper: status.helper,
    retryAfterSeconds: status.retryAfterSeconds,
    deletedAt: toDateTimeString(user.deletedAt),
    deactivatedAt: toDateTimeString(user.deactivatedAt),
    lastLoginAt: toDateTimeString(user.lastLoginAt),
  }
}

async function getAccessProfilesCatalog() {
  ensureMysqlDeveloperManagement()

  const profiles = await prisma.accessProfile.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
    orderBy: [{ id: 'asc' }, { key: 'asc' }],
  })

  const mappedProfiles = profiles.map(mapAccessProfileRecord)
  const profilesById = new Map(mappedProfiles.map(profile => [profile.id, profile]))
  const profilesByKey = new Map(mappedProfiles.map(profile => [profile.key, profile]))

  const orderedProfiles = ACCESS_PROFILE_DEFINITIONS
    .map(definition => profilesByKey.get(definition.key))
    .filter(Boolean)

  mappedProfiles.forEach(profile => {
    if (!profilesByKey.has(profile.key)) {
      return
    }

    if (!orderedProfiles.some(item => item.id === profile.id)) {
      orderedProfiles.push(profile)
    }
  })

  return {
    profiles: orderedProfiles,
    profilesById,
    profilesByKey,
  }
}

async function getPermissionCatalog() {
  if (!isMysqlDataSourceEnabled()) {
    return PERMISSION_DEFINITIONS
      .map(definition => mapPermissionRecord(definition))
      .sort(sortPermissions)
  }

  const permissions = await prisma.permission.findMany({
    orderBy: [{ key: 'asc' }, { id: 'asc' }],
  })

  const mappedPermissions = permissions.map(mapPermissionRecord)

  return mappedPermissions.sort(sortPermissions)
}

async function getManagedUsersContext() {
  const [accessProfilesContext, permissions, users] = await Promise.all([
    getAccessProfilesCatalog(),
    getPermissionCatalog(),
    getAllUsersData(),
  ])
  const managedUsers = (await Promise.all(
    users.map(user =>
      mapManagedUser(user, {
        accessProfilesById: accessProfilesContext.profilesById,
        accessProfilesByKey: accessProfilesContext.profilesByKey,
      }),
    ),
  ))
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-PT') || left.username.localeCompare(right.username, 'pt-PT'))

  return {
    permissions,
    profiles: accessProfilesContext.profiles,
    profilesById: accessProfilesContext.profilesById,
    profilesByKey: accessProfilesContext.profilesByKey,
    users: managedUsers,
  }
}

async function getUserRecordForUpdate(userId) {
  ensureMysqlDeveloperManagement()

  const normalizedUserId = toPositiveInt(userId)

  if (!normalizedUserId) {
    return null
  }

  return prisma.user.findUnique({
    where: { id: normalizedUserId },
    include: {
      accessProfile: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      person: true,
    },
  })
}

async function getAccessProfileIdByKey(key) {
  const normalizedKey = normalizeAccessProfile(key)

  if (!normalizedKey) {
    return null
  }

  const profile = await prisma.accessProfile.findUnique({
    where: { key: normalizedKey },
    select: { id: true },
  })

  return toPositiveInt(profile?.id, null)
}

async function getAutomaticAccessProfileIdForUser(user) {
  const accessProfileKey = resolveAccessProfileForUser({
    role: user?.person?.role || user?.role || '',
    accountType: user?.accountType,
  })

  return getAccessProfileIdByKey(accessProfileKey)
}

function buildUserSummary(users) {
  return {
    total: users.length,
    admins: users.filter(user => user.accountType === ACCOUNT_TYPE_ADMIN).length,
    developers: users.filter(user => user.accountType === ACCOUNT_TYPE_DEVELOPER).length,
    operational: users.filter(user => user.accountType === ACCOUNT_TYPE_OPERATIONAL).length,
    active: users.filter(user => user.statusKey === 'active').length,
    inactive: users.filter(user => user.statusKey === 'inactive').length,
    blocked: users.filter(user => user.statusKey === 'blocked').length,
    withoutAccessProfile: users.filter(user => !user.hasExplicitAccessProfile).length,
  }
}

function buildIntegrityIssue({
  id,
  severity,
  category,
  title,
  description,
  items,
  fixable = false,
  fixLabel = null,
  destructive = false,
}) {
  return {
    id,
    severity,
    category,
    title,
    description,
    affectedCount: items.length,
    items,
    fixable,
    fixLabel,
    destructive,
  }
}

function sortIntegrityIssues(left, right) {
  const severityOrder = { high: 0, medium: 1, low: 2 }
  return (
    (severityOrder[left.severity] ?? Number.MAX_SAFE_INTEGER) -
      (severityOrder[right.severity] ?? Number.MAX_SAFE_INTEGER) ||
    left.title.localeCompare(right.title, 'pt-PT')
  )
}

export async function getDeveloperAccessProfilesOverview() {
  const context = await getManagedUsersContext()
  const criticalPermissionKeys = getCriticalDeveloperPermissionKeys()

  return context.profiles
    .map(profile => ({
      id: profile.id,
      key: profile.key,
      name: profile.name,
      description: profile.description,
      permissionsCount: profile.permissionKeys.length,
      usersCount: context.users.filter(user => Number(user.accessProfileId) === Number(profile.id)).length,
      isTechnicalProfile: isTechnicalPermissionSet(profile.permissionKeys),
      hasCriticalDeveloperPermissions: hasCriticalDeveloperPermissions(
        profile.permissionKeys,
        criticalPermissionKeys,
      ),
    }))
    .sort((left, right) => {
      const leftOrder = ACCESS_PROFILE_ORDER.get(left.key) ?? Number.MAX_SAFE_INTEGER
      const rightOrder = ACCESS_PROFILE_ORDER.get(right.key) ?? Number.MAX_SAFE_INTEGER
      return leftOrder - rightOrder
    })
}

export async function getDeveloperAccessProfileDetail(profileId) {
  const normalizedProfileId = toPositiveInt(profileId)

  if (!normalizedProfileId) {
    return null
  }

  const context = await getManagedUsersContext()
  const coverage = await getDeveloperAdministrativeCoverage()
  const profile = context.profilesById.get(normalizedProfileId)

  if (!profile) {
    return null
  }

  const assignedPermissionKeys = new Set(profile.permissionKeys)
  const usesDeveloperProtection =
    profile.key === ACCESS_PROFILE_DEVELOPER ||
    hasCriticalDeveloperPermissions(profile.permissionKeys, coverage.criticalPermissionKeys)
  const availableDevelopersUsingProfile = coverage.availableUsers.filter(user =>
    user.accessProfileKey === profile.key || Number(user.accessProfileId) === Number(profile.id),
  ).length

  return {
    id: profile.id,
    key: profile.key,
    name: profile.name,
    description: profile.description,
    permissionsCount: profile.permissionKeys.length,
    usersCount: context.users.filter(user => Number(user.accessProfileId) === Number(profile.id)).length,
    isTechnicalProfile: isTechnicalPermissionSet(profile.permissionKeys),
    hasCriticalDeveloperPermissions: hasCriticalDeveloperPermissions(
      profile.permissionKeys,
      coverage.criticalPermissionKeys,
    ),
    assignedPermissionKeys: [...assignedPermissionKeys].sort((left, right) =>
      (PERMISSION_ORDER.get(left) ?? Number.MAX_SAFE_INTEGER) - (PERMISSION_ORDER.get(right) ?? Number.MAX_SAFE_INTEGER) ||
      left.localeCompare(right, 'pt-PT'),
    ),
    permissions: context.permissions.map(permission => ({
      ...permission,
      enabled: assignedPermissionKeys.has(permission.key),
    })),
    users: context.users.filter(user => Number(user.accessProfileId) === Number(profile.id)),
    lockoutProtection: {
      applies: usesDeveloperProtection,
      availableDeveloperCount: coverage.availableUsers.length,
      availableDevelopersUsingProfile,
      message: LAST_DEVELOPER_LOCKOUT_MESSAGE,
      criticalPermissionKeys: coverage.criticalPermissionKeys,
    },
  }
}

export async function updateDeveloperAccessProfilePermissions(profileId, permissionKeys = [], actorUsername = 'developer') {
  ensureMysqlDeveloperManagement()

  const normalizedProfileId = toPositiveInt(profileId)

  if (!normalizedProfileId) {
    throw new Error('Perfil invalido.')
  }

  const currentProfile = await prisma.accessProfile.findUnique({
    where: { id: normalizedProfileId },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  })

  if (!currentProfile) {
    throw new Error('Perfil nao encontrado.')
  }

  const normalizedPermissionKeys = Array.from(
    new Set(
      (Array.isArray(permissionKeys) ? permissionKeys : [])
        .map(permissionKey => String(permissionKey || '').trim())
        .filter(Boolean),
    ),
  )

  const permissions = normalizedPermissionKeys.length > 0
    ? await prisma.permission.findMany({
      where: {
        key: {
          in: normalizedPermissionKeys,
        },
      },
      orderBy: [{ key: 'asc' }],
    })
    : []

  if (permissions.length !== normalizedPermissionKeys.length) {
    const foundKeys = new Set(permissions.map(permission => permission.key))
    const invalidKeys = normalizedPermissionKeys.filter(permissionKey => !foundKeys.has(permissionKey))
    throw new Error(`Permissoes invalidas: ${invalidKeys.join(', ')}`)
  }

  const previousPermissionKeys = currentProfile.permissions
    .map(entry => String(entry.permission?.key || '').trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'pt-PT'))
  const details = {
    accessProfileKey: currentProfile.key,
    before: previousPermissionKeys,
    after: normalizedPermissionKeys,
  }

  try {
    await assertDeveloperAdministrativeCoverageRetained({
      profileId: normalizedProfileId,
      permissionKeys: normalizedPermissionKeys,
    })

    await prisma.$transaction(async transaction => {
      await transaction.accessProfilePermission.deleteMany({
        where: {
          accessProfileId: normalizedProfileId,
        },
      })

      if (permissions.length > 0) {
        await transaction.accessProfilePermission.createMany({
          data: permissions.map(permission => ({
            accessProfileId: normalizedProfileId,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        })
      }
    })

    await logAuditEvent({
      username: actorUsername,
      action: 'update',
      entity: 'access_profile_permissions',
      entityId: normalizedProfileId,
      details,
      result: 'success',
    })

    return getDeveloperAccessProfileDetail(normalizedProfileId)
  } catch (error) {
    await logAuditEvent({
      username: actorUsername,
      action: 'update',
      entity: 'access_profile_permissions',
      entityId: normalizedProfileId,
      details,
      result: 'failure',
      errorMessage: String(error?.message || 'Erro ao atualizar permissoes do perfil.').trim(),
    })
    throw error
  }
}

export async function getDeveloperPermissionsCatalog() {
  return getPermissionCatalog()
}

export async function getDeveloperUsersOverview() {
  const context = await getManagedUsersContext()
  const criticalPermissionKeys = getCriticalDeveloperPermissionKeys()

  return {
    users: context.users,
    summary: buildUserSummary(context.users),
    accessProfiles: context.profiles.map(profile =>
      mapDeveloperAccessProfileOption(profile, criticalPermissionKeys),
    ),
  }
}

export async function getDeveloperUserDetail(userId) {
  const normalizedUserId = toPositiveInt(userId)

  if (!normalizedUserId) {
    return null
  }

  const context = await getManagedUsersContext()
  const coverage = await getDeveloperAdministrativeCoverage()
  const user = context.users.find(item => Number(item.id) === normalizedUserId)

  if (!user) {
    return null
  }

  return {
    user: {
      ...user,
      isLastAvailableDeveloper:
        user.accountType === ACCOUNT_TYPE_DEVELOPER &&
        coverage.availableUsers.length === 1 &&
        Number(coverage.availableUsers[0]?.id) === Number(user.id),
    },
    accessProfiles: context.profiles.map(profile =>
      mapDeveloperAccessProfileOption(profile, coverage.criticalPermissionKeys),
    ),
    lockoutProtection: {
      applies: user.accountType === ACCOUNT_TYPE_DEVELOPER,
      isLastAvailableDeveloper:
        user.accountType === ACCOUNT_TYPE_DEVELOPER &&
        coverage.availableUsers.length === 1 &&
        Number(coverage.availableUsers[0]?.id) === Number(user.id),
      availableDeveloperCount: coverage.availableUsers.length,
      message: LAST_DEVELOPER_LOCKOUT_MESSAGE,
      criticalPermissionKeys: coverage.criticalPermissionKeys,
    },
  }
}

export async function updateDeveloperUserSettings(userId, payload = {}, actorUsername = 'developer') {
  ensureMysqlDeveloperManagement()

  const currentUser = await getUserRecordForUpdate(userId)

  if (!currentUser) {
    throw new Error('Utilizador nao encontrado.')
  }

  const nextData = {}
  const details = {
    before: {
      accessProfileId: currentUser.accessProfileId,
      active: currentUser.active,
      deactivatedAt: toDateTimeString(currentUser.deactivatedAt),
      deletedAt: toDateTimeString(currentUser.deletedAt),
      blocked: (await getLoginBlockState(currentUser.username)).blocked,
    },
  }

  if (payload.accessProfileId !== undefined) {
    const nextAccessProfileId = toPositiveInt(payload.accessProfileId)

    if (!nextAccessProfileId) {
      throw new Error('Access profile invalido.')
    }

    const accessProfile = await prisma.accessProfile.findUnique({
      where: { id: nextAccessProfileId },
      select: { id: true, key: true, name: true },
    })

    if (!accessProfile) {
      throw new Error('Access profile nao encontrado.')
    }

    nextData.accessProfileId = accessProfile.id
    details.nextAccessProfile = {
      id: accessProfile.id,
      key: accessProfile.key,
      name: accessProfile.name,
    }
  }

  if (payload.active !== undefined) {
    const nextActive = payload.active === true
    nextData.active = nextActive
    nextData.deactivatedAt = nextActive ? null : currentUser.deactivatedAt || new Date()
  }

  const shouldUnlockBlocked = payload.unlockBlocked === true
  details.requestedChanges = {
    accessProfileId:
      nextData.accessProfileId !== undefined ? nextData.accessProfileId : currentUser.accessProfileId,
    active: nextData.active !== undefined ? nextData.active : currentUser.active,
    unlockBlocked: shouldUnlockBlocked,
  }

  try {
    await assertDeveloperAdministrativeCoverageRetained({
      userId: currentUser.id,
      accessProfileId:
        nextData.accessProfileId !== undefined ? nextData.accessProfileId : currentUser.accessProfileId,
      active: nextData.active !== undefined ? nextData.active : currentUser.active,
      unlockBlocked: shouldUnlockBlocked,
    })

    if (Object.keys(nextData).length > 0) {
      await prisma.user.update({
        where: { id: currentUser.id },
        data: nextData,
      })
    }

    if (shouldUnlockBlocked) {
      await clearFailedLoginAttempts(currentUser.username)
    }

    const updatedUser = await getDeveloperUserDetail(currentUser.id)

    await logAuditEvent({
      username: actorUsername,
      action: 'update',
      entity: 'user_access_management',
      entityId: currentUser.id,
      details: {
        ...details,
        after: {
          accessProfileId: updatedUser?.user?.accessProfileId ?? null,
          active: updatedUser?.user?.active ?? currentUser.active,
          status: updatedUser?.user?.statusKey || null,
          unlockBlocked: shouldUnlockBlocked,
        },
      },
      result: 'success',
    })

    return updatedUser
  } catch (error) {
    await logAuditEvent({
      username: actorUsername,
      action: 'update',
      entity: 'user_access_management',
      entityId: currentUser.id,
      details,
      result: 'failure',
      errorMessage: String(error?.message || 'Erro ao atualizar conta tecnica.').trim(),
    })
    throw error
  }
}

export async function getDeveloperDataIntegrityReport() {
  const [
    admins,
    developers,
    identities,
    people,
    companies,
    works,
    clients,
    assignments,
    workPlans,
    dailyNotes,
    users,
  ] = await Promise.all([
    getAllAdminsData(),
    getAllDevelopersData(),
    getAllAccessIdentitiesData(),
    getAllPeopleData(),
    getAllCompaniesData(),
    getAllWorksData(),
    getAllClientsData(),
    getAllWorkAssignmentsData(),
    getAllWorkPlansData(),
    getAllDailyWorkNotesData(),
    getAllUsersData(),
  ])

  const issues = []
  const personMap = new Map(people.map(person => [Number(person.id), person]))
  const companyMap = new Map(companies.map(company => [Number(company.id), company]))
  const workMap = new Map(works.map(work => [Number(work.id), work]))
  const clientMap = new Map(clients.map(client => [Number(client.id), client]))
  const workPlanMap = new Map(workPlans.map(workPlan => [Number(workPlan.id), workPlan]))
  const userMapByPersonId = new Map(
    users
      .filter(user => Number(user.personId) > 0)
      .map(user => [Number(user.personId), user]),
  )
  const usernameMap = new Map()
  const allAccounts = [
    ...admins.map(item => ({ username: item.username, source: 'admin', id: item.id })),
    ...developers.map(item => ({ username: item.username, source: 'developer', id: item.id })),
    ...identities.map(item => ({ username: item.username, source: 'access_identity', id: item.id })),
  ]

  allAccounts.forEach(account => {
    const username = String(account.username || '').trim().toLowerCase()

    if (!username) {
      return
    }

    const current = usernameMap.get(username) || []
    current.push(account)
    usernameMap.set(username, current)
  })

  const duplicateUsernames = []
  usernameMap.forEach((entries, username) => {
    if (entries.length > 1) {
      duplicateUsernames.push({
        username,
        entries: entries.map(entry => ({
          source: entry.source,
          id: entry.id,
        })),
      })
    }
  })

  if (duplicateUsernames.length > 0) {
    issues.push(
      buildIntegrityIssue({
        id: 'duplicate_usernames',
        severity: 'high',
        category: 'accounts',
        title: `${duplicateUsernames.length} username(s) duplicado(s)`,
        description: 'Existem usernames repetidos em contas tecnicas ou operacionais.',
        items: duplicateUsernames,
      }),
    )
  }

  const orphanedAssignments = assignments
    .filter(
      assignment =>
        !personMap.has(Number(assignment.personId)) ||
        !workMap.has(Number(assignment.workId)) ||
        !workPlanMap.has(Number(assignment.workPlanId)),
    )
    .map(assignment => ({
      assignmentId: assignment.id,
      workId: assignment.workId,
      personId: assignment.personId,
      workPlanId: assignment.workPlanId,
    }))

  if (orphanedAssignments.length > 0) {
    issues.push(
      buildIntegrityIssue({
        id: 'orphaned_assignments',
        severity: 'high',
        category: 'relations',
        title: `${orphanedAssignments.length} atribuicoes orfas`,
        description: 'Existem atribuicoes ligadas a pessoas ou obras inexistentes.',
        items: orphanedAssignments,
      }),
    )
  }

  const worksWithoutClient = works
    .filter(work => !clientMap.has(Number(work.clientId)))
    .map(work => ({
      workId: work.id,
      number: work.number,
      name: work.name,
      clientId: work.clientId,
    }))

  if (worksWithoutClient.length > 0) {
    issues.push(
      buildIntegrityIssue({
        id: 'works_without_client',
        severity: 'medium',
        category: 'relations',
        title: `${worksWithoutClient.length} obra(s) sem cliente valido`,
        description: 'Algumas obras perderam a ligacao a um cliente valido.',
        items: worksWithoutClient,
      }),
    )
  }

  const peopleWithoutConfiguredAccess = people
    .filter(person => roleRequiresAppAccess(person.role) && !userMapByPersonId.has(Number(person.id)))
    .map(person => ({
      personId: person.id,
      name: person.name,
      role: person.role,
      roleLabel: getEntityRoleLabel(person),
    }))

  if (peopleWithoutConfiguredAccess.length > 0) {
    issues.push(
      buildIntegrityIssue({
        id: 'people_without_access',
        severity: 'medium',
        category: 'access',
        title: `${peopleWithoutConfiguredAccess.length} pessoa(s) sem acesso configurado`,
        description: 'Existem pessoas com role de acesso que ainda nao tem conta operacional ligada.',
        items: peopleWithoutConfiguredAccess,
      }),
    )
  }

  const usersWithoutAccessProfile = users
    .filter(user => !user.hasExplicitAccessProfile)
    .map(user => ({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      roleLabel: getEntityRoleLabel(user),
      accountType: user.accountType,
      suggestedAccessProfile: resolveAccessProfileForUser({
        role: user.role,
        accountType: user.accountType,
      }),
    }))

  if (usersWithoutAccessProfile.length > 0) {
    issues.push(
      buildIntegrityIssue({
        id: 'users_without_access_profile',
        severity: 'medium',
        category: 'permissions',
        title: `${usersWithoutAccessProfile.length} utilizador(es) sem accessProfile`,
        description: 'A conta existe, mas o perfil de acesso ainda nao ficou gravado de forma explicita.',
        items: usersWithoutAccessProfile,
        fixable: isMysqlDataSourceEnabled(),
        fixLabel: 'Aplicar mapping automatico',
      }),
    )
  }

  const roleMismatchIdentities = users
    .filter(
      user =>
        user.accountType === ACCOUNT_TYPE_OPERATIONAL &&
        user.person &&
        normalizeRole(user.person.role) !== normalizeRole(user.role),
    )
    .map(user => ({
      userId: user.id,
      personId: user.personId,
      username: user.username,
      currentRole: user.role,
      expectedRole: user.person?.role,
      name: user.person?.name || user.username,
    }))

  if (roleMismatchIdentities.length > 0) {
    issues.push(
      buildIntegrityIssue({
        id: 'role_mismatch_identities',
        severity: 'high',
        category: 'access',
        title: `${roleMismatchIdentities.length} identidade(s) com role inconsistente`,
        description: 'O role gravado na conta operacional nao coincide com o role da pessoa ligada.',
        items: roleMismatchIdentities,
        fixable: isMysqlDataSourceEnabled(),
        fixLabel: 'Sincronizar role e perfil',
      }),
    )
  }

  const orphanedNotes = dailyNotes
    .filter(note => !workMap.has(Number(note.workId)))
    .map(note => ({
      noteId: note.id,
      workId: note.workId,
      date: note.date,
    }))

  if (orphanedNotes.length > 0) {
    issues.push(
      buildIntegrityIssue({
        id: 'orphaned_daily_notes',
        severity: 'low',
        category: 'relations',
        title: `${orphanedNotes.length} nota(s) diaria(s) com obra invalida`,
        description: 'Existem notas diarias ligadas a obras que ja nao existem.',
        items: orphanedNotes,
      }),
    )
  }

  const orphanedPlans = workPlans
    .filter(plan => !companyMap.has(Number(plan.companyId)))
    .map(plan => ({
      workPlanId: plan.id,
      date: plan.date,
      companyId: plan.companyId,
    }))

  if (orphanedPlans.length > 0) {
    issues.push(
      buildIntegrityIssue({
        id: 'orphaned_work_plans',
        severity: 'medium',
        category: 'relations',
        title: `${orphanedPlans.length} plano(s) orfaos`,
        description: 'Existem planos que apontam para obras invalidadas ou removidas.',
        items: orphanedPlans,
      }),
    )
  }

  return {
    issues: issues.sort(sortIntegrityIssues),
    statistics: {
      totalPeople: people.length,
      totalWorks: works.length,
      totalClients: clients.length,
      totalAssignments: assignments.length,
      totalWorkPlans: workPlans.length,
      totalDailyNotes: dailyNotes.length,
      totalAccounts: admins.length + developers.length + identities.length,
      totalUsers: users.length,
    },
    hasIssues: issues.length > 0,
    issueCounts: {
      high: issues.filter(issue => issue.severity === 'high').length,
      medium: issues.filter(issue => issue.severity === 'medium').length,
      low: issues.filter(issue => issue.severity === 'low').length,
    },
  }
}

export async function applyDeveloperDataIntegrityFix(issueId, actorUsername = 'developer') {
  ensureMysqlDeveloperManagement()

  const normalizedIssueId = String(issueId || '').trim()

  if (!normalizedIssueId) {
    throw new Error('Issue invalida.')
  }

  if (normalizedIssueId === 'users_without_access_profile') {
    const users = await prisma.user.findMany({
      where: {
        accessProfileId: null,
      },
      include: {
        person: true,
      },
      orderBy: [{ username: 'asc' }, { id: 'asc' }],
    })

    if (users.length === 0) {
      return {
        fixedCount: 0,
        message: 'Nao havia utilizadores sem accessProfile.',
      }
    }

    const updatedUsers = []

    for (const user of users) {
      const accessProfileId = await getAutomaticAccessProfileIdForUser(user)

      if (!accessProfileId) {
        continue
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          accessProfileId,
        },
      })

      updatedUsers.push({
        userId: user.id,
        username: user.username,
        accessProfileId,
      })
    }

    await logAuditEvent({
      username: actorUsername,
      action: 'update',
      entity: 'data_integrity_fix',
      entityId: 0,
      details: {
        issueId: normalizedIssueId,
        updatedUsers,
      },
      result: 'success',
    })

    return {
      fixedCount: updatedUsers.length,
      message: `${updatedUsers.length} utilizador(es) ficaram com accessProfile atribuido.`,
    }
  }

  if (normalizedIssueId === 'role_mismatch_identities') {
    const users = await prisma.user.findMany({
      where: {
        accountType: ACCOUNT_TYPE_OPERATIONAL,
        personId: {
          not: null,
        },
      },
      include: {
        person: true,
      },
      orderBy: [{ username: 'asc' }, { id: 'asc' }],
    })

    const mismatchedUsers = users.filter(user =>
      user.person?.role && normalizeRole(user.person.role) !== normalizeRole(user.role),
    )

    if (mismatchedUsers.length === 0) {
      return {
        fixedCount: 0,
        message: 'Nao havia identidades com role inconsistente.',
      }
    }

    const updatedUsers = []

    for (const user of mismatchedUsers) {
      const nextRole = normalizeRole(user.person?.role)
      const nextAccessProfileId =
        user.accessProfileId || (await getAutomaticAccessProfileIdForUser({
          ...user,
          role: nextRole,
        }))

      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: nextRole,
          accessProfileId: nextAccessProfileId || undefined,
        },
      })

      updatedUsers.push({
        userId: user.id,
        username: user.username,
        role: nextRole,
        accessProfileId: nextAccessProfileId || null,
      })
    }

    await logAuditEvent({
      username: actorUsername,
      action: 'update',
      entity: 'data_integrity_fix',
      entityId: 0,
      details: {
        issueId: normalizedIssueId,
        updatedUsers,
      },
      result: 'success',
    })

    return {
      fixedCount: updatedUsers.length,
      message: `${updatedUsers.length} identidade(s) foram sincronizadas com o role da pessoa.`,
    }
  }

  throw new Error('Esta correcao automatica ainda nao esta disponivel.')
}

async function getLatestBackupInfo() {
  try {
    const files = await fs.readdir(EXPORTS_DIR, { withFileTypes: true })
    const jsonFiles = files.filter(file => file.isFile() && file.name.toLowerCase().endsWith('.json'))

    if (jsonFiles.length === 0) {
      return {
        value: 'Sem backup',
        helper: 'Nao existe nenhum ficheiro em data/exports.',
        tone: 'warning',
      }
    }

    const filesWithStats = await Promise.all(
      jsonFiles.map(async file => {
        const filePath = path.join(EXPORTS_DIR, file.name)
        const stats = await fs.stat(filePath)
        return {
          name: file.name,
          modifiedAt: stats.mtime,
        }
      }),
    )

    const latestFile = filesWithStats.sort((left, right) => right.modifiedAt.getTime() - left.modifiedAt.getTime())[0]

    return {
      value: latestFile.modifiedAt.toLocaleString('pt-PT'),
      helper: latestFile.name,
      tone: 'success',
    }
  } catch (error) {
    return {
      value: 'Indisponivel',
      helper: error.message,
      tone: 'warning',
    }
  }
}

async function getPackageVersion() {
  try {
    const rawPackage = await fs.readFile(PACKAGE_JSON_PATH, 'utf8')
    const packageJson = JSON.parse(rawPackage)
    return String(packageJson.version || '0.0.0')
  } catch (error) {
    return 'desconhecida'
  }
}

async function getBuildId() {
  try {
    return String(await fs.readFile(NEXT_BUILD_ID_PATH, 'utf8')).trim() || 'indisponivel'
  } catch (error) {
    return process.env.NODE_ENV === 'production' ? 'indisponivel' : 'development'
  }
}

async function getDatabaseState() {
  if (!isMysqlDataSourceEnabled()) {
    return {
      value: 'JSON',
      helper: 'Modo legacy sem MySQL.',
      tone: 'warning',
    }
  }

  try {
    const userCount = await prisma.user.count()

    return {
      value: 'Online',
      helper: `MySQL ativo · ${userCount} utilizador(es).`,
      tone: 'success',
    }
  } catch (error) {
    return {
      value: 'Erro',
      helper: error.message,
      tone: 'danger',
    }
  }
}

async function getOnlineUsersState() {
  try {
    const cutoff = Date.now() - (30 * 60 * 1000)
    const usernames = new Set(
      (await getAllLoginEvents())
        .filter(event => new Date(event.loginAt).getTime() >= cutoff)
        .map(event => String(event.username || '').trim().toLowerCase())
        .filter(Boolean),
    )

    return {
      value: String(usernames.size),
      helper: 'Janela de atividade dos ultimos 30 minutos.',
      tone: usernames.size > 0 ? 'success' : 'neutral',
    }
  } catch (error) {
    return {
      value: '0',
      helper: error.message,
      tone: 'warning',
    }
  }
}

function buildMigrationEntities() {
  const mysqlEnabled = isMysqlDataSourceEnabled()

  const runtimeSource = (mysqlSource, fallbackSource = 'json') =>
    mysqlEnabled ? mysqlSource : fallbackSource

  return [
    { id: 'people', label: 'People', source: runtimeSource('mysql'), helper: 'Leitura operacional de pessoas.' },
    { id: 'users', label: 'Users', source: runtimeSource('mysql'), helper: 'Contas e sessoes operacionais.' },
    { id: 'works', label: 'Works', source: runtimeSource('mysql'), helper: 'Obras e detalhe por cliente.' },
    { id: 'clients', label: 'Clients', source: runtimeSource('mysql'), helper: 'Clientes da gestao de obras.' },
    { id: 'companies', label: 'Companies', source: runtimeSource('mysql'), helper: 'Empresas base da operacao.' },
    { id: 'work_plans', label: 'Work Plans', source: runtimeSource('mysql'), helper: 'Planeamento diario.' },
    { id: 'work_assignments', label: 'Work Assignments', source: runtimeSource('mysql'), helper: 'Afetacoes de pessoas a obras.' },
    { id: 'daily_work_notes', label: 'Daily Work Notes', source: runtimeSource('mysql'), helper: 'Notas diarias e preview.' },
    { id: 'access_identities', label: 'Access Identities', source: runtimeSource('mysql'), helper: 'Identidades operacionais ligadas a pessoas.' },
    { id: 'access_profiles', label: 'Access Profiles', source: runtimeSource('mysql'), helper: 'Perfis configuraveis.' },
    { id: 'permissions', label: 'Permissions', source: runtimeSource('mysql'), helper: 'Catalogo de permissoes.' },
    { id: 'developer_override_events', label: 'Developer Override Events', source: runtimeSource('mysql'), helper: 'Auditoria dos overrides tecnicos.' },
    { id: 'admins', label: 'Admins', source: runtimeSource('hybrid'), helper: 'Conta DB com fallback legacy admins.json.' },
    { id: 'developers', label: 'Developers', source: runtimeSource('hybrid'), helper: 'Conta DB com fallback legacy developers.json.' },
    { id: 'feature_flags', label: 'Feature Flags', source: 'json', helper: 'Estado tecnico ainda lido de feature-flags.json.' },
    { id: 'login_events', label: 'Login Events', source: 'json', helper: 'Historico tecnico de logins.' },
    { id: 'login_attempts', label: 'Login Attempts', source: 'json', helper: 'Tentativas falhadas e bloqueios.' },
    { id: 'audit_trail', label: 'Audit Trail', source: 'json', helper: 'Trilho tecnico global em ficheiro.' },
    { id: 'materials', label: 'Materials', source: 'json', helper: 'Stock ainda suportado por materials.json.' },
  ]
}

function getPrimaryDataSourceValue(entities) {
  const uniqueSources = new Set(entities.map(entity => entity.source))

  if (uniqueSources.size === 1 && uniqueSources.has('mysql')) {
    return 'MySQL'
  }

  if (uniqueSources.size === 1 && uniqueSources.has('json')) {
    return 'JSON'
  }

  return 'Hibrido'
}

function buildPrimaryDataSourceHelper(primarySource, entities) {
  if (primarySource === 'MySQL') {
    return 'Toda a aplicacao esta a ler de MySQL.'
  }

  if (primarySource === 'JSON') {
    return 'A aplicacao continua em modo legacy baseado em JSON.'
  }

  const jsonCount = entities.filter(entity => entity.source === 'json').length
  const hybridCount = entities.filter(entity => entity.source === 'hybrid').length
  return `Operacao principal em MySQL com ${jsonCount} entidade(s) em JSON e ${hybridCount} fluxo(s) hibridos.`
}

export async function getDeveloperSystemState() {
  const migrationEntities = buildMigrationEntities()
  const primaryDataSource = getPrimaryDataSourceValue(migrationEntities)
  const [
    database,
    latestBackup,
    version,
    build,
    onlineUsers,
    accessProfilesCount,
    permissionsCount,
    overrideEventsCount,
  ] = await Promise.all([
    getDatabaseState(),
    getLatestBackupInfo(),
    getPackageVersion(),
    getBuildId(),
    getOnlineUsersState(),
    isMysqlDataSourceEnabled() ? prisma.accessProfile.count() : Promise.resolve(ACCESS_PROFILE_DEFINITIONS.length),
    isMysqlDataSourceEnabled() ? prisma.permission.count() : Promise.resolve(PERMISSION_DEFINITIONS.length),
    isMysqlDataSourceEnabled() ? prisma.developerOverrideEvent.count() : Promise.resolve(0),
  ])
  const migrationSummary = {
    mysql: migrationEntities.filter(entity => entity.source === 'mysql').length,
    json: migrationEntities.filter(entity => entity.source === 'json').length,
    hybrid: migrationEntities.filter(entity => entity.source === 'hybrid').length,
  }

  return {
    generatedAt: new Date().toISOString(),
    cards: [
      {
        id: 'primary_data_source',
        label: 'Origem principal dos dados',
        value: primaryDataSource,
        helper: buildPrimaryDataSourceHelper(primaryDataSource, migrationEntities),
        tone: primaryDataSource === 'MySQL' ? 'success' : primaryDataSource === 'JSON' ? 'warning' : 'neutral',
      },
      {
        id: 'database',
        label: 'Base de Dados',
        ...database,
      },
      {
        id: 'api',
        label: 'API',
        value: 'Online',
        helper: 'Rota tecnica a responder sem erros.',
        tone: 'success',
      },
      {
        id: 'backup',
        label: 'Ultimo Backup',
        ...latestBackup,
      },
      {
        id: 'online_users',
        label: 'Utilizadores Online',
        ...onlineUsers,
      },
      {
        id: 'version',
        label: 'Versao',
        value: version,
        helper: 'Lida de package.json.',
        tone: 'neutral',
      },
      {
        id: 'build',
        label: 'Build',
        value: build,
        helper: 'BUILD_ID atual da aplicacao.',
        tone: 'neutral',
      },
      {
        id: 'access_profiles_total',
        label: 'Access Profiles',
        value: String(accessProfilesCount),
        helper: 'Perfis tecnicos registados.',
        tone: 'neutral',
      },
      {
        id: 'permissions_total',
        label: 'Permissions',
        value: String(permissionsCount),
        helper: 'Permissoes disponiveis no catalogo.',
        tone: 'neutral',
      },
      {
        id: 'override_events_total',
        label: 'Developer Overrides',
        value: String(overrideEventsCount),
        helper: 'Eventos tecnicos auditados.',
        tone: overrideEventsCount > 0 ? 'warning' : 'success',
      },
    ],
    migration: {
      primaryDataSource,
      summary: migrationSummary,
      entities: migrationEntities,
    },
  }
}
