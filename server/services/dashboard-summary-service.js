import { hasPermission } from '../../lib/permissions.js'
import { ROLE_ADMIN } from '../../lib/roles.js'
import { getDashboardSummaryPeriod } from '../../lib/dashboard-summary-rules.js'
import { getDashboardSummaryData } from '../../lib/dashboard-summary.js'
import { HttpError } from '../errors/http-error.js'

export async function getDashboardSummaryService(session, searchParams = new URLSearchParams()) {
  if (!session) throw new HttpError(401, 'Sessão obrigatória.')
  // The existing financial cards are Admin-only. dashboard.read alone is also
  // available to Responsável and must never grant access to these values.
  if (session.role !== ROLE_ADMIN || !hasPermission(session, 'dashboard.read')) {
    throw new HttpError(403, 'Sem permissão para consultar os indicadores do dashboard.')
  }
  const date = searchParams.get('date') ?? new Intl.DateTimeFormat('sv-SE').format(new Date())
  let period
  try { period = getDashboardSummaryPeriod(date) } catch (error) { throw new HttpError(400, error.message) }
  return getDashboardSummaryData(period)
}
