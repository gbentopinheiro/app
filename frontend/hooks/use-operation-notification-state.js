'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  addNotificationDismissals,
  filterDismissedNotifications,
  getNotificationDismissalStorageKey,
  readNotificationDismissals,
  toCompactOperationNotifications,
} from '../../lib/operation-notification-state.js'
import { createNotificationsRefresh, listNotifications } from '../controllers/notifications-controller.js'
import { notifyOperationNotificationsChanged, useOperationNotificationsRefresh } from './use-operation-notifications-refresh.js'

// Matches the bell's existing per-user browser state. Keep this visit usable
// when browser persistence is unavailable, without creating server records.
const sessionDismissals = new Map()
const NotificationContext = createContext(null)

function readDismissals(key) {
  let stored = {}
  try { stored = readNotificationDismissals(window.localStorage, key) } catch { /* Storage may be blocked. */ }
  return { ...stored, ...sessionDismissals.get(key) }
}

export function OperationNotificationsProvider({ initialNotifications, username, enabled = true, children }) {
  const key = getNotificationDismissalStorageKey(username)
  const [state, setState] = useState({ key: null, dismissed: {} })
  const [snapshot, setSnapshot] = useState(initialNotifications)
  const load = useCallback(() => setState({ key, dismissed: readDismissals(key) }), [key])
  const refresher = useMemo(() => createNotificationsRefresh(listNotifications, data => {
    setSnapshot(current => JSON.stringify(current) === JSON.stringify(data) ? current : data)
  }, error => {
    if (error.status === 401) window.location.assign('/login')
    if (error.status === 403 || error.status === 503) setSnapshot([])
  }), [key])
  useOperationNotificationsRefresh(enabled, refresher.refresh, load)

  useEffect(() => {
    refresher.cancel()
    setSnapshot(initialNotifications)
  }, [initialNotifications, refresher])
  useEffect(() => () => refresher.cancel(), [refresher, enabled])

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
    return filterDismissedNotifications(snapshot, state.dismissed)
  }, [snapshot, ready, state.dismissed])

  const dismissNotifications = useCallback(items => {
    const dismissed = addNotificationDismissals(readDismissals(key), items)
    try {
      window.localStorage.setItem(key, JSON.stringify(dismissed))
      sessionDismissals.delete(key)
    } catch {
      sessionDismissals.set(key, dismissed)
    }
    setState({ key, dismissed })
    notifyOperationNotificationsChanged('dismiss')
  }, [key])

  const value = useMemo(() => ({ notifications, dismissNotifications, ready }), [notifications, dismissNotifications, ready])
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useOperationNotificationState({ enabled = true, limit, compact = false } = {}) {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('Notification provider is required.')
  const notifications = useMemo(() => {
    const items = enabled ? context.notifications : []
    const visible = typeof limit === 'number' ? items.slice(0, limit) : items
    return compact ? toCompactOperationNotifications(visible) : visible
  }, [context.notifications, enabled, limit, compact])
  return { ...context, notifications }
}
