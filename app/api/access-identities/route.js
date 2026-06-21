import { getAccessIdentitiesController } from '../../../server/controllers/access-identities-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../server/responses/route-response.js'

export async function GET(request) {
  try {
    return toNextResponse(await getAccessIdentitiesController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter acessos')
  }
}
