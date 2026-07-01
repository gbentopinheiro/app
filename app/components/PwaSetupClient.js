'use client'

import { useEffect } from 'react'
import { appendBuildVersion } from '../../lib/pwa-version.js'

const serviceWorkerUrl = appendBuildVersion('/sw.js')

export default function PwaSetupClient() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const hadController = Boolean(navigator.serviceWorker.controller)
    let hasReloadedAfterUpdate = false

    const handleControllerChange = () => {
      if (!hadController || hasReloadedAfterUpdate) {
        return
      }

      hasReloadedAfterUpdate = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    async function registerServiceWorker() {
      try {
        const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
          updateViaCache: 'none',
        })

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing

          if (!installingWorker) {
            return
          }

          installingWorker.addEventListener('statechange', () => {
            if (
              installingWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              installingWorker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })

        await registration.update()
      } catch {}
    }

    registerServiceWorker()

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  return null
}
