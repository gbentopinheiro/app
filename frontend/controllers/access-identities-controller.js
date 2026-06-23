import { apiFetchJson } from '../api/api-client.js'

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== undefined && item !== null && item !== '') {
          searchParams.append(key, String(item))
        }
      })
      return
    }

    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

async function requestAccessIdentitiesJson(path, options, fallbackMessage) {
  const { response, data } = await apiFetchJson(path, options)

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage)
  }

  return data
}

export async function listAccessIdentities(
  params = {},
  fallbackMessage = 'Erro ao carregar acessos',
) {
  return requestAccessIdentitiesJson(
    `/api/access-identities${buildQueryString(params)}`,
    undefined,
    fallbackMessage,
  )
}
