import { createPersonController, getPeopleController } from '../../../server/controllers/people-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../server/responses/route-response.js'

export async function GET() {
  try {
    return toNextResponse(await getPeopleController())
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter pessoas')
  }
}

export async function POST(request) {
  try {
    return toNextResponse(await createPersonController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao criar pessoa')
  }
}
