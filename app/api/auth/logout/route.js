import { postAuthLogoutController } from '../../../../server/controllers/auth-logout-controller.js'

export async function POST() {
  return postAuthLogoutController()
}
