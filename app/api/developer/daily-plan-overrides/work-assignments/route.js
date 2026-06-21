import { createDeveloperWorkAssignmentOverrideController } from '../../../../../server/controllers/developer-work-assignments-overrides-controller.js'

export async function POST(request) {
  return createDeveloperWorkAssignmentOverrideController(request)
}
