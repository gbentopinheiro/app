import {
  deletePlanningDraftAssignmentController,
  updatePlanningDraftAssignmentController,
} from '../../../../server/controllers/planning-publication-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../../server/responses/route-response.js'

export async function PUT(request, context) {
  try {
    return toNextResponse(
      await updatePlanningDraftAssignmentController(request, (await context.params).id),
    )
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao atualizar afetacao de draft')
  }
}

export async function DELETE(request, context) {
  try {
    return toNextResponse(
      await deletePlanningDraftAssignmentController((await context.params).id),
    )
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao remover afetacao de draft')
  }
}
