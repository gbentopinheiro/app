import { inferAccountType } from './account-types.js'
import { canRoleSignIn, isChefRole, isDeveloperRole, isResponsavelRole, isSupportedRole, normalizeRole } from './roles.js'

export const SESSION_COOKIE_NAME = 'bentix_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12

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

  return {
    userId: Number(session.userId) || 0,
    personId: Number(session.personId) || 0,
    username,
    name: String(session.name || username).trim(),
    role,
    accountType: inferAccountType(session),
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
