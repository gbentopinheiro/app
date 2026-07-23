export function getSafeRedirectPath(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue || !normalizedValue.startsWith('/') || normalizedValue.startsWith('//')) {
    return null
  }

  if (normalizedValue.includes('\\')) {
    return null
  }

  try {
    const url = new URL(normalizedValue, 'https://bentix.local')

    if (url.origin !== 'https://bentix.local') {
      return null
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function buildLoginRedirectPath(redirectTo, loginPath = '/login') {
  const safeRedirectTo = getSafeRedirectPath(redirectTo)
  const safeLoginPath = getSafeRedirectPath(loginPath) || '/login'

  if (!safeRedirectTo) {
    return safeLoginPath
  }

  return `${safeLoginPath}?redirectTo=${encodeURIComponent(safeRedirectTo)}`
}
