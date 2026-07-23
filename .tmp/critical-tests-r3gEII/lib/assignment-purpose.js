export const ASSIGNMENT_PURPOSE_WORK = 'work'
export const ASSIGNMENT_PURPOSE_ACCESS = 'access'

const SUPPORTED_ASSIGNMENT_PURPOSES = new Set([
  ASSIGNMENT_PURPOSE_WORK,
  ASSIGNMENT_PURPOSE_ACCESS,
])

export function normalizeAssignmentPurpose(
  value,
  fallback = ASSIGNMENT_PURPOSE_WORK,
) {
  const normalizedValue = String(value || '').trim().toLowerCase()
  return SUPPORTED_ASSIGNMENT_PURPOSES.has(normalizedValue)
    ? normalizedValue
    : fallback
}

export function isAccessAssignmentPurpose(value) {
  return normalizeAssignmentPurpose(value) === ASSIGNMENT_PURPOSE_ACCESS
}

export function isAccessAssignment(assignment) {
  return isAccessAssignmentPurpose(assignment?.assignmentPurpose)
}

export function shouldAssignmentBehaveAsPlanningAssignment(assignment) {
  return !isAccessAssignment(assignment)
}

export function shouldAssignmentAppearInGeneratedMessage(assignment) {
  return shouldAssignmentBehaveAsPlanningAssignment(assignment)
}

export function getAssignmentPurposeLabel(value) {
  return isAccessAssignmentPurpose(value) ? 'Só acesso' : 'Trabalho'
}
