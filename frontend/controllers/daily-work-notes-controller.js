import { apiFetchJson } from '../api/api-client.js'

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function fetchDailyWorkNotes(params = {}, options = {}) {
  return apiFetchJson(`/api/daily-work-notes${buildQueryString(params)}`, options)
}

async function requestDailyWorkNotesJson(path, options, fallbackMessage) {
  const { response, data } = await apiFetchJson(path, options)

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage)
  }

  return data
}

export async function saveDailyWorkNote(
  payload,
  fallbackMessage = 'Erro ao guardar nota.',
) {
  return requestDailyWorkNotesJson(
    '/api/daily-work-notes',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fallbackMessage,
  )
}

export async function deleteDailyWorkNotes(
  payload,
  fallbackMessage = 'Não foi possível remover as notificações.',
) {
  return requestDailyWorkNotesJson(
    '/api/daily-work-notes',
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fallbackMessage,
  )
}
