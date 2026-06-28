const DEFAULT_ALLOWED_API_CORS_ORIGINS = Object.freeze([
  'https://test.bentixapp.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
])

const DEFAULT_ALLOWED_API_CORS_HEADERS = 'Accept, Authorization, Content-Type'

export const API_CORS_ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'

function normalizeOrigin(origin) {
  return String(origin || '')
    .trim()
    .replace(/\/+$/, '')
}

function appendVaryValue(existingValue, newValue) {
  const values = String(existingValue || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  if (!values.includes(newValue)) {
    values.push(newValue)
  }

  return values.join(', ')
}

export function resolveAllowedApiCorsOrigins(rawValue = process.env.CORS_ALLOWED_ORIGINS) {
  const configuredOrigins = String(rawValue || '').trim()

  if (!configuredOrigins) {
    return [...DEFAULT_ALLOWED_API_CORS_ORIGINS]
  }

  return Array.from(
    new Set(
      configuredOrigins
        .split(',')
        .map(origin => normalizeOrigin(origin))
        .filter(Boolean),
    ),
  )
}

export function resolveApiCorsOrigin(origin, rawAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS) {
  const normalizedOrigin = normalizeOrigin(origin)

  if (!normalizedOrigin) {
    return null
  }

  return resolveAllowedApiCorsOrigins(rawAllowedOrigins).includes(normalizedOrigin)
    ? normalizedOrigin
    : null
}

export function resolveApiCorsAllowedHeaders(requestHeaders) {
  const normalizedHeaders = String(requestHeaders || '')
    .split(',')
    .map(header => header.trim())
    .filter(Boolean)

  return normalizedHeaders.length > 0
    ? Array.from(new Set(normalizedHeaders)).join(', ')
    : DEFAULT_ALLOWED_API_CORS_HEADERS
}

export function applyApiCorsHeaders(
  response,
  {
    origin,
    requestHeaders,
    rawAllowedOrigins,
  } = {},
) {
  const allowedOrigin = resolveApiCorsOrigin(origin, rawAllowedOrigins)

  if (!allowedOrigin) {
    return false
  }

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', API_CORS_ALLOWED_METHODS)
  response.headers.set(
    'Access-Control-Allow-Headers',
    resolveApiCorsAllowedHeaders(requestHeaders),
  )
  response.headers.set('Access-Control-Max-Age', '86400')
  response.headers.set('Vary', appendVaryValue(response.headers.get('Vary'), 'Origin'))
  response.headers.set(
    'Vary',
    appendVaryValue(response.headers.get('Vary'), 'Access-Control-Request-Method'),
  )
  response.headers.set(
    'Vary',
    appendVaryValue(response.headers.get('Vary'), 'Access-Control-Request-Headers'),
  )

  return true
}
