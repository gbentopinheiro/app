import { getDeveloperTestDataController } from '../../../../server/controllers/developer-test-data-controller.js'

export async function GET(request) {
  return getDeveloperTestDataController(request)
}
