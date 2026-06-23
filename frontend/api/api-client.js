const configuredApiBaseUrl = String(process.env.NEXT_PUBLIC_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '')

export function resolveApiUrl(path) {
  const rawPath = String(path || '').trim()

  if (!rawPath) {
    throw new Error('API path is required.')
  }

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath
  }

  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  return configuredApiBaseUrl ? `${configuredApiBaseUrl}${normalizedPath}` : normalizedPath
}

export async function apiFetch(path, options = {}) {
  const { credentials, ...restOptions } = options || {}

  return fetch(resolveApiUrl(path), {
    credentials: credentials ?? 'include',
    ...restOptions,
  })
}

export async function apiFetchJson(path, options = {}) {
  const response = await apiFetch(path, options)
  const data = await response.json().catch(() => ({}))

  return {
    response,
    data,
  }
}
