import {
  shouldAssignmentAppearInGeneratedMessage,
} from './assignment-purpose.js'
import { getPersonDisplayName, getWorkDisplayName } from './display-names.js'
import { getPreviousPlanningDateValue } from './planning-date.js'

function toStringId(value) {
  return String(value ?? '').trim()
}

function sortByLocaleLabel(left, right) {
  return String(left).localeCompare(String(right), 'pt-PT', { sensitivity: 'base' })
}

export function getDuplicatedChefAssignmentsForMessage(groupedAssignments = []) {
  return []
}

export function createDuplicateChefMessageSelectionMap(duplicatedChefAssignments = []) {
  return {}
}

export function filterPlanningMessageAssignmentsForWork({
  workId,
  assignments = [],
} = {}) {
  return (assignments || []).filter(assignment => {
    return shouldAssignmentAppearInGeneratedMessage(assignment)
  })
}

export function getSelectedPlanningMessageGroups({ groupedAssignments = [], selectedWorkIds = [] } = {}) {
  const selectedWorkIdSet = new Set(selectedWorkIds.map(toStringId).filter(Boolean))
  return groupedAssignments
    .filter(group => selectedWorkIdSet.has(toStringId(group?.workId)))
    .map(group => ({
      ...group,
      assignments: filterPlanningMessageAssignmentsForWork({ workId: group.workId, assignments: group.assignments || [] }),
    }))
}

function getMessageAssignmentKey(assignment) {
  return JSON.stringify([toStringId(assignment.personId), toStringId(assignment.workId)])
}

export const PLANNING_CHANGE_LABELS = Object.freeze({ changed: 'Alterado', new: 'Novo', removed: 'Removido' })

export function getPlanningPersonChangeStatus(changes, personId) {
  const id = toStringId(personId)
  return changes?.newPersonIds.has(id) ? 'new' : changes?.changedPersonIds.has(id) ? 'changed' : ''
}

function formatMessagePerson(assignment, status) {
  const name = getPersonDisplayName(assignment?.person, assignment?.personId)
  const label = PLANNING_CHANGE_LABELS[status]
  return label ? `${name} [${label.toUpperCase()}]` : name
}

export function comparePlanningMessageAssignments({ planningDate, assignments = [], previousDaySnapshot } = {}) {
  const changedPersonIds = new Set()
  const newPersonIds = new Set()
  const removedAssignments = []
  const previousDate = getPreviousPlanningDateValue(planningDate)
  if (!previousDate || previousDaySnapshot?.date !== previousDate || !Array.isArray(previousDaySnapshot.assignments)) {
    return { changedPersonIds, newPersonIds, removedAssignments }
  }

  const visibleAssignments = items => items.filter(assignment =>
    assignment.planningVisible !== false && shouldAssignmentAppearInGeneratedMessage(assignment),
  )
  const current = new Map(visibleAssignments(assignments).map(assignment => [getMessageAssignmentKey(assignment), assignment]))
  const previous = new Map(visibleAssignments(previousDaySnapshot.assignments).map(assignment => [getMessageAssignmentKey(assignment), assignment]))
  const previousPersonIds = new Set([...previous.values()].map(assignment => toStringId(assignment.personId)))
  const currentPersonIds = new Set([...current.values()].map(assignment => toStringId(assignment.personId)))

  for (const [key, assignment] of current) {
    const personId = toStringId(assignment.personId)
    if (!previousPersonIds.has(personId)) {
      newPersonIds.add(personId)
    } else if (!previous.has(key)) {
      changedPersonIds.add(personId)
    }
  }
  for (const [key, assignment] of previous) {
    if (!current.has(key)) {
      const personId = toStringId(assignment.personId)
      if (currentPersonIds.has(personId)) changedPersonIds.add(personId)
      removedAssignments.push(assignment)
    }
  }
  return { changedPersonIds, newPersonIds, removedAssignments }
}

export function buildPlanningMessagePreview({
  planningDate,
  groupedAssignments = [],
  selectedWorkIds = [],
  changes,
} = {}) {
  if (!planningDate) {
    return ''
  }

  const messageParts = getSelectedPlanningMessageGroups({ groupedAssignments, selectedWorkIds: selectedWorkIds || [] })
    .map(group => {
      const workId = toStringId(group?.workId)
      const peopleLines = group.assignments
        .map(assignment => `- ${formatMessagePerson(assignment, getPlanningPersonChangeStatus(changes, assignment.personId))}`)
        .join('\n')

      return peopleLines ? `${group.workName}\n${peopleLines}` : String(group.workName || `Obra ${workId}`)
    })

  if (changes?.removedAssignments.length > 0) {
    const removedLines = changes.removedAssignments.map(assignment =>
      `- ${formatMessagePerson(assignment, 'removed')} · Removido de ${getWorkDisplayName(assignment.work, assignment.workId)}`,
    )
    messageParts.push(['Removidos de obras face ao dia anterior', ...removedLines].join('\n'))
  }

  if (messageParts.length === 0) {
    return ''
  }

  return [`Plano do dia ${planningDate}`, ...messageParts].join('\n\n')
}
