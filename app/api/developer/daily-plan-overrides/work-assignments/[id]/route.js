import {
  deleteDeveloperWorkAssignmentOverrideController,
  getDeveloperWorkAssignmentOverrideController,
  updateDeveloperWorkAssignmentOverrideController,
} from '../../../../../../server/controllers/developer-work-assignments-overrides-controller.js'

export async function GET(_request, { params }) {
  const { id } = await params
  return getDeveloperWorkAssignmentOverrideController(id)
}

export async function PUT(request, { params }) {
  const { id } = await params
  return updateDeveloperWorkAssignmentOverrideController(request, id)
}

export async function DELETE(request, { params }) {
  const { id } = await params
  return deleteDeveloperWorkAssignmentOverrideController(request, id)
}
