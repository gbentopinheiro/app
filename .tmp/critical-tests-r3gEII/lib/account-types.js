import { ROLE_ADMIN, ROLE_DEVELOPER, normalizeRole } from './roles.js'

export const ACCOUNT_TYPE_OPERATIONAL = 'operational'
export const ACCOUNT_TYPE_ADMIN = 'admin'
export const ACCOUNT_TYPE_DEVELOPER = 'developer'

const ACCOUNT_TYPES = new Set([
  ACCOUNT_TYPE_OPERATIONAL,
  ACCOUNT_TYPE_ADMIN,
  ACCOUNT_TYPE_DEVELOPER,
])

export function normalizeAccountType(accountType, fallback = ACCOUNT_TYPE_OPERATIONAL) {
  const normalizedAccountType = String(accountType || '').trim().toLowerCase()
  return ACCOUNT_TYPES.has(normalizedAccountType) ? normalizedAccountType : fallback
}

export function inferAccountType({ accountType, role, personId } = {}) {
  const normalizedAccountType = normalizeAccountType(accountType, '')

  if (normalizedAccountType) {
    return normalizedAccountType
  }

  const normalizedRole = normalizeRole(role)

  if (normalizedRole === ROLE_DEVELOPER) {
    return ACCOUNT_TYPE_DEVELOPER
  }

  if (normalizedRole === ROLE_ADMIN) {
    return ACCOUNT_TYPE_ADMIN
  }

  return Number(personId) > 0 ? ACCOUNT_TYPE_OPERATIONAL : ACCOUNT_TYPE_OPERATIONAL
}

