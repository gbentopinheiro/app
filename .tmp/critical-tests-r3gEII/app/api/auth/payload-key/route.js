import { getAuthPayloadKeyController } from '../../../../server/controllers/auth-payload-key-controller.js'

export const dynamic = 'force-dynamic'

export async function GET() {
  return getAuthPayloadKeyController()
}
