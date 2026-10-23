'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addNotificationDismissals,
  filterDismissedNotifications,
  getNotificationDismissalStorageKey,
  readNotificationDismissals,
} from '../../lib/operation-notification-state.js'
import { notifyOperationNotificationsChanged, useOperationNotificationsRefresh } from './use-operation-notifications-refresh.js'

// Matches the bell's existing per-user browser state. Keep this visit usable
// when browser persistence is unavailable, without creating server records.
const sessionDismissals = new Map()

function readDismissals(key) {
  let stored = {}
  try { stored = readNotificationDismissals(window.localStorage, key) } catch { /* Storage may be blocked. */ }
  return { ...stored, ...sessionDismissals.get(key) }
}

export function useOperationNotificationState(initialNotifications, username, { enabled = true, limit } = {}) {
  const key = getNotificationDismissalStorageKey(username)
  const [state, setState] = useState({ key: null, dismissed: {} })
  const load = useCallback(() => setState({ key, dismissed: readDismissals(key) }), [key])
  useOperationNotificationsRefresh(enabled, load)

  useEffect(() => {
    load()
    const onStorage = event => {
      if (event.key === key || event.key === null) load()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key, load])

  const ready = state.key === key
  const notifications = useMemo(() => {
    if (!ready) return []
    const visible = filterDismissedNotifications(initialNotifications, state.dismissed)
    return typeof limit === 'number' ? visible.slice(0, limit) : visible
  }, [initialNotifications, limit, ready, state.dismissed])

  const dismissNotifications = useCallback(items => {
    const dismissed = addNotificationDismissals(readDismissals(key), items)
    try {
      window.localStorage.setItem(key, JSON.stringify(dismissed))
      sessionDismissals.delete(key)
    } catch {
      sessionDismissals.set(key, dismissed)
    }
    setState({ key, dismissed })
    notifyOperationNotificationsChanged()
  }, [key])

  return { notifications, dismissNotifications, ready }
}
