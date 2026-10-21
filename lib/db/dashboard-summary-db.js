import { prisma } from '../prisma.js'
import { ROLE_ADMIN, ROLE_DEVELOPER, ROLE_RESPONSAVEL } from '../roles.js'
import { getDashboardPendingWorkIds, sumDashboardRevenue } from '../dashboard-summary-rules.js'
import { toDateOnlyString } from './core-mappers.js'

// Inputs are the validated four-digit dates from getDashboardSummaryPeriod.
function toSummaryUtcDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export async function getDashboardSummaryDb(period, db = prisma) {
  const [workerCount, revenueRows, todayRows] = await Promise.all([
    // normalizeRole treats unknown/legacy roles as workers; exclude exactly the
    // three non-worker roles rather than silently dropping legacy records.
    db.$queryRaw`SELECT COUNT(*) AS totalWorkers FROM people
      WHERE LOWER(TRIM(role)) NOT IN (${ROLE_ADMIN}, ${ROLE_DEVELOPER}, ${ROLE_RESPONSAVEL})`,
    db.workAssignment.findMany({
      where: {
        workPlan: { date: { gte: toSummaryUtcDate(period.yearStart), lte: toSummaryUtcDate(period.yearEnd) } },
        OR: [{ adminApprovedAt: { not: null } }, { approvedHours: { not: null }, submittedAt: null }],
      },
      select: { approvedHours: true, hourlyCost: true, workPlan: { select: { date: true } } },
      orderBy: [{ workPlanId: 'asc' }, { workId: 'asc' }, { id: 'asc' }],
    }),
    db.workAssignment.findMany({
      where: { workPlan: { date: toSummaryUtcDate(period.date) } },
      // Only the fields required by the shared operational visibility/approval
      // predicates. No person/work records, pricing, notes or audit user joins.
      select: {
        workId: true, hours: true, dailyHours: true, approvedHours: true,
        submitted: true, submittedAt: true, adminApprovedAt: true,
        submittedByName: true, adminApprovedByName: true,
        planningVisible: true, assignmentPurpose: true,
      },
    }),
  ])
  const pendingIds = getDashboardPendingWorkIds(todayRows.map(row => ({
    ...row,
    date: period.date,
    hours: Number(row.hours), dailyHours: Number(row.dailyHours),
    approvedHours: row.approvedHours === null ? null : Number(row.approvedHours),
    submittedBy: String(row.submittedByName || '').trim() || null,
    adminApprovedBy: String(row.adminApprovedByName || '').trim() || null,
    // The normal assignment enrichment never grants access to hidden rows.
    // Visible rows do not depend on this flag for operational visibility.
    hasWorkAccess: false,
  })))
  const pendingWorks = pendingIds.length ? await db.work.count({
    where: { id: { in: pendingIds }, status: { not: 'completed' } },
  }) : 0

  return {
    totalWorkers: Number(workerCount[0].totalWorkers),
    ...sumDashboardRevenue(revenueRows.map(row => ({
      approvedHours: row.approvedHours, hourlyCost: row.hourlyCost, date: toDateOnlyString(row.workPlan.date),
    })), period),
    pendingWorks,
  }
}
