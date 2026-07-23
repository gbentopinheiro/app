import {
  createWorkAssignmentController,
  getWorkAssignmentsController,
} from '../../../server/controllers/work-assignments-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../server/responses/route-response.js'

export async function GET(request) {
  try {
    return toNextResponse(await getWorkAssignmentsController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter afetacoes')
  }
}

export async function POST(request) {
  try {
    return toNextResponse(await createWorkAssignmentController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao criar afetacao')
  }
}
