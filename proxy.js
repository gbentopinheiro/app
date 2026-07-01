import { NextResponse } from 'next/server'
import {
  canAccessPath,
  canAccessPathByPermission,
  getDefaultPathForRole,
  getExpiredSessionCookieOptions,
  getUnauthorizedRedirectPath,
  isPublicAppPath,
  readSessionToken,
  SESSION_COOKIE_NAME,
  shouldUsePermissionPathGuard,
} from './lib/auth.js'
import { applyApiCorsHeaders } from './lib/api-cors.js'
import { applyNoCacheHeaders, isPublicAssetPath, shouldApplyNoCache } from './lib/cache-policy.js'
import { isChefRole, isDeveloperRole } from './lib/roles.js'

function isApiPath(pathname) {
  return pathname === '/api' || pathname.startsWith('/api/')
}

function isPublicPath(pathname) {
  return isPublicAppPath(pathname) || isPublicAssetPath(pathname)
}

function isApiPreflightRequest(request) {
  return (
    request.method === 'OPTIONS' &&
    isApiPath(request.nextUrl.pathname) &&
    Boolean(request.headers.get('origin')) &&
    Boolean(request.headers.get('access-control-request-method'))
  )
}

function withApiCors(request, response) {
  if (!isApiPath(request.nextUrl.pathname)) {
    return response
  }

  applyApiCorsHeaders(response, {
    origin: request.headers.get('origin'),
    requestHeaders: request.headers.get('access-control-request-headers'),
  })

  return response
}

function finalizeResponse(request, response) {
  if (shouldApplyNoCache(request.nextUrl.pathname)) {
    applyNoCacheHeaders(response)
  }

  return withApiCors(request, response)
}

function buildApiPreflightResponse(request) {
  const response = new NextResponse(null, { status: 204 })
  const isAllowedOrigin = applyApiCorsHeaders(response, {
    origin: request.headers.get('origin'),
    requestHeaders: request.headers.get('access-control-request-headers'),
  })

  return isAllowedOrigin ? response : new NextResponse(null, { status: 403 })
}

function redirectToHttpsInProduction(request) {
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const protocol = forwardedProtocol || request.nextUrl.protocol.replace(':', '')

  if (protocol === 'https') {
    return null
  }

  const secureUrl = request.nextUrl.clone()
  secureUrl.protocol = 'https:'
  return NextResponse.redirect(secureUrl, 308)
}

function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE_NAME, '', getExpiredSessionCookieOptions())

  return response
}

function buildUnauthorizedResponse(request, isInvalidSession = false) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    return isInvalidSession ? clearSessionCookie(response) : response
  }

  const loginRedirectPath = getUnauthorizedRedirectPath(
    request.nextUrl.pathname,
    request.nextUrl.search,
  )
  const loginUrl = new URL(loginRedirectPath, request.url)
  const response = NextResponse.redirect(loginUrl)
  return isInvalidSession ? clearSessionCookie(response) : response
}

function buildForbiddenResponse(request, session) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Sem permissao para aceder a este recurso.' }, { status: 403 })
  }

  return NextResponse.redirect(new URL(getDefaultPathForRole(session.role), request.url))
}

export async function proxy(request) {
  const httpsRedirect = redirectToHttpsInProduction(request)

  if (httpsRedirect) {
    return finalizeResponse(request, httpsRedirect)
  }

  if (isApiPreflightRequest(request)) {
    return buildApiPreflightResponse(request)
  }

  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const session = token ? await readSessionToken(token) : null

    if (pathname === '/login' && session) {
      return finalizeResponse(
        request,
        NextResponse.redirect(new URL(getDefaultPathForRole(session.role), request.url)),
      )
    }

    return finalizeResponse(request, NextResponse.next())
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return finalizeResponse(request, buildUnauthorizedResponse(request))
  }

  const session = await readSessionToken(token)

  if (!session) {
    return finalizeResponse(request, buildUnauthorizedResponse(request, true))
  }

  if (isChefRole(session.role) && pathname === '/') {
    return finalizeResponse(request, NextResponse.redirect(new URL('/daily-hours', request.url)))
  }

  if (isDeveloperRole(session.role) && pathname === '/') {
    return finalizeResponse(request, NextResponse.redirect(new URL('/developer', request.url)))
  }

  const hasAccess = shouldUsePermissionPathGuard(session, pathname)
    ? canAccessPathByPermission(session, pathname)
    : canAccessPath(session, pathname)

  if (!hasAccess) {
    return finalizeResponse(request, buildForbiddenResponse(request, session))
  }

  return finalizeResponse(request, NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
