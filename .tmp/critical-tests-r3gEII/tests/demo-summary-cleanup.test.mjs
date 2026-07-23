import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAnnualSummaryMonthlyTotals,
  getAnnualSummaryCost,
  getAnnualSummaryHours,
  getAnnualSummarySourceField,
  summarizeAssignmentContribution,
} from '../scripts/cleanup-demo-summary-data.mjs'
import { getApprovedAssignmentHours } from '../lib/work-assignment-approval.js'

test('resumo anual usa approvedHours quando existe', () => {
  const assignment = {
    hours: 10,
    approvedHours: 8,
    hourlyCost: 25,
    adminApprovedAt: '2026-06-30T12:00:00Z',
    submittedAt: '2026-06-30T10:00:00Z',
  }

  assert.equal(getAnnualSummarySourceField(assignment), 'approvedHours')
  assert.equal(getAnnualSummaryHours(assignment), 8)
  assert.equal(getAnnualSummaryCost(assignment), 200)

  const contribution = summarizeAssignmentContribution(assignment)

  assert.equal(contribution.workDetailApprovedHours, 8)
  assert.equal(contribution.appearsInWorkDetailSummary, true)
})

test('resumo anual ignora afetacao com hours sem approvedHours', () => {
  const assignment = {
    hours: 10,
    approvedHours: null,
    hourlyCost: 25,
    adminApprovedAt: null,
    submittedAt: '2026-06-30T10:00:00Z',
  }

  assert.equal(getAnnualSummarySourceField(assignment), 'notApproved')
  assert.equal(getAnnualSummaryHours(assignment), 0)
  assert.equal(getAnnualSummaryCost(assignment), 0)

  const contribution = summarizeAssignmentContribution(assignment)

  assert.equal(contribution.workDetailApprovedHours, 0)
  assert.equal(contribution.appearsInWorkDetailSummary, false)
})

test('resumo anual e detalhe da obra usam a mesma regra de horas aprovadas', () => {
  const scenarios = [
    {
      hours: 10,
      approvedHours: null,
      adminApprovedAt: null,
      submittedAt: '2026-06-30T10:00:00Z',
      hourlyCost: 25,
    },
    {
      hours: 10,
      approvedHours: 8,
      adminApprovedAt: '2026-06-30T12:00:00Z',
      submittedAt: '2026-06-30T10:00:00Z',
      hourlyCost: 25,
    },
    {
      hours: 10,
      approvedHours: 6,
      adminApprovedAt: null,
      submittedAt: null,
      hourlyCost: 25,
    },
  ]

  scenarios.forEach(assignment => {
    assert.equal(getAnnualSummaryHours(assignment), getApprovedAssignmentHours(assignment))
  })
})

test('agrupamento mensal replica totais por mes e conta so horas aprovadas', () => {
  const rows = buildAnnualSummaryMonthlyTotals([
    {
      planDate: '2026-06-30',
      workId: 1,
      hours: 10,
      approvedHours: null,
      hourlyCost: 20,
    },
    {
      planDate: '2026-06-15',
      workId: 1,
      hours: 5,
      approvedHours: 4,
      hourlyCost: 20,
    },
    {
      planDate: '2026-07-01',
      workId: 2,
      hours: 7,
      approvedHours: null,
      hourlyCost: 30,
    },
  ], '2026')

  assert.equal(rows[5].monthKey, '2026-06')
  assert.equal(rows[5].totalHours, 4)
  assert.equal(rows[5].totalCost, 80)
  assert.equal(rows[5].workCount, 1)

  assert.equal(rows[6].monthKey, '2026-07')
  assert.equal(rows[6].totalHours, 0)
  assert.equal(rows[6].totalCost, 0)
  assert.equal(rows[6].workCount, 1)
})
