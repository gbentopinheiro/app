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

async function requestWorkAssignmentsJson(path, options, fallbackMessage) {
  const { response, data } = await apiFetchJson(path, options)

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage)
  }

  return data
}

export async function listWorkAssignments(
  params = {},
  fallbackMessage = 'Erro ao carregar afetacoes',
) {
  return requestWorkAssignmentsJson(
    `/api/work-assignments${buildQueryString(params)}`,
    undefined,
    fallbackMessage,
  )
}

export async function getWorkAssignment(
  assignmentId,
  fallbackMessage = 'Erro ao carregar afetacao',
) {
  return requestWorkAssignmentsJson(
    `/api/work-assignments/${assignmentId}`,
    undefined,
    fallbackMessage,
  )
}

export async function saveWorkAssignment(
  assignmentId,
  payload,
  fallbackMessage = 'Erro ao gravar afetacao',
) {
  const hasAssignmentId = assignmentId !== null && assignmentId !== undefined && assignmentId !== ''
  const path = hasAssignmentId ? `/api/work-assignments/${assignmentId}` : '/api/work-assignments'
  const method = hasAssignmentId ? 'PUT' : 'POST'

  return requestWorkAssignmentsJson(
    path,
    {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fallbackMessage,
  )
}

export async function deleteWorkAssignment(
  assignmentId,
  fallbackMessage = 'Erro ao eliminar afetacao',
) {
  return requestWorkAssignmentsJson(
    `/api/work-assignments/${assignmentId}`,
    { method: 'DELETE' },
    fallbackMessage,
  )
}

export async function submitWorkAssignment(
  assignmentId,
  payload,
  fallbackMessage = 'Erro ao submeter horas',
) {
  const hasPayload = payload !== undefined

  return requestWorkAssignmentsJson(
    `/api/work-assignments/${assignmentId}/submit`,
    {
      method: 'PATCH',
      ...(hasPayload
        ? {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        : {}),
    },
    fallbackMessage,
  )
}

export async function approveWorkAssignment(
  assignmentId,
  payload,
  fallbackMessage = 'Erro ao aprovar horas',
) {
  return requestWorkAssignmentsJson(
    `/api/work-assignments/${assignmentId}/approve`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fallbackMessage,
  )
}
