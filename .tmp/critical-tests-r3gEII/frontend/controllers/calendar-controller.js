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

async function requestCalendarJson(path, options, fallbackMessage) {
  const { response, data } = await apiFetchJson(path, options)

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage)
  }

  return data
}

export async function listCalendarEvents(
  params = {},
  fallbackMessage = 'Não foi possível carregar o calendário.',
) {
  return requestCalendarJson(
    `/api/calendar-events${buildQueryString(params)}`,
    undefined,
    fallbackMessage,
  )
}

export async function saveCalendarEvent(
  payload,
  method = 'POST',
  fallbackMessage = 'Não foi possível criar o evento.',
) {
  return requestCalendarJson(
    '/api/calendar-events',
    {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fallbackMessage,
  )
}

export async function deleteCalendarEvent(
  payload,
  fallbackMessage = 'Não foi possível remover o evento.',
) {
  return requestCalendarJson(
    '/api/calendar-events',
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fallbackMessage,
  )
}
