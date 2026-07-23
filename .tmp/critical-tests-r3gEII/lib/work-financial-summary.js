import { getApprovedAssignmentHours, isAssignmentApproved } from './work-assignment-approval.js'

export function getFinancialSummaryHours(assignment) {
  return getApprovedAssignmentHours(assignment)
}

export function getFinancialSummaryCost(assignment) {
  const approvedHours = getFinancialSummaryHours(assignment)
  const hourlyCost = Number(assignment?.hourlyCost)

  if (!Number.isFinite(hourlyCost) || approvedHours <= 0) {
    return 0
  }

  return Number((approvedHours * hourlyCost).toFixed(2))
}

export function getFinancialSummarySourceField(assignment) {
  return isAssignmentApproved(assignment) ? 'approvedHours' : 'notApproved'
}
