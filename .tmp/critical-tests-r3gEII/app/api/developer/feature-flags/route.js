import {
  getDeveloperFeatureFlagsController,
  updateDeveloperFeatureFlagsController,
} from '../../../../server/controllers/developer-feature-flags-controller.js'

export async function GET() {
  return getDeveloperFeatureFlagsController()
}

export async function PUT(request) {
  return updateDeveloperFeatureFlagsController(request)
}
