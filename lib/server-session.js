import { cookies } from 'next/headers'
import { inferAccountType } from './account-types.js'
import { getAccessIdentityByPersonIdData } from './access-identities.js'
import { isMysqlDataSourceEnabled } from './data-source.js'
import { readSessionToken, SESSION_COOKIE_NAME } from './auth.js'
import { roleUsesWorkScope } from './roles.js'
import { getUserByUsernameData } from './users.js'

export async function getServerSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const session = await readSessionToken(token)

  if (!session) {
    return null
  }

  const runtimeUser = isMysqlDataSourceEnabled()
    ? await getUserByUsernameData(session.username)
    : null

  if (runtimeUser && (runtimeUser.active === false || runtimeUser.deletedAt)) {
    return null
  }

  const resolvedSession = runtimeUser
    ? {
        ...session,
        userId: runtimeUser.id,
        personId: runtimeUser.personId || session.personId || 0,
        username: runtimeUser.username,
        name: runtimeUser.name || session.name,
        role: runtimeUser.person?.role || runtimeUser.role || session.role,
        accountType: runtimeUser.accountType || inferAccountType(session),
      }
    : session

  if (!resolvedSession.personId) {
    return {
      ...resolvedSession,
      accountType: inferAccountType(resolvedSession),
    }
  }

  const identity = await getAccessIdentityByPersonIdData(resolvedSession.personId)

  if (!identity) {
    return {
      ...resolvedSession,
      accountType: inferAccountType(resolvedSession),
    }
  }

  const role = identity.person?.role || identity.role || resolvedSession.role

  return {
    ...resolvedSession,
    name: identity.person?.name || resolvedSession.name,
    role,
    accountType: inferAccountType(resolvedSession),
    workIds:
      roleUsesWorkScope(role) && Array.isArray(identity.works)
        ? identity.works.map(work => Number(work.id))
        : [],
  }
}
