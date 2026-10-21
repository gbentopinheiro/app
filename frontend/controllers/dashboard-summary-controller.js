import { apiFetchJson } from '../api/api-client.js'

export async function getDashboardSummary(date, { signal } = {}) {
  const { response, data } = await apiFetchJson(`/api/dashboard/summary?${new URLSearchParams({ date })}`, {
    signal, cache: 'no-store',
  })
  if (!response.ok) throw new Error(data.error || 'Erro ao carregar os indicadores do dashboard.')
  return data
}
