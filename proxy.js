import { NextResponse } from 'next/server'
import { canAccessPath, getDefaultPathForRole, readSessionToken, SESSION_COOKIE_NAME } from './lib/auth.js'
import { isChefRole, isDeveloperRole } from './lib/roles.js'

function isPublicPath(pathname) {
  return pathname === '/login' || pathname.startsWith('/api/auth/')
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
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  })

  return response
}

function buildUnauthorizedResponse(request, isInvalidSession = false) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    return isInvalidSession ? clearSessionCookie(response) : response
  }

  const loginUrl = new URL('/login', request.url)
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
    return httpsRedirect
  }

  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const session = token ? await readSessionToken(token) : null

    if (pathname === '/login' && session) {
      return NextResponse.redirect(new URL(getDefaultPathForRole(session.role), request.url))
    }

    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return buildUnauthorizedResponse(request)
  }

  const session = await readSessionToken(token)

  if (!session) {
    return buildUnauthorizedResponse(request, true)
  }

  if (isChefRole(session.role) && pathname === '/') {
    return NextResponse.redirect(new URL('/daily-hours', request.url))
  }

  if (isDeveloperRole(session.role) && pathname === '/') {
    return NextResponse.redirect(new URL('/developer', request.url))
  }

  if (!canAccessPath(session, pathname)) {
    return buildForbiddenResponse(request, session)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
