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

export async function getAuthSession(fallbackMessage = 'Erro ao carregar a sessão') {
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
  fallbackMessage = 'Não foi possível iniciar sessão.',
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

export async function logoutUser() {
  return apiFetchJson('/api/auth/logout', {
    method: 'POST',
  })
}
