import { PWA_BUILD_VERSION, appendBuildVersion } from './pwa-version.js'

export const PWA_RELOAD_GUARD_PREFIX = 'bentix:pwa:reload:'

const PWA_BOOTSTRAP_STATE_KEY = '__bentixPwaBootstrapState'
const LOCAL_PWA_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1'])

export function getPwaReloadGuardKey(buildVersion = PWA_BUILD_VERSION) {
  const normalizedBuildVersion = String(buildVersion || PWA_BUILD_VERSION).trim() || 'unknown'
  return `${PWA_RELOAD_GUARD_PREFIX}${normalizedBuildVersion}`
}

export function shouldEnablePwaBootstrap({
  hostname = typeof window !== 'undefined' ? window.location.hostname : '',
  nodeEnv = process.env.NODE_ENV,
} = {}) {
  const normalizedHostname = String(hostname || '').trim().toLowerCase()
  const normalizedNodeEnv = String(nodeEnv || '').trim().toLowerCase()

  if (normalizedNodeEnv !== 'production') {
    return false
  }

  return !LOCAL_PWA_HOSTNAMES.has(normalizedHostname)
}

function getBootstrapState() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!window[PWA_BOOTSTRAP_STATE_KEY]) {
    window[PWA_BOOTSTRAP_STATE_KEY] = {
      initialized: false,
      fingerprint: '',
      controllerChangeHandler: null,
    }
  }

  return window[PWA_BOOTSTRAP_STATE_KEY]
}

function pruneOldReloadGuards(reloadGuardKey) {
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const storageKey = sessionStorage.key(index)

      if (
        storageKey &&
        storageKey.indexOf(PWA_RELOAD_GUARD_PREFIX) === 0 &&
        storageKey !== reloadGuardKey
      ) {
        sessionStorage.removeItem(storageKey)
      }
    }
  } catch {
    // Ignore browsers that block sessionStorage access in this context.
  }
}

function shouldSkipReload(reloadGuardKey) {
  try {
    if (sessionStorage.getItem(reloadGuardKey) === '1') {
      return true
    }

    sessionStorage.setItem(reloadGuardKey, '1')
    return false
  } catch {
    if (window.__bentixPwaReloadGuard === reloadGuardKey) {
      return true
    }

    window.__bentixPwaReloadGuard = reloadGuardKey
    return false
  }
}

function requestSkipWaiting(worker) {
  if (!worker) {
    return
  }

  try {
    worker.postMessage({ type: 'SKIP_WAITING' })
  } catch {
    // Ignore transient worker messaging failures.
  }
}

function watchInstallingWorker(worker) {
  if (!worker) {
    return
  }

  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      requestSkipWaiting(worker)
    }
  })
}

export function bootstrapPwa({
  buildVersion = PWA_BUILD_VERSION,
  serviceWorkerPath = '/sw.js',
} = {}) {
  if (
    typeof window === 'undefined' ||
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return false
  }

  const bootstrapState = getBootstrapState()

  if (!shouldEnablePwaBootstrap()) {
    if (bootstrapState?.controllerChangeHandler) {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        bootstrapState.controllerChangeHandler,
      )
    }

    if (bootstrapState) {
      bootstrapState.initialized = false
      bootstrapState.fingerprint = ''
      bootstrapState.controllerChangeHandler = null
    }

    navigator.serviceWorker
      .getRegistrations()
      .then(registrations =>
        Promise.all(registrations.map(registration => registration.unregister())),
      )
      .catch(() => {})

    return false
  }

  const serviceWorkerUrl = appendBuildVersion(serviceWorkerPath, buildVersion)
  const reloadGuardKey = getPwaReloadGuardKey(buildVersion)
  const fingerprint = `${serviceWorkerUrl}::${reloadGuardKey}`

  if (!bootstrapState) {
    return false
  }

  if (bootstrapState.initialized && bootstrapState.fingerprint === fingerprint) {
    return false
  }

  if (bootstrapState.controllerChangeHandler) {
    navigator.serviceWorker.removeEventListener(
      'controllerchange',
      bootstrapState.controllerChangeHandler,
    )
  }

  let hasRequestedReload = false

  const reloadOnce = () => {
    if (hasRequestedReload || shouldSkipReload(reloadGuardKey)) {
      return
    }

    hasRequestedReload = true
    window.location.reload()
  }

  pruneOldReloadGuards(reloadGuardKey)
  navigator.serviceWorker.addEventListener('controllerchange', reloadOnce)

  bootstrapState.initialized = true
  bootstrapState.fingerprint = fingerprint
  bootstrapState.controllerChangeHandler = reloadOnce

  navigator.serviceWorker
    .register(serviceWorkerUrl, {
      scope: '/',
      updateViaCache: 'none',
    })
    .then(registration => {
      if (registration.waiting) {
        requestSkipWaiting(registration.waiting)
      }

      if (registration.installing) {
        watchInstallingWorker(registration.installing)
      }

      registration.addEventListener('updatefound', () => {
        watchInstallingWorker(registration.installing)
      })

      return registration.update().catch(() => {})
    })
    .catch(() => {})

  return true
}
