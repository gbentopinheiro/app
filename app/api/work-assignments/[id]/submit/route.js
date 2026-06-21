import { submitWorkAssignmentController } from '../../../../../server/controllers/work-assignments-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../../../server/responses/route-response.js'

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await submitWorkAssignmentController(id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao submeter horas')
  }
}
