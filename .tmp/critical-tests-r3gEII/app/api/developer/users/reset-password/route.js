import { resetDeveloperUserPasswordController } from '../../../../../server/controllers/developer-users-controller.js'

export async function POST(request) {
  return resetDeveloperUserPasswordController(request)
}
