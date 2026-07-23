import {
  deleteWorkPlanController,
  getWorkPlanController,
  updateWorkPlanController,
} from '../../../../server/controllers/work-plans-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../../server/responses/route-response.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await getWorkPlanController(id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter work plan')
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await updateWorkPlanController(request, id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao atualizar work plan')
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await deleteWorkPlanController(id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao remover work plan')
  }
}
