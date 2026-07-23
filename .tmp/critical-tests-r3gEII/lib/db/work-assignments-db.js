import { normalizeAssignmentPurpose } from '../assignment-purpose.js'
import { CHEF_ROLE_VALUES } from '../roles.js'
import { prisma } from '../prisma.js'
import {
  mapPersonRecord,
  mapWorkPlanRecord,
  mapWorkRecord,
  toDateOnlyValue,
  toDateTimeString,
  toNumber,
  toPositiveInt,
  toRequiredString,
} from './core-mappers.js'

function getWorkAssignmentIncludes() {
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
    workPlan: true,
    submittedByUser: {
      select: {
        id: true,
        username: true,
        name: true,
      },
    },
    approvedByUser: {
      select: {
        id: true,
        username: true,
        name: true,
      },
    },
  }
}

function toOptionalDecimal(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  return toNumber(value, null)
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

function toWorkAssignmentMutation(data = {}) {
  const mutation = {}

  if (data.workPlanId !== undefined) mutation.workPlanId = toPositiveInt(data.workPlanId)
  if (data.workId !== undefined) mutation.workId = toPositiveInt(data.workId)
  if (data.personId !== undefined) mutation.personId = toPositiveInt(data.personId)
  if (data.hours !== undefined) mutation.hours = toNumber(data.hours)
  if (data.hoursCreatedAt !== undefined) mutation.hoursCreatedAt = toOptionalDateTimeValue(data.hoursCreatedAt)
  if (data.hoursCreatedByUserId !== undefined) mutation.hoursCreatedByUserId = toPositiveInt(data.hoursCreatedByUserId, null)
  if (data.hoursCreatedByName !== undefined) mutation.hoursCreatedByName = toRequiredString(data.hoursCreatedByName) || null
  if (data.hoursUpdatedAt !== undefined) mutation.hoursUpdatedAt = toOptionalDateTimeValue(data.hoursUpdatedAt)
  if (data.hoursUpdatedByUserId !== undefined) mutation.hoursUpdatedByUserId = toPositiveInt(data.hoursUpdatedByUserId, null)
  if (data.hoursUpdatedByName !== undefined) mutation.hoursUpdatedByName = toRequiredString(data.hoursUpdatedByName) || null
  if (data.dailyHours !== undefined) mutation.dailyHours = toNumber(data.dailyHours)
  if (data.approvedHours !== undefined) mutation.approvedHours = toOptionalDecimal(data.approvedHours)
  if (data.adminApprovedAt !== undefined) mutation.adminApprovedAt = toOptionalDateTimeValue(data.adminApprovedAt)
  if (data.adminApprovedByUserId !== undefined) mutation.adminApprovedByUserId = toPositiveInt(data.adminApprovedByUserId, null)
  if (data.adminApprovedByName !== undefined) mutation.adminApprovedByName = toRequiredString(data.adminApprovedByName) || null
  if (data.submitted !== undefined) mutation.submitted = data.submitted === true
  if (data.submittedAt !== undefined) mutation.submittedAt = toOptionalDateTimeValue(data.submittedAt)
  if (data.submittedByUserId !== undefined) mutation.submittedByUserId = toPositiveInt(data.submittedByUserId, null)
  if (data.submittedByName !== undefined) mutation.submittedByName = toRequiredString(data.submittedByName) || null
  if (data.hourlyCost !== undefined) mutation.hourlyCost = toNumber(data.hourlyCost)
  if (data.manualHourlyCost !== undefined) mutation.manualHourlyCost = data.manualHourlyCost === true
  if (data.notes !== undefined) mutation.notes = toRequiredString(data.notes) || null
  if (data.hasWorkAccess !== undefined) mutation.hasWorkAccess = data.hasWorkAccess === true
  if (data.assignmentPurpose !== undefined) {
    mutation.assignmentPurpose = normalizeAssignmentPurpose(data.assignmentPurpose)
  }
  if (data.planningVisible !== undefined) mutation.planningVisible = data.planningVisible !== false

  return mutation
}

function mapAuditUser(record) {
  if (!record) {
    return null
  }

  return {
    id: Number(record.id),
    username: toRequiredString(record.username),
    name: toRequiredString(record.name || record.username),
  }
}

function mapWorkAssignmentRecord(record) {
  if (!record) {
    return null
  }

  return {
    id: Number(record.id),
    workPlanId: Number(record.workPlanId),
    workId: Number(record.workId),
    personId: Number(record.personId),
    hours: toNumber(record.hours),
    hoursCreatedAt: toDateTimeString(record.hoursCreatedAt),
    hoursCreatedByUserId: toPositiveInt(record.hoursCreatedByUserId, null),
    hoursCreatedByName: toRequiredString(record.hoursCreatedByName) || null,
    hoursUpdatedAt: toDateTimeString(record.hoursUpdatedAt),
    hoursUpdatedByUserId: toPositiveInt(record.hoursUpdatedByUserId, null),
    hoursUpdatedByName: toRequiredString(record.hoursUpdatedByName) || null,
    dailyHours: toNumber(record.dailyHours),
    approvedHours: record.approvedHours === null ? null : toNumber(record.approvedHours),
    adminApprovedAt: toDateTimeString(record.adminApprovedAt),
    adminApprovedBy: toRequiredString(record.adminApprovedByName) || null,
    adminApprovedByName: toRequiredString(record.adminApprovedByName) || null,
    adminApprovedByUserId: toPositiveInt(record.adminApprovedByUserId, null),
    submitted: record.submitted === true,
    submittedAt: toDateTimeString(record.submittedAt),
    submittedBy: toRequiredString(record.submittedByName) || null,
    submittedByName: toRequiredString(record.submittedByName) || null,
    submittedByUserId: toPositiveInt(record.submittedByUserId, null),
    hourlyCost: toNumber(record.hourlyCost),
    manualHourlyCost: record.manualHourlyCost === true,
    notes: toRequiredString(record.notes),
    hasWorkAccess: record.hasWorkAccess === true,
    assignmentPurpose: normalizeAssignmentPurpose(record.assignmentPurpose),
    planningVisible: record.planningVisible !== false,
    date: record.workPlan ? mapWorkPlanRecord(record.workPlan)?.date || null : null,
    person: record.person ? mapPersonRecord(record.person) : null,
    work: record.work ? mapWorkRecord(record.work) : null,
    workPlan: record.workPlan ? mapWorkPlanRecord(record.workPlan) : null,
    submittedByUser: mapAuditUser(record.submittedByUser),
    approvedByUser: mapAuditUser(record.approvedByUser),
  }
}

export async function getAllWorkAssignmentsDb(filters = {}) {
  const workPlanId = toPositiveInt(filters.workPlanId)
  const workId = toPositiveInt(filters.workId)
  const workIds = Array.from(
    new Set(
      (Array.isArray(filters.workIds) ? filters.workIds : [])
        .map(candidate => toPositiveInt(candidate))
        .filter(Boolean),
    ),
  )
  const personId = toPositiveInt(filters.personId)
  const date = filters.date ? toDateOnlyValue(filters.date) : null
  const dateFrom = filters.dateFrom ? toDateOnlyValue(filters.dateFrom) : null
  const dateTo = filters.dateTo ? toDateOnlyValue(filters.dateTo) : null
  const planningVisible =
    filters.planningVisible === undefined ? undefined : filters.planningVisible !== false

  const workPlanDateFilter = date
    ? { date }
    : (dateFrom || dateTo)
      ? {
          date: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : undefined

  const assignments = await prisma.workAssignment.findMany({
    where: {
      ...(workPlanId ? { workPlanId } : {}),
      ...(workId ? { workId } : {}),
      ...(!workId && workIds.length > 0 ? { workId: { in: workIds } } : {}),
      ...(personId ? { personId } : {}),
      ...(workPlanDateFilter ? { workPlan: workPlanDateFilter } : {}),
      ...(planningVisible !== undefined ? { planningVisible } : {}),
    },
    include: getWorkAssignmentIncludes(),
    orderBy: [{ workPlanId: 'asc' }, { workId: 'asc' }, { id: 'asc' }],
  })

  return assignments.map(mapWorkAssignmentRecord)
}

export async function getWorkAssignmentByIdDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const assignment = await prisma.workAssignment.findUnique({
    where: { id: normalizedId },
    include: getWorkAssignmentIncludes(),
  })

  return mapWorkAssignmentRecord(assignment)
}

export async function createWorkAssignmentDb(data) {
  const currentHighestId = await prisma.workAssignment.aggregate({
    _max: { id: true },
  })

  const assignment = await prisma.workAssignment.create({
    data: {
      id: toPositiveInt(data?.id) || (Number(currentHighestId._max.id) || 0) + 1,
      ...toWorkAssignmentMutation(data),
    },
    include: getWorkAssignmentIncludes(),
  })

  return mapWorkAssignmentRecord(assignment)
}

export async function updateWorkAssignmentDb(id, data) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const currentAssignment = await prisma.workAssignment.findUnique({
    where: { id: normalizedId },
  })

  if (!currentAssignment) {
    return null
  }

  const assignment = await prisma.workAssignment.update({
    where: { id: normalizedId },
    data: toWorkAssignmentMutation(data),
    include: getWorkAssignmentIncludes(),
  })

  return mapWorkAssignmentRecord(assignment)
}

export async function deleteWorkAssignmentDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return false
  }

  try {
    await prisma.workAssignment.delete({
      where: { id: normalizedId },
    })
    return true
  } catch (error) {
    return false
  }
}

export async function applyExclusiveChefWorkAccessDb(workPlanId, workId, selectedAssignmentId) {
  const normalizedWorkPlanId = toPositiveInt(workPlanId)
  const normalizedWorkId = toPositiveInt(workId)
  const normalizedSelectedAssignmentId = toPositiveInt(selectedAssignmentId)

  if (!normalizedWorkPlanId || !normalizedWorkId || !normalizedSelectedAssignmentId) {
    return
  }

  const chefAssignments = await prisma.workAssignment.findMany({
    where: {
      workPlanId: normalizedWorkPlanId,
      workId: normalizedWorkId,
      person: {
        role: {
          in: CHEF_ROLE_VALUES,
        },
      },
    },
    select: { id: true },
  })

  if (chefAssignments.length === 0) {
    return
  }

  await prisma.$transaction(
    chefAssignments.map(assignment =>
      prisma.workAssignment.update({
        where: { id: Number(assignment.id) },
        data: {
          hasWorkAccess: Number(assignment.id) === normalizedSelectedAssignmentId,
        },
      }),
    ),
  )
}
