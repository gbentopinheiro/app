import { filterAssignmentsForSession } from './work-assignment-policy.js'
import { isAssignmentApproved } from './work-assignment-approval.js'

// Matches WorkPlan.date @db.Date in the existing MySQL schema.
export const DASHBOARD_SUMMARY_MIN_YEAR = 1000
export const DASHBOARD_SUMMARY_MAX_YEAR = 9999

export function getDashboardSummaryPeriod(date) {
  const match = typeof date === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) throw new Error('date tem de ser uma data válida no formato AAAA-MM-DD.')
  const [year, month, day] = match.slice(1).map(Number)
  if (year < DASHBOARD_SUMMARY_MIN_YEAR || year > DASHBOARD_SUMMARY_MAX_YEAR) {
    throw new Error(`date tem de estar entre ${DASHBOARD_SUMMARY_MIN_YEAR}-01-01 e ${DASHBOARD_SUMMARY_MAX_YEAR}-12-31.`)
  }
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (month < 1 || month > 12 || day < 1 || day > monthDays[month - 1]) {
    throw new Error('date tem de ser uma data válida no formato AAAA-MM-DD.')
  }
  const yearText = String(year).padStart(4, '0')
  // DATE columns let us include Dec 31 without constructing year 10000.
  return { date, month: date.slice(0, 7), year, yearStart: `${yearText}-01-01`, yearEnd: `${yearText}-12-31` }
}

// Input contains only approved rows. Keep the existing per-row Number/toFixed
// rounding and iteration order, including legacy approved hours. SQL decimal
// ROUND/SUM can differ from this contract for fractional-cent products.
export function sumDashboardRevenue(rows, period) {
  let annualRevenue = 0
  let monthlyRevenue = 0
  for (const row of rows) {
    const hours = Number(row.approvedHours)
    const rate = Number(row.hourlyCost)
    if (!Number.isFinite(hours) || !Number.isFinite(rate)) continue
    const amount = Number((hours * rate).toFixed(2))
    annualRevenue += amount
    if (row.date.slice(0, 7) === period.month && hours > 0) monthlyRevenue += amount
  }
  return { annualRevenue, monthlyRevenue }
}

export function getDashboardPendingWorkIds(rows) {
  return [...new Set(filterAssignmentsForSession(rows, { role: 'admin' })
    .filter(row => !isAssignmentApproved(row)).map(row => Number(row.workId)))]
}
