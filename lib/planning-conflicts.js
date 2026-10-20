import { getPersonDisplayName, getWorkDisplayName } from './display-names.js'
import { isChefRole } from './roles.js'

// Shared with the existing daily-plan warning: non-chefs in distinct works.
export function getPlanningAssignmentConflicts(assignments, activeWorksById = new Map()) {
  const peopleMap = new Map()

  assignments.forEach(assignment => {
    const personId = String(assignment.personId || '')
    if (!personId) return

    const existing = peopleMap.get(personId) || {
      personId,
      name: getPersonDisplayName(assignment.person, assignment.personId),
      role: assignment.person?.role || '',
      works: new Map(),
    }

    existing.name = getPersonDisplayName(assignment.person, assignment.personId) || existing.name
    existing.role = assignment.person?.role || existing.role
    existing.works.set(
      String(assignment.workId),
      getWorkDisplayName(
        assignment.work || activeWorksById.get(String(assignment.workId)),
        assignment.workId,
      ),
    )
    peopleMap.set(personId, existing)
  })

  return Array.from(peopleMap.values())
    .filter(person => !isChefRole(person.role) && person.works.size > 1)
    .map(person => ({
      personId: person.personId,
      name: person.name,
      workIds: Array.from(person.works.keys()),
      workNames: Array.from(person.works.values()).sort((left, right) =>
        String(left).localeCompare(String(right), 'pt-PT', { sensitivity: 'base' }),
      ),
    }))
    .sort((left, right) =>
      String(left.name).localeCompare(String(right.name), 'pt-PT', { sensitivity: 'base' }),
    )
}
