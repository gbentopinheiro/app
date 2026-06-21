import { hasPermission } from '../../lib/permissions.js'
import { getServerSession } from '../../lib/server-session.js'
import { HttpError } from '../errors/http-error.js'

export async function getCurrentSessionService() {
  return getServerSession()
}

export async function requireSessionService() {
  const session = await getCurrentSessionService()

  if (!session) {
    throw new HttpError(401, 'Sessao obrigatoria.')
  }

  return session
}

export async function requireSessionPermissionService(permissionKey, forbiddenMessage) {
  const session = await requireSessionService()

  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, forbiddenMessage)
  }

  return session
}
