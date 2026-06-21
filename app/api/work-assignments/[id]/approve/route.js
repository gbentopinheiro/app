import { approveWorkAssignmentController } from '../../../../../server/controllers/work-assignments-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../../../server/responses/route-response.js'

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await approveWorkAssignmentController(request, id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao aprovar horas')
  }
}
