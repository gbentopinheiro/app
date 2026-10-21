import { requireSessionService } from '../services/session-service.js'
import { getDashboardSummaryService } from '../services/dashboard-summary-service.js'
import { jsonResponse } from '../responses/route-response.js'

export async function getDashboardSummaryController(request) {
  return jsonResponse(await getDashboardSummaryService(await requireSessionService(), new URL(request.url).searchParams))
}
