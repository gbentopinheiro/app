const NO_CACHE_HEADERS = Object.freeze({
  'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
})

function appendVaryValue(currentValue, nextValue) {
  const currentValues = String(currentValue || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  if (!currentValues.includes(nextValue)) {
    currentValues.push(nextValue)
  }

  return currentValues.join(', ')
}

export function getNoCacheHeaders() {
  return { ...NO_CACHE_HEADERS }
}

export function applyNoCacheHeaders(response) {
  Object.entries(NO_CACHE_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  response.headers.set('Vary', appendVaryValue(response.headers.get('Vary'), 'Cookie'))

  return response
}

export function isPublicAssetPath(pathname) {
  return (
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname === '/icon.svg' ||
    pathname.startsWith('/icons/')
  )
}

export function shouldApplyNoCache(pathname) {
  if (isPublicAssetPath(pathname)) {
    return true
  }

  return !(
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/')
  )
}
