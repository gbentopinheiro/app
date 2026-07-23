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

async function requestWorkPlansJson(path, options, fallbackMessage) {
  const { response, data } = await apiFetchJson(path, options)

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage)
  }

  return data
}

export async function listWorkPlans(params = {}, fallbackMessage = 'Erro ao carregar planos diarios') {
  return requestWorkPlansJson(
    `/api/work-plans${buildQueryString(params)}`,
    undefined,
    fallbackMessage,
  )
}

export async function getWorkPlan(workPlanId, fallbackMessage = 'Erro ao carregar plano diario') {
  return requestWorkPlansJson(`/api/work-plans/${workPlanId}`, undefined, fallbackMessage)
}

export async function saveWorkPlan(workPlanId, payload, fallbackMessage = 'Erro ao gravar plano diario') {
  const hasWorkPlanId = workPlanId !== null && workPlanId !== undefined && workPlanId !== ''
  const path = hasWorkPlanId ? `/api/work-plans/${workPlanId}` : '/api/work-plans'
  const method = hasWorkPlanId ? 'PUT' : 'POST'

  return requestWorkPlansJson(
    path,
    {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    fallbackMessage,
  )
}

export async function deleteWorkPlan(workPlanId, fallbackMessage = 'Erro ao eliminar plano diario') {
  return requestWorkPlansJson(
    `/api/work-plans/${workPlanId}`,
    { method: 'DELETE' },
    fallbackMessage,
  )
}
