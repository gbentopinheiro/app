import {
  deletePersonController,
  getPersonController,
  updatePersonController,
} from '../../../../server/controllers/people-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../../server/responses/route-response.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await getPersonController(id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter pessoa')
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await updatePersonController(request, id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao atualizar pessoa')
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await deletePersonController(id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao remover pessoa')
  }
}
