import {
  shouldAssignmentAppearInGeneratedMessage,
} from './assignment-purpose.js'
import { getPersonDisplayName } from './display-names.js'

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

export function buildPlanningMessagePreview({
  planningDate,
  groupedAssignments = [],
  selectedWorkIds = [],
} = {}) {
  if (!planningDate) {
    return ''
  }

  const selectedWorkIdSet = new Set((selectedWorkIds || []).map(toStringId).filter(Boolean))

  if (selectedWorkIdSet.size === 0) {
    return ''
  }

  const messageParts = groupedAssignments
    .filter(group => selectedWorkIdSet.has(toStringId(group?.workId)))
    .map(group => {
      const workId = toStringId(group?.workId)
      const filteredAssignments = filterPlanningMessageAssignmentsForWork({
        workId,
        assignments: group?.assignments || [],
      })

      const peopleLines = filteredAssignments
        .map(assignment => `- ${getPersonDisplayName(assignment?.person, assignment?.personId)}`)
        .join('\n')

      return peopleLines ? `${group.workName}\n${peopleLines}` : String(group.workName || `Obra ${workId}`)
    })

  if (messageParts.length === 0) {
    return ''
  }

  return [`Plano do dia ${planningDate}`, ...messageParts].join('\n\n')
}
