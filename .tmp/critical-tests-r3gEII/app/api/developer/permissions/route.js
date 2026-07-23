import { getDeveloperPermissionsController } from '../../../../server/controllers/developer-permissions-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../../server/responses/route-response.js'

export async function GET() {
  try {
    return toNextResponse(await getDeveloperPermissionsController())
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter permissoes.')
  }
}
