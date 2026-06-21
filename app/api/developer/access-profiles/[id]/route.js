import { getDeveloperAccessProfileController } from '../../../../../server/controllers/developer-access-profiles-controller.js'

export async function GET(request, { params }) {
  const { id } = await params
  return getDeveloperAccessProfileController(id)
}
