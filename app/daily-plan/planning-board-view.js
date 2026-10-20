import { getPersonDisplayName, getWorkDisplayReference } from '../../lib/display-names.js'
import { getEntityRoleLabel, isWorkerRole } from '../../lib/roles.js'

export function getAdjacentPlanningDate(value, offset) {
  const [year, month, day] = String(value).split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + offset, 12))
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10)
}

export function getPlanningDateFromSearch(search) {
  const value = new URLSearchParams(search).get('date') || ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null
}

export function groupPlanningClients(groupedAssignments, works, unplannedWorks = [], conflictPersonIds = new Set()) {
  const worksById = new Map(works.map(work => [String(work.id), work]))
  const clients = new Map()
  const entries = [
    ...groupedAssignments.map(group => ({ ...group, unplanned: false })),
    ...unplannedWorks.map(work => ({ workId: work.id, workName: work.name, assignments: [], unplanned: true })),
  ]

  for (const entry of entries) {
    const work = worksById.get(String(entry.workId)) || entry.assignments[0]?.work || {}
    const key = work.clientId != null ? String(work.clientId) : 'unlinked'
    if (!clients.has(key)) {
      clients.set(key, {
        key,
        name: work.clientName || work.client?.name || 'Cliente não identificado',
        works: [],
        workerIds: new Set(),
        hasConflicts: false,
      })
    }
    const client = clients.get(key)
    client.works.push({ ...entry, work })
    for (const assignment of entry.assignments) {
      if (conflictPersonIds.has(String(assignment.personId))) client.hasConflicts = true
      if (assignment.personId != null && assignment.person?.role && isWorkerRole(assignment.person.role)) {
        client.workerIds.add(String(assignment.personId))
      }
    }
  }

  return Array.from(clients.values())
    .map(({ workerIds, ...client }) => ({
      ...client,
      workCount: client.works.length,
      workerCount: workerIds.size,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-PT', { sensitivity: 'base' }))
}

function normalizeSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-PT').trim()
}

export function filterUnassignedPeople(people, { query = '', role = 'all' } = {}) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean)
  if (role === 'all' && terms.length === 0) return people

  return people.filter(person => {
    if (role !== 'all' && person.role !== role) return false
    const text = normalizeSearch(`${getPersonDisplayName(person, person.id)} ${getEntityRoleLabel(person)}`)
    return terms.every(term => text.includes(term))
  })
}

export function filterPlanningClients(clients, query) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return clients

  return clients.map(client => ({
    ...client,
    works: client.works.filter(entry => {
      const text = normalizeSearch([
        client.name,
        entry.workName,
        getWorkDisplayReference(entry.work, entry.workId),
        ...entry.assignments.map(assignment => getPersonDisplayName(assignment.person, assignment.personId)),
      ].join(' '))
      return terms.every(term => text.includes(term))
    }),
  })).filter(client => client.works.length > 0)
}
