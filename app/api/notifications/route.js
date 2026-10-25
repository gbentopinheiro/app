import { getNotificationsService } from '../../../server/services/notifications-service.js'
import { requireSessionService } from '../../../server/services/session-service.js'
import { toNextErrorResponse, toNextResponse } from '../../../server/responses/route-response.js'

export async function GET() {
  try {
    return toNextResponse({ body: await getNotificationsService(await requireSessionService()), status: 200 })
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter notificações.')
  }
}
