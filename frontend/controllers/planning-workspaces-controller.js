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

async function requestPlanningJson(path, options, fallbackMessage) {
  const { response, data } = await apiFetchJson(path, options)

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage)
  }

  return data
}

export async function getPlanningWorkspaceView(
  params = {},
  fallbackMessage = 'Erro ao carregar o draft do planeamento',
) {
  return requestPlanningJson(
    `/api/planning-workspaces${buildQueryString(params)}`,
    undefined,
    fallbackMessage,
  )
}

export async function initializePlanningWorkspaceDraft(
  payload,
  fallbackMessage = 'Erro ao preparar o draft do planeamento',
) {
  return requestPlanningJson(
    '/api/planning-workspaces',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fallbackMessage,
  )
}

export async function publishPlanningWorkspace(
  workspaceId,
  fallbackMessage = 'Erro ao publicar o planeamento',
) {
  return requestPlanningJson(
    `/api/planning-workspaces/${workspaceId}/publish`,
    { method: 'POST' },
    fallbackMessage,
  )
}

export async function setPlanningWorkspaceToDraft(
  workspaceId,
  fallbackMessage = 'Erro ao voltar o planeamento para draft',
) {
  return requestPlanningJson(
    `/api/planning-workspaces/${workspaceId}/edit`,
    { method: 'POST' },
    fallbackMessage,
  )
}

export async function savePlanningDraftAssignment(
  assignmentId,
  payload,
  fallbackMessage = 'Erro ao gravar afetacao no draft',
) {
  const hasAssignmentId = assignmentId !== null && assignmentId !== undefined && assignmentId !== ''
  const path = hasAssignmentId
    ? `/api/planning-workspace-assignments/${assignmentId}`
    : '/api/planning-workspace-assignments'
  const method = hasAssignmentId ? 'PUT' : 'POST'

  return requestPlanningJson(
    path,
    {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fallbackMessage,
  )
}

export async function deletePlanningDraftAssignment(
  assignmentId,
  fallbackMessage = 'Erro ao remover afetacao do draft',
) {
  return requestPlanningJson(
    `/api/planning-workspace-assignments/${assignmentId}`,
    { method: 'DELETE' },
    fallbackMessage,
  )
}
