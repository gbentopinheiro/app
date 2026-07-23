const swUrl = new URL(self.location.href)
const SW_BUILD_VERSION = swUrl.searchParams.get('v') || 'unversioned'
self.__BENTIX_SW_VERSION__ = SW_BUILD_VERSION

function shouldForceNoStore(request) {
  if (request.method !== 'GET') {
    return false
  }

  const requestUrl = new URL(request.url)

  if (requestUrl.origin !== self.location.origin) {
    return false
  }

  if (request.mode === 'navigate') {
    return true
  }

  return (
    requestUrl.pathname === '/sw.js' ||
    requestUrl.pathname === '/manifest.webmanifest' ||
    requestUrl.pathname === '/login' ||
    requestUrl.pathname === '/mobile/login' ||
    requestUrl.pathname.startsWith('/mobile/') ||
    requestUrl.pathname.startsWith('/_next/')
  )
}

function buildNetworkRequest(request) {
  if (!shouldForceNoStore(request)) {
    return request
  }

  return new Request(request, {
    cache: 'no-store',
  })
}

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting())
  }
})

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map(cacheKey => caches.delete(cacheKey)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(fetch(buildNetworkRequest(event.request)))
})
