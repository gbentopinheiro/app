'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const planningChangedEvent = 'bentix:planning-updated'

// Only invalidates existing server-rendered notifications; no notification state is stored here.
export function notifyOperationNotificationsChanged() {
  window.dispatchEvent(new Event(planningChangedEvent))
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(planningChangedEvent)
    channel.postMessage('refresh')
    channel.close()
  }
}

export function useOperationNotificationsRefresh(enabled = true, onChange) {
  const router = useRouter()

  useEffect(() => {
    if (!enabled) return
    const refresh = () => {
      onChange?.()
      if (document.visibilityState === 'visible') router.refresh()
    }
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(planningChangedEvent) : null
    if (channel) channel.onmessage = refresh
    window.addEventListener(planningChangedEvent, refresh)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    const interval = window.setInterval(refresh, 30000)
    return () => {
      channel?.close()
      window.removeEventListener(planningChangedEvent, refresh)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      window.clearInterval(interval)
    }
  }, [enabled, onChange, router])
}
