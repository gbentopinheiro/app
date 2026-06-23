import { apiFetchJson } from '../api/api-client.js'

async function requestAccountJson(path, options, fallbackMessage) {
  const { response, data } = await apiFetchJson(path, options)

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage)
  }

  return data
}

export async function changePassword(
  protectedPayload,
  fallbackMessage = 'Não foi possível atualizar a palavra-passe.',
) {
  return requestAccountJson(
    '/api/account/password',
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ protectedPayload }),
    },
    fallbackMessage,
  )
}
