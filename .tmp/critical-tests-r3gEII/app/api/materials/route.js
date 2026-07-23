import {
  createMaterialController,
  getMaterialsController,
} from '../../../server/controllers/materials-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../server/responses/route-response.js'

export async function GET() {
  try {
    return toNextResponse(await getMaterialsController())
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter materiais.')
  }
}

export async function POST(request) {
  try {
    return toNextResponse(await createMaterialController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao criar material.')
  }
}
