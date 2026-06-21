import {
  deleteClientController,
  getClientController,
  updateClientController,
} from '../../../../server/controllers/clients-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../../server/responses/route-response.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await getClientController(id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter cliente')
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await updateClientController(request, id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao atualizar cliente')
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await deleteClientController(id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao remover cliente')
  }
}
