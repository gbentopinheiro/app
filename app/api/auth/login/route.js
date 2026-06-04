import { NextResponse } from 'next/server'
import { getAccessIdentityByPersonIdData, getAccessIdentityByUsernameData } from '../../../../lib/access-identities.js'
import { ACCOUNT_TYPE_ADMIN, ACCOUNT_TYPE_DEVELOPER, ACCOUNT_TYPE_OPERATIONAL } from '../../../../lib/account-types.js'
import { createSessionToken, getDefaultPathForRole, getSessionCookieOptions, SESSION_COOKIE_NAME } from '../../../../lib/auth.js'
import { readProtectedRequestJson } from '../../../../lib/login-transport.js'
import { clearFailedLoginAttempts, getLoginBlockState, recordFailedLoginAttempt } from '../../../../lib/login-attempts.js'
import { recordLoginEvent } from '../../../../lib/login-audit.js'
import { isBcryptPassword, verifyPassword } from '../../../../lib/passwords.js'
import { ROLE_DEVELOPER, canRoleSignIn } from '../../../../lib/roles.js'
import { getUserByUsernameData, touchUserLastLoginData, updateUserPasswordData } from '../../../../lib/users.js'

function buildAdminSession(user) {
  return {
    userId: user.id,
    personId: 0,
    username: user.username,
    name: user.name || user.username,
    role: 'admin',
    accountType: ACCOUNT_TYPE_ADMIN,
    workIds: [],
  }
}

function buildDeveloperSession(user) {
  return {
    userId: user.id,
    personId: 0,
    username: user.username,
    name: user.name || user.username,
    role: ROLE_DEVELOPER,
    accountType: ACCOUNT_TYPE_DEVELOPER,
    workIds: [],
  }
}

function buildAccessIdentitySession(identity, user) {
  return {
    userId: user.id,
    personId: identity?.person?.id || identity?.personId || user.personId || 0,
    username: user.username,
    name: identity?.person?.name || user.name || user.username,
    role: identity?.person?.role || identity?.role || user.person?.role || user.role,
    accountType: ACCOUNT_TYPE_OPERATIONAL,
    workIds: Array.isArray(identity?.works) ? identity.works.map(work => work.id) : [],
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
      return NextResponse.json({ error: 'Username e password sao obrigatorios.' }, { status: 400 })
    }

    const currentBlockState = getLoginBlockState(username)

    if (currentBlockState.blocked) {
      return buildBlockedLoginResponse(currentBlockState.retryAfterSeconds)
    }

    const user = await getUserByUsernameData(username)

    if (!user || !(await verifyPassword(password, user.passwordHash || user.password))) {
      const failedAttemptState = recordFailedLoginAttempt(username)

      if (failedAttemptState.blocked) {
        return buildBlockedLoginResponse(failedAttemptState.retryAfterSeconds)
      }

      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 401 })
    }

    clearFailedLoginAttempts(username)

    if (user.active === false || user.deletedAt) {
      return NextResponse.json(
        { error: 'Esta conta nao esta disponivel para iniciar sessao.' },
        { status: 403 },
      )
    }

    if (!isBcryptPassword(user.passwordHash || user.password)) {
      await updateUserPasswordData(user.id, password, {
        enforcePolicy: false,
        accountType: user.accountType,
      })
    }

    const accessIdentity =
      user.accountType === ACCOUNT_TYPE_OPERATIONAL
        ? (await getAccessIdentityByPersonIdData(user.personId)) || (await getAccessIdentityByUsernameData(user.username))
        : null

    if (
      user.accountType === ACCOUNT_TYPE_OPERATIONAL &&
      user.personId &&
      (!accessIdentity ||
        !accessIdentity.person ||
        accessIdentity.person.missing ||
        accessIdentity.person.role !== (user.person?.role || user.role))
    ) {
      return NextResponse.json(
        { error: 'O acesso desta pessoa nao esta corretamente ligado ao role configurado.' },
        { status: 403 },
      )
    }

    const signInRole = user.person?.role || accessIdentity?.role || user.role

    if (user.accountType === ACCOUNT_TYPE_OPERATIONAL && !canRoleSignIn(signInRole)) {
      return NextResponse.json(
        { error: 'Este perfil ainda nao tem acesso a aplicacao.' },
        { status: 403 },
      )
    }

    const session = user.accountType === ACCOUNT_TYPE_DEVELOPER
      ? buildDeveloperSession(user)
      : user.accountType === ACCOUNT_TYPE_ADMIN
        ? buildAdminSession(user)
        : buildAccessIdentitySession(accessIdentity, user)

    try {
      recordLoginEvent(
        buildLoginAuditPayload({
          session,
          accountType: user.accountType,
          request,
        }),
      )
    } catch (auditError) {
      console.error('Error recording login event:', auditError.message)
    }

    try {
      await touchUserLastLoginData(user.id)
    } catch (touchError) {
      console.error('Error updating last login timestamp:', touchError.message)
    }

    const token = await createSessionToken(session)
    const response = NextResponse.json({
      role: session.role,
      username: session.username,
      name: session.name,
      accountType: session.accountType,
      redirectTo: getDefaultPathForRole(session.role),
    })

    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions())
    return response
  } catch (error) {
    if (error.message?.includes('protecao') || error.message?.includes('protegido')) {
      return NextResponse.json({ error: 'Pedido de login nao protegido.' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro ao iniciar sessao.' }, { status: 500 })
  }
}
