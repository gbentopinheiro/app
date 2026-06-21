import { getDeveloperAccessProfilesController } from '../../../../server/controllers/developer-access-profiles-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../../server/responses/route-response.js'

export async function GET() {
  try {
    return toNextResponse(await getDeveloperAccessProfilesController())
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter perfis de acesso.')
  }
}
