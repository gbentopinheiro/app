export function getNotificationDismissalStorageKey(username) {
  return `bentix:notifications:dismissed:v1:${String(username || '').trim().toLowerCase()}`
}

export function getNotificationVersion(notification) {
  return notification.version ?? String(Number.isFinite(notification.sortTimestamp) ? notification.sortTimestamp : 0)
}

export function canRemoveNotification(notification) {
  return notification.deletable === true || notification.dismissible === true
}

export function filterDismissedNotifications(notifications, dismissed = {}) {
  return notifications.filter(notification => dismissed[notification.id] !== getNotificationVersion(notification))
}

export function addNotificationDismissals(dismissed, notifications) {
  return {
    ...dismissed,
    ...Object.fromEntries(notifications.filter(canRemoveNotification)
      .map(notification => [notification.id, getNotificationVersion(notification)])),
  }
}

export function readNotificationDismissals(storage, key) {
  try {
    const saved = JSON.parse(storage.getItem(key) || '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
    return Object.fromEntries(Object.entries(saved).filter(([, version]) => typeof version === 'string'))
  } catch {
    return {}
  }
}

// Only daily notes have a deletion endpoint. Dynamic alerts must never be sent
// to it as prefixed IDs (or removed from their underlying planning records).
export function getNotificationDeleteSourceIds(notifications) {
  return [...new Set(notifications.filter(notification => notification.sourceType === 'daily-note' && notification.deletable)
    .map(notification => {
      const id = Number(notification.sourceId)
      if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Identificador da notificação inválido.')
      return id
    }))]
}
