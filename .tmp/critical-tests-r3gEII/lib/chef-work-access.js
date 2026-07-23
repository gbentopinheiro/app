import { shouldAssignmentBehaveAsPlanningAssignment } from './assignment-purpose.js'
import { isChefRole } from './roles.js'

function resolveAssignmentDate(assignment) {
  return String(assignment?.date || assignment?.workPlan?.date || '')
}

function resolveAssignmentRole(assignment, personResolver = null) {
  return assignment?.person?.role || personResolver?.(assignment?.personId)?.role || null
}

function buildChefAssignmentsByPlanWork(assignments, personResolver = null) {
  const chefAssignmentsByPlanWork = new Map()

  ;(Array.isArray(assignments) ? assignments : []).forEach(assignment => {
    if (
      !isChefRole(resolveAssignmentRole(assignment, personResolver)) ||
      assignment?.planningVisible === false ||
      !shouldAssignmentBehaveAsPlanningAssignment(assignment)
    ) {
      return
    }

    const key = `${Number(assignment.workPlanId)}:${Number(assignment.workId)}`
    const currentAssignments = chefAssignmentsByPlanWork.get(key) || []
    currentAssignments.push(assignment)
    chefAssignmentsByPlanWork.set(key, currentAssignments)
  })

  return chefAssignmentsByPlanWork
}

function sortChefAssignmentKeys(chefAssignmentsByPlanWork) {
  return Array.from(chefAssignmentsByPlanWork.keys()).sort((left, right) => {
    const leftAssignments = chefAssignmentsByPlanWork.get(left) || []
    const rightAssignments = chefAssignmentsByPlanWork.get(right) || []
    const leftDate = resolveAssignmentDate(leftAssignments[0])
    const rightDate = resolveAssignmentDate(rightAssignments[0])
    const [leftWorkPlanId, leftWorkId] = left.split(':').map(Number)
    const [rightWorkPlanId, rightWorkId] = right.split(':').map(Number)

    return (
      leftDate.localeCompare(rightDate, 'pt-PT') ||
      leftWorkPlanId - rightWorkPlanId ||
      leftWorkId - rightWorkId
    )
  })
}

function toSortedChefAssignments(assignments = []) {
  return [...assignments].sort((left, right) => Number(left.id) - Number(right.id))
}

export function buildResolvedChefWorkAccessMap(assignments, personResolver = null) {
  const chefAssignmentsByPlanWork = buildChefAssignmentsByPlanWork(assignments, personResolver)
  const sortedKeys = sortChefAssignmentKeys(chefAssignmentsByPlanWork)
  const resolvedChefAccessMap = new Map()
  const previousChefByWorkId = new Map()

  sortedKeys.forEach(key => {
    const [, workId] = key.split(':').map(Number)
    const chefAssignments = toSortedChefAssignments(chefAssignmentsByPlanWork.get(key) || [])

    if (chefAssignments.length === 0) {
      return
    }

    const explicitAssignment = chefAssignments.find(
      assignment => assignment.hasWorkAccess === true,
    )
    const previousChefPersonId = previousChefByWorkId.get(String(workId))
    const previousChefAssignment = previousChefPersonId
      ? chefAssignments.find(
          assignment => Number(assignment.personId) === Number(previousChefPersonId),
        )
      : null
    const selectedAssignment =
      explicitAssignment || previousChefAssignment || chefAssignments[0]

    resolvedChefAccessMap.set(key, Number(selectedAssignment.id))
    previousChefByWorkId.set(String(workId), Number(selectedAssignment.personId))
  })

  return resolvedChefAccessMap
}

export function getChefAssignmentsGrantingWorkAccess(assignments, personResolver = null) {
  const chefAssignmentsByPlanWork = buildChefAssignmentsByPlanWork(assignments, personResolver)
  const sortedKeys = sortChefAssignmentKeys(chefAssignmentsByPlanWork)
  const grantingAssignments = []
  const seenAssignmentIds = new Set()

  sortedKeys.forEach(key => {
    const chefAssignments = toSortedChefAssignments(chefAssignmentsByPlanWork.get(key) || [])

    chefAssignments.forEach(assignment => {
      if (seenAssignmentIds.has(Number(assignment.id))) {
        return
      }

      grantingAssignments.push(assignment)
      seenAssignmentIds.add(Number(assignment.id))
    })
  })

  return grantingAssignments
}
