import { getDashboardSummaryController } from '../../../../server/controllers/dashboard-summary-controller.js'
import { toNextResponse, toNextErrorResponse } from '../../../../server/responses/route-response.js'
import { applyNoCacheHeaders } from '../../../../lib/cache-policy.js'

export async function GET(request) {
  try {
    return applyNoCacheHeaders(toNextResponse(await getDashboardSummaryController(request)))
  } catch (error) {
    return applyNoCacheHeaders(toNextErrorResponse(error, 'Erro ao obter os indicadores do dashboard.'))
  }
}
