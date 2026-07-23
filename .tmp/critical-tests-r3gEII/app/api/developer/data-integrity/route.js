import {
  getDeveloperDataIntegrityController,
  postDeveloperDataIntegrityController,
} from '../../../../server/controllers/developer-data-integrity-controller.js'

export async function GET() {
  return getDeveloperDataIntegrityController()
}

export async function POST(request) {
  return postDeveloperDataIntegrityController(request)
}
