import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { isMysqlDataSourceEnabled } from './data-source.js'
import { isChefRole, isWorkerRole } from './roles.js'
import { WorkAssignment } from './work-assignments.js'
import { isAssignmentApproved } from './work-assignment-approval.js'
import { getDashboardPendingWorkIds, sumDashboardRevenue } from './dashboard-summary-rules.js'
import { getDashboardSummaryDb } from './db/dashboard-summary-db.js'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')

function readLocalData(name) {
  return JSON.parse(readFileSync(join(dataDir, `${name}.json`), 'utf8'))
}

export async function getDashboardSummaryData(period) {
  if (isMysqlDataSourceEnabled()) return getDashboardSummaryDb(period)

  // JSON storage is the existing local/test adapter. Never enrich or return its
  // lists: the API contract is the same four scalars as the MySQL adapter.
  const people = readLocalData('people')
  const works = readLocalData('works')
  const plans = new Map(readLocalData('work-plans').map(plan => [Number(plan.id), plan.date]))
  const rows = readLocalData('work-assignments').map(raw => ({
    ...new WorkAssignment(raw), date: plans.get(Number(raw.workPlanId)) || '', hasWorkAccess: false,
  }))
  const pendingIds = new Set(getDashboardPendingWorkIds(rows.filter(row => row.date === period.date)))
  return {
    totalWorkers: people.filter(person => String(person.name || '').trim() && (isWorkerRole(person.role) || isChefRole(person.role))).length,
    ...sumDashboardRevenue(rows.filter(row => row.date >= period.yearStart && row.date <= period.yearEnd && isAssignmentApproved(row)), period),
    pendingWorks: works.filter(work => work.status !== 'completed' && pendingIds.has(Number(work.id))).length,
  }
}
