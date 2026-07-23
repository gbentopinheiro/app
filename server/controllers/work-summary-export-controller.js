import { requireSessionService } from '../services/session-service.js'
import { exportClientWorkSummaryService } from '../services/work-summary-export-service.js'

async function readRequestBody(request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

export async function exportClientWorkSummaryController(request, clientId) {
  const session = await requireSessionService()
  return exportClientWorkSummaryService(session, clientId, await readRequestBody(request))
}
