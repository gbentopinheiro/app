import {
  getDeveloperAuditTrailController,
  postDeveloperAuditTrailController,
} from '../../../../server/controllers/developer-audit-trail-controller.js'

export async function GET(request) {
  return getDeveloperAuditTrailController(request)
}

export async function POST(request) {
  return postDeveloperAuditTrailController(request)
}
