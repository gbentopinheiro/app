export function hasApprovedHoursValue(assignment) {
  return assignment?.approvedHours !== null && assignment?.approvedHours !== undefined
}

export function isAssignmentApproved(assignment) {
  if (!assignment) return false

  return Boolean(assignment.adminApprovedAt) || (hasApprovedHoursValue(assignment) && !assignment.submittedAt)
}

export function getApprovedAssignmentHours(assignment) {
  if (!isAssignmentApproved(assignment)) {
    return 0
  }

  const approvedHours = Number(assignment?.approvedHours)
  return Number.isFinite(approvedHours) ? approvedHours : 0
}

export function getApprovedAssignmentTotalCost(assignment) {
  const approvedHours = getApprovedAssignmentHours(assignment)
  const hourlyCost = Number(assignment?.hourlyCost)

  if (!Number.isFinite(hourlyCost) || approvedHours <= 0) {
    return 0
  }

  return Number((approvedHours * hourlyCost).toFixed(2))
}
