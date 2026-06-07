import { cookies } from 'next/headers'
import { inferAccountType } from './account-types.js'
import { getAccessIdentityByPersonIdData } from './access-identities.js'
import { normalizeAccessProfile, resolveAccessProfileForUser } from './access-profiles.js'
import { isMysqlDataSourceEnabled } from './data-source.js'
import { readSessionToken, SESSION_COOKIE_NAME } from './auth.js'
import { getAccessProfilePermissionKeys } from './permissions.js'
import { roleUsesWorkScope } from './roles.js'
import { getUserByUsernameData } from './users.js'

function buildSessionAccessState(sessionLike) {
  const accountType = inferAccountType(sessionLike)
  const accessProfile = normalizeAccessProfile(
    sessionLike?.accessProfile || resolveAccessProfileForUser({ role: sessionLike?.role, accountType }),
  )

  return {
    ...sessionLike,
    accountType,
    accessProfileId: Number(sessionLike?.accessProfileId) || null,
    accessProfile,
    permissionKeys: [...getAccessProfilePermissionKeys(accessProfile)],
  }
}

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
        accessProfileId: runtimeUser.accessProfileId,
        accessProfile: runtimeUser.accessProfile,
        permissionKeys: runtimeUser.permissionKeys,
      }
    : session

  if (!resolvedSession.personId) {
    return buildSessionAccessState(resolvedSession)
  }

  const identity = await getAccessIdentityByPersonIdData(resolvedSession.personId)

  if (!identity) {
    return buildSessionAccessState(resolvedSession)
  }

  const role = identity.person?.role || identity.role || resolvedSession.role

  return buildSessionAccessState({
    ...resolvedSession,
    name: identity.person?.name || resolvedSession.name,
    role,
    workIds:
      roleUsesWorkScope(role) && Array.isArray(identity.works)
        ? identity.works.map(work => Number(work.id))
        : [],
  })
}
