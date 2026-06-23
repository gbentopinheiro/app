import { apiFetchJson } from '../api/api-client.js'

async function requestClientJson(path, options, fallbackMessage) {
  const { response, data } = await apiFetchJson(path, options)

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage)
  }

  return data
}

export async function listClients(fallbackMessage = 'Erro ao carregar clientes') {
  return requestClientJson('/api/clients', undefined, fallbackMessage)
}

export async function saveClient(clientId, payload, fallbackMessage = 'Erro ao gravar cliente') {
  const hasClientId = clientId !== null && clientId !== undefined && clientId !== ''
  const path = hasClientId ? `/api/clients/${clientId}` : '/api/clients'
  const method = hasClientId ? 'PUT' : 'POST'

  return requestClientJson(
    path,
    {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fallbackMessage,
  )
}

export async function deleteClient(clientId, fallbackMessage = 'Erro ao eliminar cliente') {
  return requestClientJson(
    `/api/clients/${clientId}`,
    { method: 'DELETE' },
    fallbackMessage,
  )
}
