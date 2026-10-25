import { getOperationNotifications } from '../../lib/operation-notifications.js'
import { isFeatureEnabled } from '../../lib/feature-flags.js'
import { hasPermission } from '../../lib/permissions.js'
import { isResponsavelRole } from '../../lib/roles.js'
import { HttpError } from '../errors/http-error.js'

export async function getNotificationsService(session, {
  featureEnabled = isFeatureEnabled, getNotifications = getOperationNotifications,
} = {}) {
  if (!session) throw new HttpError(401, 'Sessão obrigatória.')
  if (!hasPermission(session, 'notifications.read')) throw new HttpError(403, 'Sem permissão para consultar notificações.')
  if (!(await featureEnabled('notificationsCenter'))) throw new HttpError(503, 'Notificações desativadas.')
  return getNotifications({
    audience: isResponsavelRole(session.role) ? 'responsavel' : 'admin',
    withYear: true,
    includeShortDate: true,
  })
}
