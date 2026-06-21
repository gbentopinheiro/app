import { postAuthLoginController } from '../../../../server/controllers/auth-login-controller.js'

export async function POST(request) {
  return postAuthLoginController(request)
}
