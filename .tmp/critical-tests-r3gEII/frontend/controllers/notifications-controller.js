import { deleteDailyWorkNotes } from './daily-work-notes-controller.js'

export async function deleteNotifications(
  ids,
  fallbackMessage = 'Não foi possível remover as notificações.',
) {
  return deleteDailyWorkNotes({ ids }, fallbackMessage)
}
