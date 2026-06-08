import { inferAccountType } from './account-types.js'
import { normalizeAccessProfile, resolveAccessProfileForUser } from './access-profiles.js'
import { getAccessProfilePermissionKeys, hasAnyPermission, hasPermission } from './permissions.js'
import { canRoleSignIn, isChefRole, isDeveloperRole, isResponsavelRole, isSupportedRole, normalizeRole } from './roles.js'

export const SESSION_COOKIE_NAME = 'bentix_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12

const DEVELOPER_PERMISSION_KEYS = Object.freeze([
  'developer.dashboard.read',
  'developer.dashboard.export',
  'developer.feature_flags.read',
  'developer.feature_flags.manage',
  'developer.users.read',
  'developer.users.reset_password',
  'developer.audit.read',
  'developer.audit.write',
  'developer.data_integrity.read',
  'developer.data_management.read',
  'developer.data_management.export',
  'developer.diagnostics.read',
  'developer.test_data.generate',
])

const MATERIALS_PERMISSION_KEYS = Object.freeze([
  'materials.read',
  'materials.create',
  'materials.update',
  'materials.delete',
])

const CALENDAR_PERMISSION_KEYS = Object.freeze([
  'calendar.read',
  'calendar.manage',
])

const PEOPLE_PERMISSION_KEYS = Object.freeze([
  'people.read',
  'people.read_full',
  'people.create_basic',
  'people.create_full',
  'people.update_full',
  'people.delete',
  'people.documents.read',
  'people.documents.write',
  'people.documents.delete',
  'people.activity_history.read',
])

const CLIENTS_PERMISSION_KEYS = Object.freeze([
  'clients.read',
  'clients.create',
  'clients.update',
  'clients.delete',
])

const WORKS_PERMISSION_KEYS = Object.freeze([
  'works.read',
  'works.create',
  'works.update',
  'works.delete',
  'works.special_pricing.manage',
  'works.annual_summary.read',
  'works.annual_summary.export',
])

const WORK_PLANS_PERMISSION_KEYS = Object.freeze([
  'work_plans.read',
  'work_plans.create',
  'work_plans.copy_previous',
  'work_plans.update',
  'work_plans.delete',
])

const WORK_ASSIGNMENTS_PERMISSION_KEYS = Object.freeze([
  'work_assignments.read',
  'work_assignments.create',
  'work_assignments.update',
  'work_assignments.delete',
  'work_assignments.submit',
  'work_assignments.approve',
])

const DAILY_WORK_NOTES_PERMISSION_KEYS = Object.freeze([
  'daily_work_notes.read',
  'daily_work_notes.write',
  'daily_work_notes.delete',
])

const ACCESS_IDENTITIES_PERMISSION_KEYS = Object.freeze([
  'access_identities.read',
  'access_identities.manage',
])

function hasPathPrefix(pathname, basePath) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`)
}

function normalizePermissionKeys(permissionKeys) {
  if (!Array.isArray(permissionKeys)) {
    return []
  }

  return Array.from(
    new Set(
      permissionKeys
        .map(permissionKey => String(permissionKey || '').trim())
        .filter(Boolean),
    ),
  )
}

function getSessionPermissionKeys(session) {
  return normalizePermissionKeys(session?.permissionKeys)
}

function sessionHasPermission(session, permissionKey) {
  const sessionPermissionKeys = getSessionPermissionKeys(session)

  if (sessionPermissionKeys.includes(permissionKey)) {
    return true
  }

  return hasPermission(session, permissionKey)
}

function sessionHasAnyPermission(session, permissionKeys) {
  const sessionPermissionKeys = getSessionPermissionKeys(session)

  if (permissionKeys.some(permissionKey => sessionPermissionKeys.includes(permissionKey))) {
    return true
  }

  return hasAnyPermission(session, permissionKeys)
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function getSessionSecret() {
  const sessionSecret = String(process.env.AUTH_SECRET || '').trim()

  if (sessionSecret) {
    return sessionSecret
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET e obrigatoria em producao.')
  }

  return 'benpin-local-development-secret'
}

function toBase64Url(input) {
  const bytes = input instanceof Uint8Array ? input : encoder.encode(String(input))

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
  }

  let binary = ''
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value) {
  const normalizedValue = String(value || '').replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalizedValue.length % 4 === 0 ? '' : '='.repeat(4 - (normalizedValue.length % 4))
  const base64 = `${normalizedValue}${padding}`

  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'))
  }

  const binary = atob(base64)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function signValue(value) {
  const key = await getSigningKey()
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return new Uint8Array(signature)
}

function normalizeSession(session) {
  const role = isSupportedRole(session?.role) ? normalizeRole(session.role) : null
  const username = String(session?.username || '').trim()

  if (!role || !username) {
    return null
  }

  const workIds = Array.isArray(session?.workIds)
    ? Array.from(
        new Set(
          session.workIds
            .map(workId => parseInt(workId))
            .filter(workId => Number.isInteger(workId)),
        ),
      )
    : []

  const accountType = inferAccountType(session)
  const accessProfile = normalizeAccessProfile(
    session?.accessProfile || resolveAccessProfileForUser({ role, accountType }),
  )
  const permissionKeys = normalizePermissionKeys(session?.permissionKeys)

  return {
    userId: Number(session.userId) || 0,
    personId: Number(session.personId) || 0,
    username,
    name: String(session.name || username).trim(),
    role,
    accountType,
    accessProfileId: Number(session?.accessProfileId) || null,
    accessProfile,
    permissionKeys: permissionKeys.length > 0 ? permissionKeys : [...getAccessProfilePermissionKeys(accessProfile)],
    workIds,
    expiresAt: Number(session.expiresAt) || 0,
  }
}

export async function createSessionToken(session) {
  const normalizedSession = normalizeSession({
    ...session,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  })

  if (!normalizedSession) {
    throw new Error('Sessão inválida')
  }

  const payload = toBase64Url(JSON.stringify(normalizedSession))
  const signature = toBase64Url(await signValue(payload))

  return `${payload}.${signature}`
}

export async function readSessionToken(token) {
  const [payload, signature] = String(token || '').split('.')

  if (!payload || !signature) {
    return null
  }

  const key = await getSigningKey()
  const isValid = await crypto.subtle.verify('HMAC', key, fromBase64Url(signature), encoder.encode(payload))

  if (!isValid) {
    return null
  }

  try {
    const session = normalizeSession(JSON.parse(decoder.decode(fromBase64Url(payload))))

    if (!session || !session.expiresAt || session.expiresAt < Date.now()) {
      return null
    }

    return session
  } catch (error) {
    return null
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  }
}

export function getDefaultPathForRole(role) {
  if (isDeveloperRole(role)) return '/developer'
  return isChefRole(role) ? '/daily-hours' : '/'
}

export function canChefAccessPath(pathname) {
  return (
    pathname === '/daily-hours' ||
    pathname === '/mobile/chef' ||
    pathname === '/mobile/chef/settings' ||
    pathname === '/account-settings' ||
    pathname === '/api/account/password' ||
    pathname === '/api/daily-work-notes' ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/work-assignments' ||
    pathname.startsWith('/api/work-assignments/')
  )
}

export function canManageEntireApp(role) {
  return normalizeRole(role) === 'admin'
}

export function canAccessCalendarManagement(role) {
  return canManageEntireApp(role) || isResponsavelRole(role)
}

export function canAccessPeopleManagement(role) {
  return canManageEntireApp(role) || isResponsavelRole(role)
}

export function canAccessAssignmentsOverview(role) {
  return canManageEntireApp(role) || isResponsavelRole(role)
}

export function canAccessMaterialsManagement(role) {
  return canManageEntireApp(role)
}

export function canDeveloperAccessPath(pathname) {
  return (
    pathname === '/developer' ||
    pathname === '/activity-history' ||
    pathname === '/account-settings' ||
    pathname === '/api/account/password' ||
    pathname.startsWith('/api/developer/') ||
    pathname.startsWith('/api/auth/')
  )
}

export function canApproveHours(role) {
  return canManageEntireApp(role)
}

export function canResponsavelAccessPath(pathname) {
  return (
    pathname === '/' ||
    pathname === '/calendar' ||
    pathname === '/notifications' ||
    pathname === '/people' ||
    pathname.startsWith('/people/') ||
    pathname === '/account-settings' ||
    pathname === '/api/account/password' ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/calendar-events' ||
    pathname === '/api/people' ||
    pathname.startsWith('/api/people/')
  )
}

export function canAccessPath(session, pathname) {
  if (!session) return false
  if (!canRoleSignIn(session.role)) return false
  if (isDeveloperRole(session.role)) return canDeveloperAccessPath(pathname)
  if (isResponsavelRole(session.role)) return canResponsavelAccessPath(pathname)
  if (canManageEntireApp(session.role)) return true
  if (pathname === '/') return false

  return canChefAccessPath(pathname)
}

function hasPermissionPathMapping(pathname) {
  if (pathname === '/') return true
  if (pathname === '/developer' || pathname === '/programador' || pathname.startsWith('/api/developer/')) return true
  if (pathname === '/materials' || pathname === '/api/materials' || pathname.startsWith('/api/materials/')) return true
  if (pathname === '/calendar' || pathname === '/api/calendar-events') return true
  if (pathname === '/notifications') return true
  if (pathname === '/people' || hasPathPrefix(pathname, '/people') || pathname === '/api/people' || pathname.startsWith('/api/people/')) return true
  if (pathname === '/clients' || pathname === '/api/clients' || pathname.startsWith('/api/clients/')) return true
  if (pathname === '/works' || hasPathPrefix(pathname, '/works') || pathname === '/api/works' || pathname.startsWith('/api/works/')) return true
  if (pathname === '/daily-plan' || pathname === '/api/work-plans' || pathname.startsWith('/api/work-plans/')) return true
  if (pathname === '/daily-hours' || pathname === '/work-assignments' || pathname === '/api/work-assignments' || pathname.startsWith('/api/work-assignments/')) return true
  if (pathname === '/hours-approval') return true
  if (pathname === '/mobile/chef' || hasPathPrefix(pathname, '/mobile/chef')) return true
  if (pathname === '/activity-history') return true
  if (pathname === '/account-settings') return true
  if (pathname === '/api/account/password') return true
  if (pathname === '/api/daily-work-notes') return true
  if (pathname === '/api/access-identities') return true

  return false
}

export function shouldUsePermissionPathGuard(session, pathname) {
  return getSessionPermissionKeys(session).length > 0 && hasPermissionPathMapping(pathname)
}

export function canAccessPathByPermission(session, pathname) {
  if (!session) {
    return false
  }

  if (!canRoleSignIn(session.role)) {
    return false
  }

  if (pathname === '/') {
    return sessionHasPermission(session, 'dashboard.read')
  }

  if (pathname === '/developer' || pathname === '/programador' || pathname.startsWith('/api/developer/')) {
    return sessionHasAnyPermission(session, DEVELOPER_PERMISSION_KEYS)
  }

  if (pathname === '/materials' || pathname.startsWith('/api/materials/')) {
    return sessionHasAnyPermission(session, MATERIALS_PERMISSION_KEYS)
  }

  if (pathname === '/api/materials') {
    return sessionHasAnyPermission(session, MATERIALS_PERMISSION_KEYS)
  }

  if (pathname === '/calendar' || pathname === '/api/calendar-events') {
    return sessionHasAnyPermission(session, CALENDAR_PERMISSION_KEYS)
  }

  if (pathname === '/notifications') {
    return sessionHasPermission(session, 'notifications.read')
  }

  if (pathname === '/people' || hasPathPrefix(pathname, '/people') || pathname === '/api/people' || pathname.startsWith('/api/people/')) {
    return sessionHasAnyPermission(session, PEOPLE_PERMISSION_KEYS)
  }

  if (pathname === '/clients' || pathname === '/api/clients' || pathname.startsWith('/api/clients/')) {
    return sessionHasAnyPermission(session, CLIENTS_PERMISSION_KEYS)
  }

  if (pathname === '/works' || hasPathPrefix(pathname, '/works') || pathname === '/api/works' || pathname.startsWith('/api/works/')) {
    return sessionHasAnyPermission(session, WORKS_PERMISSION_KEYS)
  }

  if (pathname === '/daily-plan' || pathname === '/api/work-plans' || pathname.startsWith('/api/work-plans/')) {
    return sessionHasAnyPermission(session, WORK_PLANS_PERMISSION_KEYS)
  }

  if (pathname === '/daily-hours' || pathname === '/work-assignments' || pathname === '/api/work-assignments' || pathname.startsWith('/api/work-assignments/')) {
    return sessionHasAnyPermission(session, WORK_ASSIGNMENTS_PERMISSION_KEYS)
  }

  if (pathname === '/hours-approval') {
    return sessionHasPermission(session, 'work_assignments.approve')
  }

  if (pathname === '/mobile/chef' || hasPathPrefix(pathname, '/mobile/chef')) {
    return sessionHasAnyPermission(session, ['chef.mobile.use', 'work_assignments.approve'])
  }

  if (pathname === '/activity-history') {
    return sessionHasPermission(session, 'activity_history.read_global')
  }

  if (pathname === '/account-settings') {
    return sessionHasPermission(session, 'account.read_self')
  }

  if (pathname === '/api/account/password') {
    return sessionHasPermission(session, 'account.password.change_self')
  }

  if (pathname === '/api/daily-work-notes') {
    return sessionHasAnyPermission(session, DAILY_WORK_NOTES_PERMISSION_KEYS)
  }

  if (pathname === '/api/access-identities') {
    return sessionHasAnyPermission(session, ACCESS_IDENTITIES_PERMISSION_KEYS)
  }

  return false
}
