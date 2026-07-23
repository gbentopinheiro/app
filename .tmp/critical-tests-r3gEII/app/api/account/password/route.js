import { patchAccountPasswordController } from '../../../../server/controllers/account-password-controller.js'

export async function PATCH(request) {
  return patchAccountPasswordController(request)
}
