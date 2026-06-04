import { prisma } from '../prisma.js'
import { mapWorkPlanRecord, toDateOnlyValue, toPositiveInt } from './core-mappers.js'

export async function getAllWorkPlansDb(filters = {}) {
  const companyId = toPositiveInt(filters.companyId)
  const date = filters.date ? toDateOnlyValue(filters.date) : null

  const workPlans = await prisma.workPlan.findMany({
    where: {
      ...(companyId ? { companyId } : {}),
      ...(date ? { date } : {}),
    },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  })

  return workPlans.map(mapWorkPlanRecord)
}

export async function getWorkPlanByIdDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const workPlan = await prisma.workPlan.findUnique({
    where: { id: normalizedId },
  })

  return mapWorkPlanRecord(workPlan)
}

export async function getWorkPlanByDateDb(date, companyId) {
  const normalizedDate = toDateOnlyValue(date)
  const normalizedCompanyId = toPositiveInt(companyId, 1)

  if (!normalizedDate) {
    return null
  }

  const workPlan = await prisma.workPlan.findUnique({
    where: {
      companyId_date: {
        companyId: normalizedCompanyId,
        date: normalizedDate,
      },
    },
  })

  return mapWorkPlanRecord(workPlan)
}

export async function createWorkPlanDb(data) {
  const workPlan = await prisma.workPlan.create({
    data: {
      id: toPositiveInt(data?.id) || undefined,
      companyId: toPositiveInt(data?.companyId, 1),
      date: toDateOnlyValue(data?.date),
    },
  })

  return mapWorkPlanRecord(workPlan)
}

export async function updateWorkPlanDb(id, data) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const currentWorkPlan = await prisma.workPlan.findUnique({
    where: { id: normalizedId },
  })

  if (!currentWorkPlan) {
    return null
  }

  const workPlan = await prisma.workPlan.update({
    where: { id: normalizedId },
    data: {
      companyId:
        data?.companyId !== undefined
          ? toPositiveInt(data.companyId, currentWorkPlan.companyId)
          : currentWorkPlan.companyId,
      date:
        data?.date !== undefined
          ? toDateOnlyValue(data.date)
          : currentWorkPlan.date,
    },
  })

  return mapWorkPlanRecord(workPlan)
}

export async function deleteWorkPlanDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return false
  }

  try {
    await prisma.workPlan.delete({
      where: { id: normalizedId },
    })
    return true
  } catch (error) {
    return false
  }
}
