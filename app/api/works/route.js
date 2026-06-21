import { createWorkController, getWorksController } from '../../../server/controllers/works-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../server/responses/route-response.js'

export async function GET() {
  try {
    return toNextResponse(await getWorksController())
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter obras')
  }
}

export async function POST(request) {
  try {
    return toNextResponse(await createWorkController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao criar obra')
  }
}
