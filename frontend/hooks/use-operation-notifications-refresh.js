'use client'

import { useEffect } from 'react'

const planningChangedEvent = 'bentix:planning-updated'

export function notifyOperationNotificationsChanged(kind = 'refresh') {
  window.dispatchEvent(new CustomEvent(planningChangedEvent, { detail: kind }))
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(planningChangedEvent)
    channel.postMessage(kind)
    channel.close()
  }
}

// One subscription per notification provider, shared by every consumer on the page.
export function subscribeOperationNotificationsRefresh({
  onChange, onDismiss, targetWindow = window, targetDocument = document,
  Channel = globalThis.BroadcastChannel,
}) {
  const refresh = () => {
    if (targetDocument.visibilityState === 'visible') onChange()
  }
  const changed = kind => kind === 'dismiss' ? onDismiss?.() : refresh()
  const localChanged = event => changed(event.detail)
  const channel = typeof Channel === 'function' ? new Channel(planningChangedEvent) : null
  if (channel) channel.onmessage = event => changed(event.data)
  targetWindow.addEventListener(planningChangedEvent, localChanged)
  targetWindow.addEventListener('focus', refresh)
  targetDocument.addEventListener('visibilitychange', refresh)
  const interval = targetWindow.setInterval(refresh, 30000)
  return () => {
    channel?.close()
    targetWindow.removeEventListener(planningChangedEvent, localChanged)
    targetWindow.removeEventListener('focus', refresh)
    targetDocument.removeEventListener('visibilitychange', refresh)
    targetWindow.clearInterval(interval)
  }
}

export function useOperationNotificationsRefresh(enabled = true, onChange, onDismiss) {
  useEffect(() => {
    if (!enabled) return
    return subscribeOperationNotificationsRefresh({ onChange, onDismiss })
  }, [enabled, onChange, onDismiss])
}
