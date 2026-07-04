import { setPlanningWorkspaceToDraftController } from '../../../../../server/controllers/planning-publication-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../../../server/responses/route-response.js'

export async function POST(request, context) {
  try {
    return toNextResponse(
      await setPlanningWorkspaceToDraftController((await context.params).id),
    )
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao voltar o planeamento para draft')
  }
}
