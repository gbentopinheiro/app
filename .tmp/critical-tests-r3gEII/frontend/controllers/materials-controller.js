import { apiFetchJson } from '../api/api-client.js'

async function requestMaterialsJson(path, options, fallbackMessage) {
  const { response, data } = await apiFetchJson(path, options)

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage)
  }

  return data
}

export async function listMaterials(fallbackMessage = 'Erro ao carregar materiais.') {
  return requestMaterialsJson('/api/materials', undefined, fallbackMessage)
}

export async function getMaterial(materialId, fallbackMessage = 'Erro ao carregar material.') {
  return requestMaterialsJson(`/api/materials/${materialId}`, undefined, fallbackMessage)
}

export async function saveMaterial(materialId, payload, fallbackMessage = 'Erro ao gravar material.') {
  const hasMaterialId = materialId !== null && materialId !== undefined && materialId !== ''
  const path = hasMaterialId ? `/api/materials/${materialId}` : '/api/materials'
  const method = hasMaterialId ? 'PUT' : 'POST'

  return requestMaterialsJson(
    path,
    {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fallbackMessage,
  )
}

export async function deleteMaterial(materialId, fallbackMessage = 'Erro ao remover material.') {
  return requestMaterialsJson(
    `/api/materials/${materialId}`,
    { method: 'DELETE' },
    fallbackMessage,
  )
}
