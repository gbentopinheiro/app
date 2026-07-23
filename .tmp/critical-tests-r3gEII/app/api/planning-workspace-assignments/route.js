import { createPlanningDraftAssignmentController } from '../../../server/controllers/planning-publication-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../server/responses/route-response.js'

export async function POST(request) {
  try {
    return toNextResponse(await createPlanningDraftAssignmentController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao criar afetacao de draft')
  }
}
