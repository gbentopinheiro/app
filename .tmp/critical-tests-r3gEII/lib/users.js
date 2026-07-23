import {
  ACCOUNT_TYPE_ADMIN,
  ACCOUNT_TYPE_DEVELOPER,
  ACCOUNT_TYPE_OPERATIONAL,
  normalizeAccountType,
} from './account-types.js'
import { ACCESS_PROFILE_DEFINITIONS, resolveAccessProfileForUser } from './access-profiles.js'
import { getAccessIdentityById, getAccessIdentityByPersonId, getAccessIdentityByUsername, getAllAccessIdentities, updateAccessIdentity } from './access-identities.js'
import { getAdminById, getAdminByUsername, getAllAdmins, updateAdminPassword } from './admins.js'
import { isMysqlDataSourceEnabled } from './data-source.js'
import { getDeveloperById, getDeveloperByUsername, getAllDevelopers, updateDeveloperPassword } from './developers.js'
import {
  getAllUsersDb,
  getUserByIdDb,
  getUserByPersonIdDb,
  getUserByUsernameDb,
  updateUserLastLoginDb,
  updateUserPasswordDb,
} from './db/users-db.js'
import { hashPasswordIfNeeded } from './passwords.js'
import { getAccessProfilePermissionKeys } from './permissions.js'

function buildLegacyAccessProfileState({ role, accountType }) {
  const accessProfile = resolveAccessProfileForUser({ role, accountType })
  const accessProfileDefinition = ACCESS_PROFILE_DEFINITIONS.find(definition => definition.key === accessProfile)

  return {
    accessProfileId: null,
    accessProfile,
    accessProfileName: accessProfileDefinition?.name || null,
    accessProfileDescription: accessProfileDefinition?.description || null,
    hasExplicitAccessProfile: false,
    permissionKeys: [...getAccessProfilePermissionKeys(accessProfile)],
  }
}

function toDateTimeString(value) {
  if (!value) {
    return null
  }

  const candidate = value instanceof Date ? value : new Date(value)
  return Number.isNaN(candidate.getTime()) ? null : candidate.toISOString()
}

function mapLegacyAdmin(admin) {
  if (!admin) {
    return null
  }

  const role = 'admin'
  const accountType = ACCOUNT_TYPE_ADMIN

  return {
    id: Number(admin.id),
    personId: null,
    ...buildLegacyAccessProfileState({ role, accountType }),
    username: String(admin.username || '').trim(),
    passwordHash: String(admin.password || '').trim(),
    password: String(admin.password || '').trim(),
    role,
    accountType,
    name: String(admin.name || admin.username || '').trim() || 'Administrador',
    active: true,
    deactivatedAt: null,
    deletedAt: null,
    lastLoginAt: null,
    legacySource: 'admin',
    legacySourceId: Number(admin.id),
    person: null,
  }
}

function mapLegacyDeveloper(developer) {
  if (!developer) {
    return null
  }

  const role = 'developer'
  const accountType = ACCOUNT_TYPE_DEVELOPER

  return {
    id: Number(developer.id),
    personId: null,
    ...buildLegacyAccessProfileState({ role, accountType }),
    username: String(developer.username || '').trim(),
    passwordHash: String(developer.password || '').trim(),
    password: String(developer.password || '').trim(),
    role,
    accountType,
    name: String(developer.name || developer.username || '').trim() || 'Programador',
    active: true,
    deactivatedAt: null,
    deletedAt: null,
    lastLoginAt: null,
    legacySource: 'developer',
    legacySourceId: Number(developer.id),
    person: null,
  }
}

function mapLegacyOperational(identity) {
  if (!identity) {
    return null
  }

  const role = identity.person?.role || identity.role || ''
  const accountType = ACCOUNT_TYPE_OPERATIONAL

  return {
    id: Number(identity.id),
    personId: identity.person?.id || identity.personId || null,
    ...buildLegacyAccessProfileState({ role, accountType }),
    username: String(identity.username || '').trim(),
    passwordHash: String(identity.password || '').trim(),
    password: String(identity.password || '').trim(),
    role,
    accountType,
    name: String(identity.person?.name || identity.username || '').trim() || identity.username,
    active: true,
    deactivatedAt: null,
    deletedAt: null,
    lastLoginAt: null,
    legacySource: 'access_identity',
    legacySourceId: Number(identity.id),
    person: identity.person || null,
  }
}

function getLegacyUserByUsername(username) {
  const identity = getAccessIdentityByUsername(username)

  if (identity) {
    return mapLegacyOperational(identity)
  }

  const developer = getDeveloperByUsername(username)

  if (developer) {
    return mapLegacyDeveloper(developer)
  }

  return mapLegacyAdmin(getAdminByUsername(username))
}

function getLegacyUserById(id, options = {}) {
  const accountType = normalizeAccountType(options.accountType, '')

  if (accountType === ACCOUNT_TYPE_OPERATIONAL) {
    return mapLegacyOperational(getAccessIdentityById(id))
  }

  if (accountType === ACCOUNT_TYPE_DEVELOPER) {
    return mapLegacyDeveloper(getDeveloperById(id))
  }

  if (accountType === ACCOUNT_TYPE_ADMIN) {
    return mapLegacyAdmin(getAdminById(id))
  }

  return (
    mapLegacyOperational(getAccessIdentityById(id)) ||
    mapLegacyDeveloper(getDeveloperById(id)) ||
    mapLegacyAdmin(getAdminById(id))
  )
}

function getLegacyUserByPersonId(personId) {
  return mapLegacyOperational(getAccessIdentityByPersonId(personId))
}

function getLegacyUsers() {
  return [
    ...getAllAdmins().map(mapLegacyAdmin),
    ...getAllDevelopers().map(mapLegacyDeveloper),
    ...getAllAccessIdentities().map(mapLegacyOperational),
  ]
}

async function updateLegacyUserPassword(user, password, options = {}) {
  if (!user?.legacySource) {
    return
  }

  const targetId = Number(user.legacySourceId || user.id)

  if (user.legacySource === 'access_identity') {
    updateAccessIdentity(targetId, { password }, options)
    return
  }

  if (user.legacySource === 'developer') {
    updateDeveloperPassword(targetId, password, options)
    return
  }

  if (user.legacySource === 'admin') {
    updateAdminPassword(targetId, password, options)
  }
}

export async function getAllUsersData() {
  if (!isMysqlDataSourceEnabled()) {
    return getLegacyUsers()
  }

  return getAllUsersDb()
}

export async function getUserByUsernameData(username) {
  if (isMysqlDataSourceEnabled()) {
    return getUserByUsernameDb(username)
  }

  return getLegacyUserByUsername(username)
}

export async function getUserByIdData(id, options = {}) {
  if (isMysqlDataSourceEnabled()) {
    return getUserByIdDb(id)
  }

  return getLegacyUserById(id, options)
}

export async function getUserByPersonIdData(personId) {
  if (isMysqlDataSourceEnabled()) {
    return getUserByPersonIdDb(personId)
  }

  return getLegacyUserByPersonId(personId)
}

export async function updateUserPasswordData(id, password, options = {}) {
  if (isMysqlDataSourceEnabled()) {
    const user = await getUserByIdDb(id)

    if (!user) {
      return null
    }

    const passwordHash = hashPasswordIfNeeded(password, options)
    const updatedUser = await updateUserPasswordDb(user.id, passwordHash)
    return updatedUser || user
  }

  const legacyUser = getLegacyUserById(id, options)

  if (!legacyUser) {
    return null
  }

  await updateLegacyUserPassword(legacyUser, password, options)
  return getLegacyUserById(id, options)
}

export async function touchUserLastLoginData(id, loginAt = new Date().toISOString()) {
  if (!isMysqlDataSourceEnabled()) {
    return null
  }

  const user = await getUserByIdDb(id)

  if (!user) {
    return null
  }

  return updateUserLastLoginDb(user.id, toDateTimeString(loginAt) || new Date().toISOString())
}
