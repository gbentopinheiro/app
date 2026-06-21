import {
  deleteWorkController,
  getWorkController,
  updateWorkController,
} from '../../../../server/controllers/works-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../../server/responses/route-response.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await getWorkController(id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter obra')
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await updateWorkController(request, id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao atualizar obra')
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await deleteWorkController(id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao remover obra')
  }
}
