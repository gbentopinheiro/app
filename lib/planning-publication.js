import { resolveCompanyId } from './companies.js'
import { getDefaultHoursForDate } from './default-hours.js'
import { getAssignmentDefaultsData, getAllWorkAssignmentsData, updateWorkAssignmentPlanningData, createWorkAssignmentData } from './work-assignments.js'
import { getPersonByIdData } from './people.js'
import {
  PLANNING_WORKSPACE_STATE_DRAFT,
  PLANNING_WORKSPACE_STATE_PUBLISHED,
  createPlanningWorkspaceAssignmentData,
  createPlanningWorkspaceData,
  deletePlanningWorkspaceAssignmentData,
  getPlanningWorkspaceAssignmentByIdData,
  getPlanningWorkspaceAssignmentsData,
  getPlanningWorkspaceByDateData,
  getPlanningWorkspaceByIdData,
  replacePlanningWorkspaceAssignmentsData,
  resolveDraftChefAccessAssignments,
  updatePlanningWorkspaceAssignmentData,
  updatePlanningWorkspaceData,
} from './planning-workspaces.js'
import { isChefRole } from './roles.js'
import { getAllWorkPlansData, getWorkPlanByDateData, getWorkPlanByIdData, createWorkPlanData } from './work-plans.js'
import { getWorkByIdData } from './works.js'

function normalizeDate(date) {
  const value = String(date || '').trim()

  if (!value || Number.isNaN(new Date(value).getTime())) {
    throw new Error('date tem de ser uma data valida')
  }

  return value.slice(0, 10)
}

function getPlanningAssignmentKey(workId, personId) {
  return `${Number(workId)}:${Number(personId)}`
}

function ensureWorkspaceIsDraft(workspace) {
  if (!workspace || workspace.state === PLANNING_WORKSPACE_STATE_DRAFT) {
    return
  }

  throw new Error('O planeamento publicado tem de voltar a rascunho antes de ser editado')
}

function isPublishedPlanningAssignment(assignment) {
  return assignment?.planningVisible !== false
}

function hasCommittedHours(assignment) {
  return (
    assignment?.submitted === true ||
    Boolean(assignment?.submittedAt) ||
    assignment?.approvedHours !== undefined && assignment?.approvedHours !== null ||
    Boolean(assignment?.adminApprovedAt)
  )
}

function getHourlyCostForDraftAssignment(work, person, payload = {}) {
  if (payload.manualHourlyCost === true) {
    const manualHourlyCost = Number(payload.hourlyCost)

    if (!Number.isFinite(manualHourlyCost) || manualHourlyCost < 0) {
      throw new Error('hourlyCost nao pode ser negativo')
    }

    return manualHourlyCost
  }

  const specialPersonHourlyCost = work?.specialPersonHourlyCosts?.[String(person.id)]

  if (
    specialPersonHourlyCost !== undefined &&
    specialPersonHourlyCost !== null &&
    specialPersonHourlyCost !== ''
  ) {
    return Number(specialPersonHourlyCost)
  }

  const roleHourlyCost = work?.roleHourlyCosts?.[person.role]

  if (roleHourlyCost !== undefined && roleHourlyCost !== null && roleHourlyCost !== '') {
    return Number(roleHourlyCost)
  }

  return Number(work?.defaultHourlyCost ?? 0)
}

function toDraftSeedAssignment(assignment) {
  return {
    workId: Number(assignment.workId),
    personId: Number(assignment.personId),
    hourlyCost: Number(assignment.hourlyCost ?? 0),
    manualHourlyCost: assignment.manualHourlyCost === true,
    notes: assignment.notes || '',
    hasWorkAccess: assignment.hasWorkAccess === true,
  }
}

async function getPublishedAssignmentsForWorkPlan(workPlanId) {
  return (await getAllWorkAssignmentsData({ workPlanId })).filter(isPublishedPlanningAssignment)
}

async function ensureWorkspaceSeededFromPublishedPlan(date, companyId) {
  const existingWorkspace = await getPlanningWorkspaceByDateData(date, companyId)

  if (existingWorkspace) {
    return existingWorkspace
  }

  const publishedWorkPlan = await getWorkPlanByDateData(date, companyId)

  if (!publishedWorkPlan) {
    return null
  }

  const workspace = await createPlanningWorkspaceData({
    companyId,
    date,
    state: PLANNING_WORKSPACE_STATE_PUBLISHED,
    publishedWorkPlanId: publishedWorkPlan.id,
    publishedAt: null,
  })

  const publishedAssignments = await getPublishedAssignmentsForWorkPlan(publishedWorkPlan.id)
  await replacePlanningWorkspaceAssignmentsData(
    workspace.id,
    publishedAssignments.map(toDraftSeedAssignment),
  )

  return workspace
}

async function getWorkspaceOrBackfill(date, companyId) {
  return (await getPlanningWorkspaceByDateData(date, companyId)) ||
    (await ensureWorkspaceSeededFromPublishedPlan(date, companyId))
}

async function getLatestPreviousPublishedPlanWithAssignments(date, companyId) {
  const targetDate = new Date(`${normalizeDate(date)}T00:00:00.000Z`)
  const normalizedCompanyId = resolveCompanyId(companyId)
  const workPlans = await getAllWorkPlansData({ companyId: normalizedCompanyId })
  const orderedWorkPlans = workPlans
    .filter(workPlan => new Date(`${String(workPlan.date).slice(0, 10)}T00:00:00.000Z`) < targetDate)
    .sort((left, right) => String(right.date).localeCompare(String(left.date)))

  for (const workPlan of orderedWorkPlans) {
    const assignments = await getPublishedAssignmentsForWorkPlan(workPlan.id)

    if (assignments.length > 0) {
      return {
        workPlan,
        assignments,
      }
    }
  }

  return {
    workPlan: null,
    assignments: [],
  }
}

async function normalizeDraftChefAccessForWorkspace(workspaceId, workId, preferredAssignmentId = null) {
  const workspaceAssignments = await getPlanningWorkspaceAssignmentsData({
    workspaceId,
    workId,
  })
  const chefAssignments = resolveDraftChefAccessAssignments(workspaceAssignments, workId)

  if (chefAssignments.length === 0) {
    return workspaceAssignments
  }

  const preferredChefAssignment = preferredAssignmentId
    ? chefAssignments.find(item => Number(item.id) === Number(preferredAssignmentId))
    : null
  const explicitChefAssignment = chefAssignments.find(item => item.hasWorkAccess === true)
  const selectedChefAssignment = preferredChefAssignment || explicitChefAssignment || chefAssignments[0]

  for (const assignment of chefAssignments) {
    const shouldHaveAccess = Number(assignment.id) === Number(selectedChefAssignment.id)

    if (assignment.hasWorkAccess === shouldHaveAccess) {
      continue
    }

    await updatePlanningWorkspaceAssignmentData(assignment.id, {
      hasWorkAccess: shouldHaveAccess,
    })
  }

  return getPlanningWorkspaceAssignmentsData({ workspaceId })
}

async function buildPlanningWorkspaceView(date, companyId) {
  const workspace = await getWorkspaceOrBackfill(date, companyId)
  const defaults = await getAssignmentDefaultsData()

  if (!workspace) {
    return {
      workspace: null,
      items: [],
      defaults: {
        people: defaults.people || [],
        works: defaults.works || [],
      },
    }
  }

  return {
    workspace,
    items: await getPlanningWorkspaceAssignmentsData({ workspaceId: workspace.id }),
    defaults: {
      people: defaults.people || [],
      works: defaults.works || [],
    },
  }
}

async function ensureDraftWorkspacePersonAndWork(workspace, { workId, personId }) {
  const [work, person] = await Promise.all([
    getWorkByIdData(workId),
    getPersonByIdData(personId),
  ])

  if (!work) {
    throw new Error('Obra nao encontrada')
  }

  if (!person) {
    throw new Error('Pessoa nao encontrada')
  }

  if (Number(work.companyId) !== Number(workspace.companyId)) {
    throw new Error('A obra tem de pertencer à mesma empresa do rascunho')
  }

  if (Number(person.companyId) !== Number(workspace.companyId)) {
    throw new Error('A pessoa tem de pertencer à mesma empresa do rascunho')
  }

  return { work, person }
}

export async function getPlanningWorkspaceViewData({ date, companyId } = {}) {
  return buildPlanningWorkspaceView(normalizeDate(date), resolveCompanyId(companyId))
}

export async function initializePlanningWorkspaceDraftData({
  date,
  companyId,
  clonePreviousDay = false,
} = {}) {
  const normalizedDate = normalizeDate(date)
  const normalizedCompanyId = resolveCompanyId(companyId)
  const existingWorkspace = await getWorkspaceOrBackfill(normalizedDate, normalizedCompanyId)
  const workspace =
    existingWorkspace ||
    (await createPlanningWorkspaceData({
      companyId: normalizedCompanyId,
      date: normalizedDate,
      state: PLANNING_WORKSPACE_STATE_DRAFT,
      publishedWorkPlanId: null,
      publishedAt: null,
    }))

  let sourceAssignments = []
  let clonedFromDate = null

  if (clonePreviousDay) {
    const previousPublished = await getLatestPreviousPublishedPlanWithAssignments(
      normalizedDate,
      normalizedCompanyId,
    )

    if (!previousPublished.workPlan) {
      throw new Error('Nao existe nenhum planeamento publicado anterior com afetacoes para copiar')
    }

    sourceAssignments = previousPublished.assignments.map(toDraftSeedAssignment)
    clonedFromDate = previousPublished.workPlan.date
  }

  const currentAssignments = await getPlanningWorkspaceAssignmentsData({ workspaceId: workspace.id })
  const nextAssignments = clonePreviousDay ? sourceAssignments : []

  await replacePlanningWorkspaceAssignmentsData(workspace.id, nextAssignments)
  const updatedWorkspace = await updatePlanningWorkspaceData(workspace.id, {
    state: PLANNING_WORKSPACE_STATE_DRAFT,
  })

  return {
    workspace: updatedWorkspace,
    clonedAssignments: sourceAssignments.length,
    clonedFromDate,
    clearedAssignments: clonePreviousDay ? 0 : currentAssignments.length,
    reusedWorkspace: Boolean(existingWorkspace),
    items: await getPlanningWorkspaceAssignmentsData({ workspaceId: workspace.id }),
  }
}

export async function setPlanningWorkspaceToDraftData(workspaceId) {
  const workspace = await getPlanningWorkspaceByIdData(workspaceId)

  if (!workspace) {
    throw new Error('Rascunho de planeamento não encontrado')
  }

  const currentAssignments = await getPlanningWorkspaceAssignmentsData({ workspaceId: workspace.id })

  if (currentAssignments.length === 0 && workspace.publishedWorkPlanId) {
    const publishedAssignments = await getPublishedAssignmentsForWorkPlan(workspace.publishedWorkPlanId)
    await replacePlanningWorkspaceAssignmentsData(
      workspace.id,
      publishedAssignments.map(toDraftSeedAssignment),
    )
  }

  return updatePlanningWorkspaceData(workspace.id, {
    state: PLANNING_WORKSPACE_STATE_DRAFT,
  })
}

export async function createPlanningDraftAssignmentData(workspaceId, payload = {}) {
  const workspace = await getPlanningWorkspaceByIdData(workspaceId)

  if (!workspace) {
    throw new Error('Rascunho de planeamento não encontrado')
  }

  ensureWorkspaceIsDraft(workspace)

  const workId = Number(payload.workId)
  const personId = Number(payload.personId)

  if (!workId || !personId) {
    throw new Error('workId e personId sao obrigatorios')
  }

  const { work, person } = await ensureDraftWorkspacePersonAndWork(workspace, { workId, personId })
  const assignment = await createPlanningWorkspaceAssignmentData({
    workspaceId: workspace.id,
    workId,
    personId,
    hourlyCost: getHourlyCostForDraftAssignment(work, person, payload),
    manualHourlyCost: payload.manualHourlyCost === true,
    notes: payload.notes,
    hasWorkAccess: payload.hasWorkAccess === true,
  })

  await updatePlanningWorkspaceData(workspace.id, {
    state: PLANNING_WORKSPACE_STATE_DRAFT,
  })
  await normalizeDraftChefAccessForWorkspace(workspace.id, workId, assignment.id)

  return getPlanningWorkspaceAssignmentByIdData(assignment.id)
}

export async function updatePlanningDraftAssignmentData(assignmentId, payload = {}) {
  const currentAssignment = await getPlanningWorkspaceAssignmentByIdData(assignmentId)

  if (!currentAssignment) {
    throw new Error('Afetação de rascunho não encontrada')
  }

  const workspace = await getPlanningWorkspaceByIdData(currentAssignment.workspaceId)

  if (!workspace) {
    throw new Error('Rascunho de planeamento não encontrado')
  }

  ensureWorkspaceIsDraft(workspace)

  const workId = payload.workId !== undefined ? Number(payload.workId) : Number(currentAssignment.workId)
  const personId =
    payload.personId !== undefined ? Number(payload.personId) : Number(currentAssignment.personId)
  const { work, person } = await ensureDraftWorkspacePersonAndWork(workspace, { workId, personId })

  const updatedAssignment = await updatePlanningWorkspaceAssignmentData(assignmentId, {
    workId,
    personId,
    hourlyCost:
      payload.hourlyCost !== undefined || payload.manualHourlyCost !== undefined || payload.workId !== undefined || payload.personId !== undefined
        ? getHourlyCostForDraftAssignment(work, person, {
            ...currentAssignment,
            ...payload,
          })
        : currentAssignment.hourlyCost,
    manualHourlyCost:
      payload.manualHourlyCost !== undefined
        ? payload.manualHourlyCost === true
        : currentAssignment.manualHourlyCost === true,
    notes: payload.notes !== undefined ? payload.notes : currentAssignment.notes,
    hasWorkAccess:
      payload.hasWorkAccess !== undefined
        ? payload.hasWorkAccess === true
        : currentAssignment.hasWorkAccess === true,
  })

  await updatePlanningWorkspaceData(workspace.id, {
    state: PLANNING_WORKSPACE_STATE_DRAFT,
  })
  await normalizeDraftChefAccessForWorkspace(workspace.id, currentAssignment.workId)

  if (Number(workId) !== Number(currentAssignment.workId)) {
    await normalizeDraftChefAccessForWorkspace(workspace.id, workId, updatedAssignment?.id)
  } else {
    await normalizeDraftChefAccessForWorkspace(workspace.id, workId, updatedAssignment?.id)
  }

  return getPlanningWorkspaceAssignmentByIdData(assignmentId)
}

export async function deletePlanningDraftAssignmentData(assignmentId) {
  const currentAssignment = await getPlanningWorkspaceAssignmentByIdData(assignmentId)

  if (!currentAssignment) {
    return false
  }

  const workspace = await getPlanningWorkspaceByIdData(currentAssignment.workspaceId)

  if (!workspace) {
    throw new Error('Rascunho de planeamento não encontrado')
  }

  ensureWorkspaceIsDraft(workspace)

  const deleted = await deletePlanningWorkspaceAssignmentData(assignmentId)

  if (!deleted) {
    return false
  }

  await normalizeDraftChefAccessForWorkspace(currentAssignment.workspaceId, currentAssignment.workId)
  await updatePlanningWorkspaceData(currentAssignment.workspaceId, {
    state: PLANNING_WORKSPACE_STATE_DRAFT,
  })

  return true
}

export async function publishPlanningWorkspaceData(workspaceId) {
  const workspace = await getPlanningWorkspaceByIdData(workspaceId)

  if (!workspace) {
    throw new Error('Rascunho de planeamento não encontrado')
  }

  ensureWorkspaceIsDraft(workspace)

  const draftAssignments = await getPlanningWorkspaceAssignmentsData({ workspaceId: workspace.id })
  const currentPublishedWorkPlan =
    (workspace.publishedWorkPlanId && (await getWorkPlanByIdData(workspace.publishedWorkPlanId))) ||
    (await getWorkPlanByDateData(workspace.date, workspace.companyId))
  const publishedWorkPlan =
    currentPublishedWorkPlan ||
    (await createWorkPlanData({
      companyId: workspace.companyId,
      date: workspace.date,
    }))
  const officialAssignments = await getAllWorkAssignmentsData({ workPlanId: publishedWorkPlan.id })
  const officialAssignmentsByKey = new Map(
    officialAssignments.map(assignment => [
      getPlanningAssignmentKey(assignment.workId, assignment.personId),
      assignment,
    ]),
  )
  const desiredAssignmentKeys = new Set(
    draftAssignments.map(assignment => getPlanningAssignmentKey(assignment.workId, assignment.personId)),
  )

  for (const officialAssignment of officialAssignments) {
    const key = getPlanningAssignmentKey(officialAssignment.workId, officialAssignment.personId)

    if (desiredAssignmentKeys.has(key)) {
      continue
    }

    if (
      officialAssignment.planningVisible === false &&
      officialAssignment.hasWorkAccess === false
    ) {
      continue
    }

    await updateWorkAssignmentPlanningData(officialAssignment.id, {
      hasWorkAccess: false,
      planningVisible: false,
    })
  }

  for (const draftAssignment of draftAssignments) {
    const key = getPlanningAssignmentKey(draftAssignment.workId, draftAssignment.personId)
    const officialAssignment = officialAssignmentsByKey.get(key)

    if (!officialAssignment) {
      await createWorkAssignmentData({
        workPlanId: publishedWorkPlan.id,
        workId: draftAssignment.workId,
        personId: draftAssignment.personId,
        hours: getDefaultHoursForDate(workspace.date),
        hourlyCost: draftAssignment.hourlyCost,
        manualHourlyCost: draftAssignment.manualHourlyCost === true,
        notes: draftAssignment.notes,
        hasWorkAccess: draftAssignment.hasWorkAccess === true,
        planningVisible: true,
      })
      continue
    }

    const planningMutation = {
      notes: draftAssignment.notes,
      hasWorkAccess: draftAssignment.hasWorkAccess === true,
      planningVisible: true,
    }

    if (!hasCommittedHours(officialAssignment)) {
      planningMutation.hourlyCost = draftAssignment.hourlyCost
      planningMutation.manualHourlyCost = draftAssignment.manualHourlyCost === true
    }

    await updateWorkAssignmentPlanningData(officialAssignment.id, planningMutation)
  }

  return updatePlanningWorkspaceData(workspace.id, {
    state: PLANNING_WORKSPACE_STATE_PUBLISHED,
    publishedWorkPlanId: publishedWorkPlan.id,
    publishedAt: new Date().toISOString(),
  })
}
