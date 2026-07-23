import {
  createWorkPlanController,
  getWorkPlansController,
} from '../../../server/controllers/work-plans-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../server/responses/route-response.js'

export async function GET() {
  try {
    return toNextResponse(await getWorkPlansController())
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter work plans')
  }
}

export async function POST(request) {
  try {
    return toNextResponse(await createWorkPlanController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao criar work plan')
  }
}
