import { updateDeveloperAccessProfilePermissionsController } from '../../../../../../server/controllers/developer-access-profiles-controller.js'

export async function PUT(request, { params }) {
  const { id } = await params
  return updateDeveloperAccessProfilePermissionsController(request, id)
}
