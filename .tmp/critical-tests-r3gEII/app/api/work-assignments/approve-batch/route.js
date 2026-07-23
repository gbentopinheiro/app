import { approveWorkAssignmentsBatchController } from '../../../../server/controllers/work-assignments-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../../server/responses/route-response.js'

export async function POST(request) {
  try {
    return toNextResponse(await approveWorkAssignmentsBatchController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao aprovar horas em lote')
  }
}
