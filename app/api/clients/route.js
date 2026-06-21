import {
  createClientController,
  getClientsController,
} from '../../../server/controllers/clients-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../server/responses/route-response.js'

export async function GET() {
  try {
    return toNextResponse(await getClientsController())
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter clientes')
  }
}

export async function POST(request) {
  try {
    return toNextResponse(await createClientController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao criar cliente')
  }
}
