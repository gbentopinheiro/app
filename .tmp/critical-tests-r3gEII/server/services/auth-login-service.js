import {
  getAccessIdentityByPersonIdData,
  getAccessIdentityByUsernameData,
} from '../../lib/access-identities.js'
import {
  ACCOUNT_TYPE_ADMIN,
  ACCOUNT_TYPE_DEVELOPER,
  ACCOUNT_TYPE_OPERATIONAL,
} from '../../lib/account-types.js'
import {
  createSessionToken,
  getDefaultPathForRole,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from '../../lib/auth.js'
import {
  clearFailedLoginAttempts,
  getLoginBlockState,
  recordFailedLoginAttempt,
} from '../../lib/login-attempts.js'
import { recordLoginEvent } from '../../lib/login-audit.js'
import { isBcryptPassword, verifyPassword } from '../../lib/passwords.js'
import { ROLE_DEVELOPER, canRoleSignIn } from '../../lib/roles.js'
import {
  getUserByUsernameData,
  touchUserLastLoginData,
  updateUserPasswordData,
} from '../../lib/users.js'
import { HttpError } from '../errors/http-error.js'

function buildAdminSession(user) {
  return {
    userId: user.id,
    personId: 0,
    username: user.username,
    name: user.name || user.username,
    role: 'admin',
    chefCategory: null,
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
    chefCategory: null,
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
    chefCategory: identity?.person?.chefCategory || user.person?.chefCategory || null,
    accountType: ACCOUNT_TYPE_OPERATIONAL,
    workIds: Array.isArray(identity?.works) ? identity.works.map(work => work.id) : [],
  }
}

function buildLoginAuditPayload({ session, accountType, userAgent }) {
  return {
    userId: session.userId || null,
    personId: session.personId || null,
    username: session.username,
    name: session.name,
    role: session.role,
    accountType,
    loginAt: new Date().toISOString(),
    userAgent,
  }
}

function formatRetryAfter(retryAfterSeconds) {
  const totalSeconds = Math.max(Math.ceil(Number(retryAfterSeconds) || 0), 1)
  const minutes = Math.ceil(totalSeconds / 60)
  return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
}

function buildBlockedLoginError(retryAfterSeconds) {
  const error = new HttpError(
    429,
    `Tente novamente daqui a ${formatRetryAfter(retryAfterSeconds)}.`,
  )

  error.retryAfterSeconds = retryAfterSeconds
  return error
}

export async function loginService(body, { userAgent = '' } = {}) {
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')

  if (!username || !password) {
    throw new HttpError(400, 'Username e password sao obrigatorios.')
  }

  const currentBlockState = await getLoginBlockState(username)

  if (currentBlockState.blocked) {
    throw buildBlockedLoginError(currentBlockState.retryAfterSeconds)
  }

  const user = await getUserByUsernameData(username)

  if (!user || !(await verifyPassword(password, user.passwordHash || user.password))) {
    const failedAttemptState = await recordFailedLoginAttempt(username)

    if (failedAttemptState.blocked) {
      throw buildBlockedLoginError(failedAttemptState.retryAfterSeconds)
    }

    throw new HttpError(401, 'Credenciais invalidas.')
  }

  await clearFailedLoginAttempts(username)

  if (user.active === false || user.deletedAt) {
    throw new HttpError(403, 'Esta conta nao esta disponivel para iniciar sessao.')
  }

  if (!isBcryptPassword(user.passwordHash || user.password)) {
    await updateUserPasswordData(user.id, password, {
      enforcePolicy: false,
      accountType: user.accountType,
    })
  }

  const accessIdentity =
    user.accountType === ACCOUNT_TYPE_OPERATIONAL
      ? (await getAccessIdentityByPersonIdData(user.personId)) ||
        (await getAccessIdentityByUsernameData(user.username))
      : null

  if (
    user.accountType === ACCOUNT_TYPE_OPERATIONAL &&
    user.personId &&
    (!accessIdentity ||
      !accessIdentity.person ||
      accessIdentity.person.missing ||
      accessIdentity.person.role !== (user.person?.role || user.role))
  ) {
    throw new HttpError(
      403,
      'O acesso desta pessoa nao esta corretamente ligado ao role configurado.',
    )
  }

  const signInRole = user.person?.role || accessIdentity?.role || user.role

  if (user.accountType === ACCOUNT_TYPE_OPERATIONAL && !canRoleSignIn(signInRole)) {
    throw new HttpError(403, 'Este perfil ainda nao tem acesso a aplicacao.')
  }

  const session =
    user.accountType === ACCOUNT_TYPE_DEVELOPER
      ? buildDeveloperSession(user)
      : user.accountType === ACCOUNT_TYPE_ADMIN
        ? buildAdminSession(user)
        : buildAccessIdentitySession(accessIdentity, user)

  try {
    await recordLoginEvent(
      buildLoginAuditPayload({
        session,
        accountType: user.accountType,
        userAgent,
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

  return {
    body: {
      role: session.role,
      username: session.username,
      name: session.name,
      accountType: session.accountType,
      redirectTo: getDefaultPathForRole(session.role),
    },
    sessionToken: token,
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: getSessionCookieOptions(),
  }
}
