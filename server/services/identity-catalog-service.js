import {
  ACCOUNT_TYPE_ADMIN,
  ACCOUNT_TYPE_DEVELOPER,
  ACCOUNT_TYPE_OPERATIONAL,
} from '../../lib/account-types.js'
import {
  ACCESS_PROFILE_DEFINITIONS,
  normalizeAccessProfile,
  resolveAccessProfileForUser,
} from '../../lib/access-profiles.js'
import { getAllUsersDb } from '../../lib/db/users-db.js'
import { getAllAccessProfilesDb } from '../../lib/db/access-profiles-db.js'
import { getAllLoginAttemptsDb } from '../../lib/db/login-attempts-db.js'
import { getAllPermissionsDb } from '../../lib/db/permissions-db.js'
import { PERMISSION_DEFINITIONS } from '../../lib/permissions.js'
import { getEntityRoleLabel, normalizeRole } from '../../lib/roles.js'

const ACCESS_PROFILE_DEFINITION_MAP = new Map(
  ACCESS_PROFILE_DEFINITIONS.map(definition => [definition.key, definition]),
)
const ACCESS_PROFILE_ORDER = new Map(
  ACCESS_PROFILE_DEFINITIONS.map((definition, index) => [definition.key, index]),
)
const PERMISSION_DEFINITION_MAP = new Map(
  PERMISSION_DEFINITIONS.map(definition => [definition.key, definition]),
)
const PERMISSION_ORDER = new Map(
  PERMISSION_DEFINITIONS.map((definition, index) => [definition.key, index]),
)
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

function hasCriticalDeveloperPermissions(
  permissionKeys = [],
  criticalPermissionKeys = getCriticalDeveloperPermissionKeys(),
) {
  const normalizedPermissionKeys = new Set(normalizePermissionKeyList(permissionKeys))
  return criticalPermissionKeys.every(permissionKey => normalizedPermissionKeys.has(permissionKey))
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

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase()
}

function getBlockedState(record, now = new Date()) {
  if (!record?.blockedUntil) {
    return { blocked: false, retryAfterSeconds: 0 }
  }

  const remainingMs = new Date(record.blockedUntil).getTime() - now.getTime()

  if (remainingMs <= 0) {
    return { blocked: false, retryAfterSeconds: 0 }
  }

  return {
    blocked: true,
    retryAfterSeconds: Math.ceil(remainingMs / 1000),
  }
}

function getUserStatus(user, loginAttemptsByUsername = new Map(), now = new Date()) {
  const blockedState = getBlockedState(
    loginAttemptsByUsername.get(normalizeUsername(user.username)),
    now,
  )

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

function buildAccessProfilesCatalog(profiles) {
  return {
    profiles,
    profilesById: new Map(profiles.map(profile => [profile.id, profile])),
    profilesByKey: new Map(profiles.map(profile => [profile.key, profile])),
  }
}

function mapManagedUser(user, context = {}) {
  const role = normalizeRole(user?.role)
  const accessProfileId = Number(user?.accessProfileId) || null
  const hasExplicitAccessProfile = user?.hasExplicitAccessProfile === true || accessProfileId !== null
  const explicitProfile = accessProfileId ? context.accessProfilesById?.get(accessProfileId) : null
  const resolvedAccessProfileKey = normalizeAccessProfile(
    explicitProfile?.key || user?.accessProfile || resolveAccessProfileForUser({
      role,
      accountType: user?.accountType,
    }),
  )
  const resolvedProfile = explicitProfile || context.accessProfilesByKey?.get(resolvedAccessProfileKey) || null
  const status = getUserStatus(
    user,
    context.loginAttemptsByUsername,
    context.now,
  )

  return {
    id: Number(user.id),
    personId: Number(user.personId) || null,
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
    suggestedAccessProfileName:
      resolvedProfile?.name ||
      ACCESS_PROFILE_DEFINITION_MAP.get(resolvedAccessProfileKey)?.name ||
      null,
    active: user.active !== false,
    blocked: status.blocked,
    statusKey: status.key,
    statusLabel: status.label,
    statusHelper: status.helper,
    retryAfterSeconds: status.retryAfterSeconds,
    deletedAt: user.deletedAt || null,
    deactivatedAt: user.deactivatedAt || null,
    lastLoginAt: user.lastLoginAt || null,
  }
}

export async function getPermissionsCatalogMysql() {
  return getAllPermissionsDb()
}

export async function getAccessProfilesCatalogMysql() {
  return buildAccessProfilesCatalog(await getAllAccessProfilesDb())
}

export function mapDeveloperAccessProfileOption(
  profile,
  criticalPermissionKeys = getCriticalDeveloperPermissionKeys(),
) {
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

export function buildUserSummary(users) {
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

export async function getManagedUsersContextMysql() {
  const now = new Date()
  const [accessProfilesContext, permissions, users, loginAttempts] = await Promise.all([
    getAccessProfilesCatalogMysql(),
    getPermissionsCatalogMysql(),
    getAllUsersDb(),
    getAllLoginAttemptsDb(),
  ])
  const loginAttemptsByUsername = new Map(
    loginAttempts.map(loginAttempt => [normalizeUsername(loginAttempt.username), loginAttempt]),
  )

  const managedUsers = (await Promise.all(
    users.map(user =>
      mapManagedUser(user, {
        accessProfilesById: accessProfilesContext.profilesById,
        accessProfilesByKey: accessProfilesContext.profilesByKey,
        loginAttemptsByUsername,
        now,
      }),
    ),
  )).sort(
    (left, right) =>
      left.name.localeCompare(right.name, 'pt-PT') ||
      left.username.localeCompare(right.username, 'pt-PT'),
  )

  return {
    permissions,
    profiles: accessProfilesContext.profiles,
    profilesById: accessProfilesContext.profilesById,
    profilesByKey: accessProfilesContext.profilesByKey,
    users: managedUsers,
  }
}

export async function getDeveloperUsersOverviewMysql() {
  const context = await getManagedUsersContextMysql()
  const criticalPermissionKeys = getCriticalDeveloperPermissionKeys()

  return {
    users: context.users,
    summary: buildUserSummary(context.users),
    accessProfiles: context.profiles.map(profile =>
      mapDeveloperAccessProfileOption(profile, criticalPermissionKeys),
    ),
  }
}

export async function getDeveloperAccessProfilesOverviewMysql() {
  const context = await getManagedUsersContextMysql()
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

      return leftOrder - rightOrder || left.key.localeCompare(right.key, 'pt-PT')
    })
}
