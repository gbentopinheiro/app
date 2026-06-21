import { getAuthSessionController } from '../../../../server/controllers/auth-session-controller.js'
import { toNextResponse } from '../../../../server/responses/route-response.js'

export async function GET() {
  return toNextResponse(await getAuthSessionController())
}
