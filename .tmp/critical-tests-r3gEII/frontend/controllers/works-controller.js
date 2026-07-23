import { apiFetchJson } from '../api/api-client.js'

async function requestWorksJson(path, options, fallbackMessage) {
  const { response, data } = await apiFetchJson(path, options)

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage)
  }

  return data
}

export async function listWorks(fallbackMessage = 'Erro ao carregar obras') {
  return requestWorksJson('/api/works', undefined, fallbackMessage)
}

export async function getWork(workId, fallbackMessage = 'Erro ao carregar obra') {
  return requestWorksJson(`/api/works/${workId}`, undefined, fallbackMessage)
}

export async function saveWork(workId, payload, fallbackMessage = 'Erro ao gravar obra') {
  const hasWorkId = workId !== null && workId !== undefined && workId !== ''
  const path = hasWorkId ? `/api/works/${workId}` : '/api/works'
  const method = hasWorkId ? 'PUT' : 'POST'

  return requestWorksJson(
    path,
    {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fallbackMessage,
  )
}

export async function deleteWork(workId, fallbackMessage = 'Erro ao eliminar obra') {
  return requestWorksJson(
    `/api/works/${workId}`,
    { method: 'DELETE' },
    fallbackMessage,
  )
}
