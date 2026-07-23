import { apiFetchJson } from '../api/api-client.js'

async function requestPeopleJson(path, options, fallbackMessage) {
  const { response, data } = await apiFetchJson(path, options)

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage)
  }

  return data
}

export async function listPeople(fallbackMessage = 'Erro ao carregar pessoas') {
  return requestPeopleJson('/api/people', undefined, fallbackMessage)
}

export async function savePerson(personId, body, fallbackMessage = 'Erro ao gravar pessoa') {
  const hasPersonId = personId !== null && personId !== undefined && personId !== ''
  const path = hasPersonId ? `/api/people/${personId}` : '/api/people'
  const method = hasPersonId ? 'PUT' : 'POST'

  return requestPeopleJson(
    path,
    {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    fallbackMessage,
  )
}

export async function deletePerson(personId, fallbackMessage = 'Erro ao eliminar pessoa') {
  return requestPeopleJson(
    `/api/people/${personId}`,
    { method: 'DELETE' },
    fallbackMessage,
  )
}

export async function createPersonDocument(
  personId,
  payload,
  fallbackMessage = 'Nao foi possivel guardar o documento.',
) {
  return requestPeopleJson(
    `/api/people/${personId}/documents`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fallbackMessage,
  )
}

export async function deletePersonDocument(
  personId,
  documentId,
  fallbackMessage = 'Nao foi possivel remover o documento.',
) {
  return requestPeopleJson(
    `/api/people/${personId}/documents/${documentId}`,
    { method: 'DELETE' },
    fallbackMessage,
  )
}
