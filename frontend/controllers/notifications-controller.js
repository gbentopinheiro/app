import { deleteDailyWorkNotes } from './daily-work-notes-controller.js'
import { apiFetchJson } from '../api/api-client.js'

export async function listNotifications({ signal } = {}) {
  const { response, data } = await apiFetchJson('/api/notifications', { signal, cache: 'no-store' })
  if (!response.ok) {
    const error = new Error(data.error || 'Erro ao carregar notificações.')
    error.status = response.status
    throw error
  }
  return data
}

// Focus, visibility and planning events can arrive together. Share their request,
// and discard replies after unmount or a change of authenticated user.
export function createNotificationsRefresh(load, onSuccess, onError = () => {}) {
  let current = null
  return {
    refresh() {
      if (current) return current.promise
      const request = { controller: new AbortController() }
      current = request
      request.promise = Promise.resolve().then(() => load({ signal: request.controller.signal }))
        .then(data => { if (!request.controller.signal.aborted) onSuccess(data) })
        .catch(error => { if (!request.controller.signal.aborted) onError(error) })
        .finally(() => { if (current === request) current = null })
      return request.promise
    },
    cancel() {
      current?.controller.abort()
      current = null
    },
  }
}

export async function deleteNotifications(
  ids,
  fallbackMessage = 'Não foi possível remover as notificações.',
) {
  return deleteDailyWorkNotes({ ids }, fallbackMessage)
}
