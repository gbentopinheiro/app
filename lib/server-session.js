import { cookies } from 'next/headers'
import { inferAccountType } from './account-types.js'
import { getAccessIdentityByPersonId } from './access-identities.js'
import { readSessionToken, SESSION_COOKIE_NAME } from './auth.js'
import { roleUsesWorkScope } from './roles.js'

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

  if (!session.personId) {
    return {
      ...session,
      accountType: inferAccountType(session),
    }
  }

  const identity = getAccessIdentityByPersonId(session.personId)

  if (!identity) {
    return session
  }

  const role = identity.person?.role || identity.role || session.role

  return {
    ...session,
    name: identity.person?.name || session.name,
    role,
    accountType: inferAccountType(session),
    workIds:
      roleUsesWorkScope(role) && Array.isArray(identity.works)
        ? identity.works.map(work => Number(work.id))
        : [],
  }
}
