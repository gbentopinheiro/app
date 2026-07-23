import { createProtectedPayload } from '../../lib/browser-protected-payload.js'
import { ROLE_ADMIN, isChefRole, normalizeRole } from '../../lib/roles.js'
import { getSafeRedirectPath } from '../../lib/safe-redirect.js'
import { apiFetchJson } from '../api/api-client.js'

export async function fetchAuthSession(options = {}) {
  return apiFetchJson('/api/auth/session', options)
}

async function requestAuthJson(path, options, fallbackMessage) {
  const { response, data } = await apiFetchJson(path, options)

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage)
  }

  return data
}

export async function getAuthSession(fallbackMessage = 'Erro ao carregar a sessao') {
  return requestAuthJson('/api/auth/session', undefined, fallbackMessage)
}

export async function getAuthPayloadKey(
  fallbackMessage = 'Nao foi possivel proteger os dados sensiveis.',
) {
  return requestAuthJson(
    '/api/auth/payload-key',
    {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    },
    fallbackMessage,
  )
}

export async function loginWithProtectedPayload(
  protectedPayload,
  fallbackMessage = 'Nao foi possivel iniciar sessao.',
) {
  return requestAuthJson(
    '/api/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ protectedPayload }),
    },
    fallbackMessage,
  )
}

export async function loginAndResolveRedirect({
  username,
  password,
  redirectTo = null,
  fallbackRedirect = null,
  fallbackMessage = 'Nao foi possivel iniciar sessao.',
} = {}) {
  const protectedPayload = await createProtectedPayload({
    username,
    password,
  })

  const data = await loginWithProtectedPayload(protectedPayload, fallbackMessage)
  const safeRedirectTo = getSafeRedirectPath(redirectTo)
  const safeFallbackRedirect = getSafeRedirectPath(fallbackRedirect)
  const canUseMobileFallback = normalizeRole(data.role) === ROLE_ADMIN || isChefRole(data.role)

  return {
    ...data,
    redirectTo:
      safeRedirectTo ||
      (canUseMobileFallback && safeFallbackRedirect ? safeFallbackRedirect : data.redirectTo || '/'),
  }
}

export async function logoutUser() {
  return apiFetchJson('/api/auth/logout', {
    method: 'POST',
  })
}
