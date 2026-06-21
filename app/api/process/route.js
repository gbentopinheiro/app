import {
  getLegacyProcessController,
  postLegacyProcessController,
} from '../../../server/controllers/process-controller.js'

export async function GET() {
  return getLegacyProcessController()
}

export async function POST(request) {
  return postLegacyProcessController(request)
}
