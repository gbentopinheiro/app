import {
  deleteLegacyChefController,
  getLegacyChefController,
  updateLegacyChefController,
} from '../../../../server/controllers/chefs-controller.js'

export async function GET(_request, { params }) {
  const { id } = await params
  return getLegacyChefController(id)
}

export async function PUT(request, { params }) {
  const { id } = await params
  return updateLegacyChefController(request, id)
}

export async function DELETE(_request, { params }) {
  const { id } = await params
  return deleteLegacyChefController(id)
}
