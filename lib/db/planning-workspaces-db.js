import { normalizeAssignmentPurpose } from '../assignment-purpose.js'
import {
  mapPersonRecord,
  mapPlanningWorkspaceRecord,
  mapWorkRecord,
  normalizePlanningPublicationState,
  toDateOnlyValue,
  toDateTimeString,
  toNumber,
  toPositiveInt,
  toRequiredString,
} from './core-mappers.js'
import { prisma } from '../prisma.js'

function getPlanningWorkspaceAssignmentIncludes() {
  return {
    person: true,
    work: {
      include: {
        company: true,
        client: true,
        workingDays: true,
        roleHourlyCosts: true,
        personHourlyCosts: true,
      },
    },
  }
}

function toOptionalDateTimeValue(value) {
  if (value === undefined) {
    return undefined
  }

  if (value === null || value === '') {
    return null
  }

  const candidate = value instanceof Date ? value : new Date(value)
  return Number.isNaN(candidate.getTime()) ? null : candidate
}

function toPlanningWorkspaceMutation(data = {}) {
  const mutation = {}

  if (data.companyId !== undefined) mutation.companyId = toPositiveInt(data.companyId, 1)
  if (data.date !== undefined) mutation.date = toDateOnlyValue(data.date)
  if (data.state !== undefined) {
    mutation.state = normalizePlanningPublicationState(data.state)
  }
  if (data.publishedWorkPlanId !== undefined) {
    mutation.publishedWorkPlanId = toPositiveInt(data.publishedWorkPlanId, null)
  }
  if (data.publishedAt !== undefined) {
    mutation.publishedAt = toOptionalDateTimeValue(data.publishedAt)
  }

  return mutation
}

function toPlanningWorkspaceAssignmentMutation(data = {}) {
  const mutation = {}

  if (data.workspaceId !== undefined) mutation.workspaceId = toPositiveInt(data.workspaceId)
  if (data.workId !== undefined) mutation.workId = toPositiveInt(data.workId)
  if (data.personId !== undefined) mutation.personId = toPositiveInt(data.personId)
  if (data.hourlyCost !== undefined) mutation.hourlyCost = toNumber(data.hourlyCost)
  if (data.manualHourlyCost !== undefined) mutation.manualHourlyCost = data.manualHourlyCost === true
  if (data.notes !== undefined) mutation.notes = toRequiredString(data.notes) || null
  if (data.hasWorkAccess !== undefined) mutation.hasWorkAccess = data.hasWorkAccess === true
  if (data.assignmentPurpose !== undefined) {
    mutation.assignmentPurpose = normalizeAssignmentPurpose(data.assignmentPurpose)
  }

  return mutation
}

function mapPlanningWorkspaceAssignmentRecord(record) {
  if (!record) {
    return null
  }

  return {
    id: Number(record.id),
    workspaceId: Number(record.workspaceId),
    workId: Number(record.workId),
    personId: Number(record.personId),
    hourlyCost: toNumber(record.hourlyCost),
    manualHourlyCost: record.manualHourlyCost === true,
    notes: toRequiredString(record.notes),
    hasWorkAccess: record.hasWorkAccess === true,
    assignmentPurpose: normalizeAssignmentPurpose(record.assignmentPurpose),
    createdAt: toDateTimeString(record.createdAt),
    updatedAt: toDateTimeString(record.updatedAt),
    person: record.person ? mapPersonRecord(record.person) : null,
    work: record.work ? mapWorkRecord(record.work) : null,
  }
}

export async function getPlanningWorkspaceByIdDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const workspace = await prisma.planningWorkspace.findUnique({
    where: { id: normalizedId },
  })

  return mapPlanningWorkspaceRecord(workspace)
}

export async function getAllPlanningWorkspacesDb(filters = {}) {
  const companyId = toPositiveInt(filters.companyId, null)

  const workspaces = await prisma.planningWorkspace.findMany({
    where: companyId ? { companyId } : undefined,
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  })

  return workspaces.map(mapPlanningWorkspaceRecord)
}

export async function getPlanningWorkspaceByDateDb(date, companyId) {
  const normalizedDate = toDateOnlyValue(date)
  const normalizedCompanyId = toPositiveInt(companyId, 1)

  if (!normalizedDate) {
    return null
  }

  const workspace = await prisma.planningWorkspace.findUnique({
    where: {
      companyId_date: {
        companyId: normalizedCompanyId,
        date: normalizedDate,
      },
    },
  })

  return mapPlanningWorkspaceRecord(workspace)
}

export async function createPlanningWorkspaceDb(data) {
  const workspace = await prisma.planningWorkspace.create({
    data: toPlanningWorkspaceMutation(data),
  })

  return mapPlanningWorkspaceRecord(workspace)
}

export async function updatePlanningWorkspaceDb(id, data) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const currentWorkspace = await prisma.planningWorkspace.findUnique({
    where: { id: normalizedId },
  })

  if (!currentWorkspace) {
    return null
  }

  const workspace = await prisma.planningWorkspace.update({
    where: { id: normalizedId },
    data: toPlanningWorkspaceMutation(data),
  })

  return mapPlanningWorkspaceRecord(workspace)
}

export async function getPlanningWorkspaceAssignmentsDb(filters = {}) {
  const workspaceId = toPositiveInt(filters.workspaceId)
  const workId = toPositiveInt(filters.workId)
  const personId = toPositiveInt(filters.personId)

  const assignments = await prisma.planningWorkspaceAssignment.findMany({
    where: {
      ...(workspaceId ? { workspaceId } : {}),
      ...(workId ? { workId } : {}),
      ...(personId ? { personId } : {}),
    },
    include: getPlanningWorkspaceAssignmentIncludes(),
    orderBy: [{ workspaceId: 'asc' }, { workId: 'asc' }, { id: 'asc' }],
  })

  return assignments.map(mapPlanningWorkspaceAssignmentRecord)
}

export async function getPlanningWorkspaceAssignmentByIdDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const assignment = await prisma.planningWorkspaceAssignment.findUnique({
    where: { id: normalizedId },
    include: getPlanningWorkspaceAssignmentIncludes(),
  })

  return mapPlanningWorkspaceAssignmentRecord(assignment)
}

export async function createPlanningWorkspaceAssignmentDb(data) {
  const assignment = await prisma.planningWorkspaceAssignment.create({
    data: toPlanningWorkspaceAssignmentMutation(data),
    include: getPlanningWorkspaceAssignmentIncludes(),
  })

  return mapPlanningWorkspaceAssignmentRecord(assignment)
}

export async function updatePlanningWorkspaceAssignmentDb(id, data) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const currentAssignment = await prisma.planningWorkspaceAssignment.findUnique({
    where: { id: normalizedId },
  })

  if (!currentAssignment) {
    return null
  }

  const assignment = await prisma.planningWorkspaceAssignment.update({
    where: { id: normalizedId },
    data: toPlanningWorkspaceAssignmentMutation(data),
    include: getPlanningWorkspaceAssignmentIncludes(),
  })

  return mapPlanningWorkspaceAssignmentRecord(assignment)
}

export async function deletePlanningWorkspaceAssignmentDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return false
  }

  try {
    await prisma.planningWorkspaceAssignment.delete({
      where: { id: normalizedId },
    })

    return true
  } catch {
    return false
  }
}

export async function deletePlanningWorkspaceAssignmentsByWorkspaceIdDb(workspaceId) {
  const normalizedWorkspaceId = toPositiveInt(workspaceId)

  if (!normalizedWorkspaceId) {
    return 0
  }

  const result = await prisma.planningWorkspaceAssignment.deleteMany({
    where: { workspaceId: normalizedWorkspaceId },
  })

  return Number(result.count || 0)
}
