import {
  deleteMaterialController,
  getMaterialController,
  updateMaterialController,
} from '../../../../server/controllers/materials-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../../server/responses/route-response.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await getMaterialController(id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter material.')
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await updateMaterialController(request, id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao atualizar material.')
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await deleteMaterialController(id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao remover material.')
  }
}
