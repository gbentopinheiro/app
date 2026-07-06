import { apiFetchJson } from '../api/api-client.js'

async function requestWorkExtraAccessJson(path, options, fallbackMessage) {
  const { response, data } = await apiFetchJson(path, options)

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage)
  }

  return data
}

export async function saveWorkExtraAccessSelections(
  payload,
  fallbackMessage = 'Erro ao guardar acessos extra as obras',
) {
  return requestWorkExtraAccessJson(
    '/api/work-extra-access-grants',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fallbackMessage,
  )
}
