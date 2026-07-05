import { getPersonDisplayName } from './display-names.js'
import { isChefRole } from './roles.js'

function toStringId(value) {
  return String(value ?? '').trim()
}

function sortByLocaleLabel(left, right) {
  return String(left).localeCompare(String(right), 'pt-PT', { sensitivity: 'base' })
}

export function getDuplicatedChefAssignmentsForMessage(groupedAssignments = []) {
  const chefMap = new Map()

  for (const group of groupedAssignments) {
    const workId = toStringId(group?.workId)

    if (!workId) {
      continue
    }

    for (const assignment of group?.assignments || []) {
      if (!isChefRole(assignment?.person?.role)) {
        continue
      }

      const personId = toStringId(assignment?.personId ?? assignment?.person?.id)

      if (!personId) {
        continue
      }

      const existing = chefMap.get(personId) || {
        personId,
        name: getPersonDisplayName(assignment?.person, assignment?.personId),
        works: new Map(),
      }

      existing.name = getPersonDisplayName(assignment?.person, assignment?.personId) || existing.name
      existing.works.set(workId, {
        workId,
        workName: group?.workName || `Obra ${workId}`,
      })
      chefMap.set(personId, existing)
    }
  }

  return Array.from(chefMap.values())
    .filter(person => person.works.size > 1)
    .map(person => ({
      personId: person.personId,
      name: person.name,
      works: Array.from(person.works.values()).sort((left, right) =>
        sortByLocaleLabel(left.workName, right.workName),
      ),
    }))
    .sort((left, right) => sortByLocaleLabel(left.name, right.name))
}

export function createDuplicateChefMessageSelectionMap(duplicatedChefAssignments = []) {
  return duplicatedChefAssignments.reduce((selectionMap, person) => {
    selectionMap[person.personId] = person.works.map(work => toStringId(work.workId))
    return selectionMap
  }, {})
}

export function buildPlanningMessagePreview({
  planningDate,
  groupedAssignments = [],
  selectedWorkIds = [],
  duplicateChefSelections = {},
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
      const filteredAssignments = (group?.assignments || []).filter(assignment => {
        const personId = toStringId(assignment?.personId ?? assignment?.person?.id)
        const selectedChefWorkIds = duplicateChefSelections?.[personId]

        if (!Array.isArray(selectedChefWorkIds) || !isChefRole(assignment?.person?.role)) {
          return true
        }

        return selectedChefWorkIds.includes(workId)
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
