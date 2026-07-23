import { getDeveloperDataManagementController } from '../../../../server/controllers/developer-data-management-controller.js'

export async function GET(request) {
  return getDeveloperDataManagementController(request)
}
