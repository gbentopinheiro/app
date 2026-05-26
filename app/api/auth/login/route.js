import { NextResponse } from 'next/server'
import { getAdminByUsername, updateAdminPassword } from '../../../../lib/admins.js'
import { getAccessIdentityByUsername, updateAccessIdentity } from '../../../../lib/access-identities.js'
import { createSessionToken, getDefaultPathForRole, getSessionCookieOptions, SESSION_COOKIE_NAME } from '../../../../lib/auth.js'
import { getDeveloperByUsername, updateDeveloperPassword } from '../../../../lib/developers.js'
import { readProtectedRequestJson } from '../../../../lib/login-transport.js'
import { clearFailedLoginAttempts, getLoginBlockState, recordFailedLoginAttempt } from '../../../../lib/login-attempts.js'
import { recordLoginEvent } from '../../../../lib/login-audit.js'
import { isBcryptPassword, verifyPassword } from '../../../../lib/passwords.js'
import { ROLE_DEVELOPER, canRoleSignIn } from '../../../../lib/roles.js'

function buildAdminSession(admin) {
  return {
    userId: admin.id,
    personId: 0,
    username: admin.username,
    name: admin.name || admin.username,
    role: 'admin',
    workIds: [],
  }
}

function buildDeveloperSession(developer) {
  return {
    userId: developer.id,
    personId: 0,
    username: developer.username,
    name: developer.name || developer.username,
    role: ROLE_DEVELOPER,
    workIds: [],
  }
}

function buildAccessIdentitySession(identity) {
  return {
    userId: identity.id,
    personId: identity.person?.id || identity.personId || 0,
    username: identity.username,
    name: identity.person?.name || identity.username,
    role: identity.person?.role || identity.role,
    workIds: Array.isArray(identity.works) ? identity.works.map(work => work.id) : [],
  }
}

function buildLoginAuditPayload({ session, accountType, request }) {
  return {
    username: session.username,
    name: session.name,
    role: session.role,
    accountType,
    loginAt: new Date().toISOString(),
    userAgent: request.headers.get('user-agent') || '',
  }
}

function formatRetryAfter(retryAfterSeconds) {
  const totalSeconds = Math.max(Math.ceil(Number(retryAfterSeconds) || 0), 1)
  const minutes = Math.ceil(totalSeconds / 60)
  return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
}

function buildBlockedLoginResponse(retryAfterSeconds) {
  const response = NextResponse.json(
    { error: `Tente novamente daqui a ${formatRetryAfter(retryAfterSeconds)}.` },
    { status: 429 },
  )
  response.headers.set('Retry-After', String(retryAfterSeconds))
  return response
}

export async function POST(request) {
  try {
    const body = await readProtectedRequestJson(request)
    const username = String(body.username || '').trim()
    const password = String(body.password || '')

    if (!username || !password) {
      return NextResponse.json({ error: 'Username e password são obrigatórios.' }, { status: 400 })
    }

    const currentBlockState = getLoginBlockState(username)

    if (currentBlockState.blocked) {
      return buildBlockedLoginResponse(currentBlockState.retryAfterSeconds)
    }

    const accessIdentity = getAccessIdentityByUsername(username)
    const developer = accessIdentity ? null : getDeveloperByUsername(username)
    const admin = accessIdentity || developer ? null : getAdminByUsername(username)
    const user = accessIdentity || developer || admin

    if (!user || !(await verifyPassword(password, user.password))) {
      const failedAttemptState = recordFailedLoginAttempt(username)

      if (failedAttemptState.blocked) {
        return buildBlockedLoginResponse(failedAttemptState.retryAfterSeconds)
      }

      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }

    clearFailedLoginAttempts(username)

    if (!isBcryptPassword(user.password)) {
      const migrationOptions = { enforcePolicy: false }

      if (accessIdentity) updateAccessIdentity(accessIdentity.id, { password }, migrationOptions)
      if (developer) updateDeveloperPassword(developer.id, password, migrationOptions)
      if (admin) updateAdminPassword(admin.id, password, migrationOptions)
    }

    if (
      accessIdentity?.personId &&
      (!accessIdentity.person || accessIdentity.person.missing || accessIdentity.person.role !== accessIdentity.role)
    ) {
      return NextResponse.json(
        { error: 'O acesso desta pessoa não está corretamente ligado ao role configurado.' },
        { status: 403 },
      )
    }

    if (accessIdentity && !canRoleSignIn(accessIdentity.role)) {
      return NextResponse.json(
        { error: 'Este perfil ainda não tem acesso à aplicação.' },
        { status: 403 },
      )
    }

    const session = developer
      ? buildDeveloperSession(developer)
      : admin
        ? buildAdminSession(admin)
        : buildAccessIdentitySession(accessIdentity)

    try {
      recordLoginEvent(
        buildLoginAuditPayload({
          session,
          accountType: developer ? 'developer' : admin ? 'admin' : 'operational',
          request,
        }),
      )
    } catch (auditError) {
      console.error('Error recording login event:', auditError.message)
    }

    const token = await createSessionToken(session)
    const response = NextResponse.json({
      role: session.role,
      username: session.username,
      name: session.name,
      redirectTo: getDefaultPathForRole(session.role),
    })

    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions())
    return response
  } catch (error) {
    if (error.message?.includes('protecao') || error.message?.includes('protegido')) {
      return NextResponse.json({ error: 'Pedido de login não protegido.' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro ao iniciar sessão.' }, { status: 500 })
  }
}
