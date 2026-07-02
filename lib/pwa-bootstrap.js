import { PWA_BUILD_VERSION, appendBuildVersion } from './pwa-version.js'

export const PWA_RELOAD_GUARD_PREFIX = 'bentix:pwa:reload:'

export function getPwaReloadGuardKey(buildVersion = PWA_BUILD_VERSION) {
  const normalizedBuildVersion = String(buildVersion || PWA_BUILD_VERSION).trim() || 'unknown'
  return `${PWA_RELOAD_GUARD_PREFIX}${normalizedBuildVersion}`
}

export function buildPwaBootstrapScript({
  buildVersion = PWA_BUILD_VERSION,
  serviceWorkerPath = '/sw.js',
} = {}) {
  const serviceWorkerUrl = appendBuildVersion(serviceWorkerPath, buildVersion)
  const reloadGuardKey = getPwaReloadGuardKey(buildVersion)

  return `
    (function () {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
      }

      var serviceWorkerUrl = ${JSON.stringify(serviceWorkerUrl)};
      var reloadGuardKey = ${JSON.stringify(reloadGuardKey)};
      var reloadGuardPrefix = ${JSON.stringify(PWA_RELOAD_GUARD_PREFIX)};
      var hasRequestedReload = false;

      function pruneOldReloadGuards() {
        try {
          for (var index = sessionStorage.length - 1; index >= 0; index -= 1) {
            var storageKey = sessionStorage.key(index);

            if (storageKey && storageKey.indexOf(reloadGuardPrefix) === 0 && storageKey !== reloadGuardKey) {
              sessionStorage.removeItem(storageKey);
            }
          }
        } catch (error) {}
      }

      function shouldSkipReload() {
        if (hasRequestedReload) {
          return true;
        }

        try {
          if (sessionStorage.getItem(reloadGuardKey) === '1') {
            return true;
          }

          sessionStorage.setItem(reloadGuardKey, '1');
          return false;
        } catch (error) {
          if (window.__bentixPwaReloadGuard === reloadGuardKey) {
            return true;
          }

          window.__bentixPwaReloadGuard = reloadGuardKey;
          return false;
        }
      }

      function reloadOnce() {
        if (shouldSkipReload()) {
          return;
        }

        hasRequestedReload = true;
        window.location.reload();
      }

      function requestSkipWaiting(worker) {
        if (!worker) {
          return;
        }

        try {
          worker.postMessage({ type: 'SKIP_WAITING' });
        } catch (error) {}
      }

      function watchInstallingWorker(worker) {
        if (!worker) {
          return;
        }

        worker.addEventListener('statechange', function () {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            requestSkipWaiting(worker);
          }
        });
      }

      pruneOldReloadGuards();
      navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);

      navigator.serviceWorker
        .register(serviceWorkerUrl, {
          scope: '/',
          updateViaCache: 'none',
        })
        .then(function (registration) {
          if (registration.waiting) {
            requestSkipWaiting(registration.waiting);
          }

          if (registration.installing) {
            watchInstallingWorker(registration.installing);
          }

          registration.addEventListener('updatefound', function () {
            watchInstallingWorker(registration.installing);
          });

          return registration.update().catch(function () {});
        })
        .catch(function () {});
    })();
  `
}
