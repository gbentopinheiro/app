import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getDashboardSummaryPeriod, sumDashboardRevenue, getDashboardPendingWorkIds, DASHBOARD_SUMMARY_MIN_YEAR, DASHBOARD_SUMMARY_MAX_YEAR } from '../lib/dashboard-summary-rules.js'
import { getDashboardSummaryDb } from '../lib/db/dashboard-summary-db.js'
import { isAssignmentApproved, getApprovedAssignmentTotalCost } from '../lib/work-assignment-approval.js'

const period = getDashboardSummaryPeriod('2026-10-21')

test('dashboard periods use the requested date with strict date validation, including year boundaries', () => {
  assert.deepEqual(period, { date: '2026-10-21', month: '2026-10', year: 2026, yearStart: '2026-01-01', yearEnd: '2026-12-31' })
  assert.equal(getDashboardSummaryPeriod('2027-01-01').yearStart, '2027-01-01')
  for (const invalid of ['', '2026-02-30', '2026-13-01', '21/10/2026', '2026-10-21T00:00:00Z']) {
    assert.throws(() => getDashboardSummaryPeriod(invalid), /data válida/)
  }
})

test('supported dashboard years match the existing MySQL DATE range and reject neighboring years', () => {
  assert.equal(DASHBOARD_SUMMARY_MIN_YEAR, 1000)
  assert.equal(DASHBOARD_SUMMARY_MAX_YEAR, 9999)
  for (const date of ['0999-12-31', '10000-01-01', '0000-01-01', '0001-01-01', '0099-01-01']) {
    assert.throws(() => getDashboardSummaryPeriod(date), /date/)
  }
})

for (const date of ['1000-01-01', '1000-12-31', '9999-01-01', '9999-12-31', '2026-12-31', '2027-01-01']) {
  test(`dashboard period ${date} preserves four-digit years and exact UTC query boundaries`, async () => {
    const current = getDashboardSummaryPeriod(date)
    const year = date.slice(0, 4)
    assert.equal(current.yearStart, `${year}-01-01`)
    assert.equal(current.yearEnd, `${year}-12-31`)
    const { db, queries } = fakeDb({ pending: false })
    await getDashboardSummaryDb(current, db)
    const projections = queries.filter(q => q.type === 'assignmentProjection')
    assert.deepEqual(Object.keys(projections[0].args.where.workPlan.date).sort(), ['gte', 'lte'])
    assert.equal(projections[0].args.where.workPlan.date.gte.toISOString(), `${year}-01-01T00:00:00.000Z`)
    assert.equal(projections[0].args.where.workPlan.date.lte.toISOString(), `${year}-12-31T00:00:00.000Z`)
    assert.equal(projections[1].args.where.workPlan.date.toISOString(), `${date}T00:00:00.000Z`)
  })
}

test('dashboard date validation handles Gregorian leap years without normalizing invalid days', () => {
  for (const date of ['2000-02-29', '2024-02-29', '2400-02-29']) assert.equal(getDashboardSummaryPeriod(date).date, date)
  for (const date of ['1000-02-29', '1900-02-29', '2026-02-29', '2100-02-29', '9999-02-29',
    '2026-00-10', '2026-01-00', '2026-04-31', '2026-10-21\n']) {
    assert.throws(() => getDashboardSummaryPeriod(date), /data válida/)
  }
})

test('revenue keeps the previous JS rounding per assignment, rather than decimal SQL rounding', () => {
  const rows = [
    { date: '2026-10-21', approvedHours: 7.5, hourlyCost: 1.23, adminApprovedAt: '2026-10-21' },
    { date: '2026-10-21', approvedHours: 0.5, hourlyCost: 0.03, adminApprovedAt: '2026-10-21' },
    { date: '2026-02-21', approvedHours: 8, hourlyCost: 12.34, submittedAt: null },
    { date: '2026-10-21', approvedHours: 0, hourlyCost: 100, submittedAt: null },
    { date: '2026-10-21', approvedHours: -1, hourlyCost: 2, submittedAt: null },
  ]
  const expectedAnnual = rows.filter(isAssignmentApproved).reduce((s, r) => s + Number((Number(r.approvedHours) * Number(r.hourlyCost)).toFixed(2)), 0)
  const expectedMonthly = rows.filter(r => r.date.startsWith('2026-10')).reduce((s, r) => s + getApprovedAssignmentTotalCost(r), 0)
  assert.equal(Number((7.5 * 1.23).toFixed(2)), 9.22, 'guards the fractional-cent compatibility case')
  assert.deepEqual(sumDashboardRevenue(rows, period), { annualRevenue: expectedAnnual, monthlyRevenue: expectedMonthly })
  assert.deepEqual(sumDashboardRevenue([], period), { annualRevenue: 0, monthlyRevenue: 0 })
})

test('pending totals reuse current visibility, approval, access and unique-work rules', () => {
  const row = (workId, extra = {}) => ({ workId, date: period.date, hours: 10, dailyHours: 10, approvedHours: null, planningVisible: true, ...extra })
  const rows = [row(1), row(1), row(2, { approvedHours: 0 }), row(3, { approvedHours: 8, submittedAt: '2026-10-21' }),
    row(4, { adminApprovedAt: '2026-10-21' }), row(5, { assignmentPurpose: 'access' }),
    row(6, { planningVisible: false }), row(7, { planningVisible: false, hours: 8 }),
    row(8, { planningVisible: false, hours: 0, dailyHours: 0 }),
    row(9, { planningVisible: false, hours: 0, dailyHours: 0, submittedBy: 'Chefe' }),
    row(10, { planningVisible: false, submitted: true })]
  assert.deepEqual(getDashboardPendingWorkIds(rows), [1, 3, 7, 9, 10])
  assert.deepEqual(getDashboardPendingWorkIds([]), [])
})

test('Saturday hidden unchanged hours keep the existing seven-hour default', () => {
  assert.deepEqual(getDashboardPendingWorkIds([{ workId: 1, date: '2026-10-24', hours: 7, dailyHours: 7, approvedHours: null, planningVisible: false }]), [])
})

function fakeDb({ pending = true } = {}) {
  const queries = []
  const db = {
    $queryRaw: async (sql, ...values) => { queries.push({ type: 'workerCount', sql: sql.join('?'), values }); return [{ totalWorkers: 71n }] },
    workAssignment: { findMany: async args => {
      queries.push({ type: 'assignmentProjection', args })
      if (args.select.hourlyCost) return [{ approvedHours: 7.5, hourlyCost: 1.23, workPlan: { date: new Date('2026-10-21T00:00:00Z') } }]
      return pending ? [{ workId: 1, hours: 10, dailyHours: 10, approvedHours: null, planningVisible: true }] : []
    } },
    work: { count: async args => { queries.push({ type: 'pendingCount', args }); return 1 } },
  }
  return { db, queries }
}

test('MySQL summary reads minimal projections and counts without loading person/work lists', async () => {
  const { db, queries } = fakeDb()
  assert.deepEqual(await getDashboardSummaryDb(period, db), { totalWorkers: 71, annualRevenue: 9.22, monthlyRevenue: 9.22, pendingWorks: 1 })
  const projections = queries.filter(q => q.type === 'assignmentProjection').map(q => q.args)
  assert.deepEqual(Object.keys(projections[0].select).sort(), ['approvedHours', 'hourlyCost', 'workPlan'])
  assert.ok(projections.every(q => !q.include && !q.select.person && !q.select.work && !q.select.notes))
  assert.deepEqual(projections[0].where.OR, [{ adminApprovedAt: { not: null } }, { approvedHours: { not: null }, submittedAt: null }])
  assert.equal(projections[0].where.workPlan.date.gte.toISOString().slice(0, 10), '2026-01-01')
  assert.equal(projections[0].where.workPlan.date.lte.toISOString().slice(0, 10), '2026-12-31')
  assert.deepEqual(queries.find(q => q.type === 'pendingCount').args, { where: { id: { in: [1] }, status: { not: 'completed' } } })
})

test('empty pending projection needs no work lookup and database errors are not converted to fake zeros', async () => {
  const { db, queries } = fakeDb({ pending: false })
  assert.equal((await getDashboardSummaryDb(period, db)).pendingWorks, 0)
  assert.ok(!queries.some(q => q.type === 'pendingCount'))
  db.$queryRaw = async () => { throw Error('database unavailable') }
  await assert.rejects(() => getDashboardSummaryDb(period, db), /database unavailable/)
})
