import {
  deleteWorkAssignmentController,
  getWorkAssignmentController,
  updateWorkAssignmentController,
} from '../../../../server/controllers/work-assignments-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../../server/responses/route-response.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await getWorkAssignmentController(id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter afetacao')
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await updateWorkAssignmentController(request, id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao atualizar afetacao')
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await deleteWorkAssignmentController(id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao remover afetacao')
  }
}
