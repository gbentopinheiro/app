import { canAccessAssignmentsOverview, canManageEntireApp } from './auth.js'
import { shouldAssignmentBehaveAsPlanningAssignment } from './assignment-purpose.js'
import { buildChefPreviewSession, getChefPreviewIdentity } from './chef-preview.js'
import { isChefRole } from './roles.js'
import { getAllWorkAssignmentsData, isAssignmentOperationallyVisible } from './work-assignments.js'
import { getWorkPlanByIdData } from './work-plans.js'

export function canAccessWork(session, workId) {
  if (!session) return false
  if (canManageEntireApp(session.role)) return true
  return session.workIds.includes(Number(workId))
}

export function canAccessAssignment(session, assignment) {
  if (!session || !assignment) return false
  return canAccessWork(session, assignment.workId)
}

export function canAccessAssignmentsRoute(session) {
  if (!session) return false
  return canManageEntireApp(session.role) || isChefRole(session.role)
}

export async function resolvePreviewScopedSession(session, searchParams) {
  if (!session || !canManageEntireApp(session.role)) {
    return session
  }

  const previewPersonId = searchParams.get('previewPersonId')
  const previewChef = searchParams.get('previewChef')

  if (!previewPersonId && !previewChef) {
    return session
  }

  const previewIdentity = await getChefPreviewIdentity({
    personId: previewPersonId,
    username: previewChef,
  })

  return buildChefPreviewSession(previewIdentity) || session
}

export function filterAssignmentsForSession(assignments, session) {
  const visibleAssignments = (Array.isArray(assignments) ? assignments : []).filter(
    isAssignmentOperationallyVisible,
  ).filter(shouldAssignmentBehaveAsPlanningAssignment)

  if (!session || canAccessAssignmentsOverview(session.role)) {
    return visibleAssignments
  }

  return visibleAssignments
    .filter(assignment => canAccessWork(session, assignment.workId))
}

export function filterDefaultsForSession(defaults, session) {
  if (!session || canAccessAssignmentsOverview(session.role)) {
    return defaults
  }

  return {
    ...defaults,
    works: defaults.works.filter(work => canAccessWork(session, work.id)),
  }
}

export async function getChefReferenceAssignments(session, filters = {}) {
  if (!session || !isChefRole(session.role)) {
    return []
  }

  const scopedFilters = {}

  if (filters.workPlanId) {
    scopedFilters.workPlanId = filters.workPlanId
  } else if (filters.date) {
    scopedFilters.date = filters.date
  }

  if (!scopedFilters.workPlanId && !scopedFilters.date) {
    return []
  }

  return filterAssignmentsForSession(await getAllWorkAssignmentsData(scopedFilters), session)
}

export function buildPlannedPeopleByWork(assignments) {
  const groupedPeople = new Map()

  assignments.forEach(assignment => {
    const workId = Number(assignment.workId)
    const personId = Number(assignment.person?.id || assignment.personId)

    if (!workId || !personId || !assignment.person) {
      return
    }

    const currentWorkPeople = groupedPeople.get(workId) || new Map()

    currentWorkPeople.set(personId, {
      id: assignment.person.id,
      name: assignment.person.name,
      defaultHourlyPrice: assignment.person.defaultHourlyPrice,
    })

    groupedPeople.set(workId, currentWorkPeople)
  })

  return Object.fromEntries(
    Array.from(groupedPeople.entries()).map(([workId, peopleMap]) => [
      String(workId),
      Array.from(peopleMap.values()).sort((left, right) => left.name.localeCompare(right.name)),
    ]),
  )
}

export async function extendDefaultsForChef(defaults, session, filters = {}) {
  const nextDefaults = filterDefaultsForSession(defaults, session)
  const referenceAssignments = await getChefReferenceAssignments(session, filters)
  const plannedPeopleByWork = buildPlannedPeopleByWork(referenceAssignments)

  return {
    ...nextDefaults,
    plannedPeopleByWork,
    restrictPeopleByWork: true,
  }
}

export async function isChefPersonAllowedForWork(session, { workPlanId, date, workId, personId }) {
  if (!session || !isChefRole(session.role)) {
    return true
  }

  const referenceAssignments = await getChefReferenceAssignments(session, { workPlanId, date })

  return referenceAssignments.some(
    assignment =>
      Number(assignment.workId) === Number(workId) &&
      Number(assignment.personId) === Number(personId),
  )
}

export async function resolveDailyPlanDate({ workPlanId, date }) {
  if (date) {
    return date
  }

  if (!workPlanId) {
    return null
  }

  return (await getWorkPlanByIdData(workPlanId))?.date || null
}

export function isDailyPlanStructureUpdate(body) {
  return (
    body.workPlanId !== undefined ||
    body.workId !== undefined ||
    body.personId !== undefined ||
    body.date !== undefined ||
    body.hourlyCost !== undefined ||
    body.notes !== undefined ||
    body.manualHourlyCost !== undefined ||
    body.assignmentPurpose !== undefined ||
    body.hasWorkAccess !== undefined
  )
}
