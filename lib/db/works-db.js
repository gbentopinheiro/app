import { prisma } from '../prisma.js'
import {
  mapWorkRecord,
  normalizeRoleHourlyCosts,
  normalizeSpecialPersonHourlyCosts,
  normalizeWorkingDays,
  normalizeWorkStatus,
  toDateOnlyValue,
  toNumber,
  toPositiveInt,
  toRequiredString,
} from './core-mappers.js'

async function getRawWorkById(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  return prisma.work.findUnique({
    where: { id: normalizedId },
    include: getWorkIncludes(),
  })
}

function getWorkIncludes() {
  return {
    company: true,
    client: true,
    workingDays: true,
    roleHourlyCosts: true,
    personHourlyCosts: true,
  }
}

async function buildWorkMutationState(data, currentWork = null) {
  const clientId = data?.clientId !== undefined ? toPositiveInt(data.clientId) : toPositiveInt(currentWork?.clientId)

  if (!clientId) {
    throw new Error('A obra tem de pertencer a um cliente')
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  })

  if (!client) {
    throw new Error('A obra tem de pertencer a um cliente')
  }

  const companyId =
    data?.companyId !== undefined
      ? toPositiveInt(data.companyId, client.companyId)
      : toPositiveInt(currentWork?.companyId, client.companyId)

  if (Number(client.companyId) !== Number(companyId)) {
    throw new Error('A obra e o cliente têm de pertencer à mesma empresa.')
  }

  const roleHourlyCosts = normalizeRoleHourlyCosts(
    data?.roleHourlyCosts !== undefined ? data.roleHourlyCosts : currentWork?.roleHourlyCosts,
  )
  const specialPersonHourlyCosts = normalizeSpecialPersonHourlyCosts(
    data?.specialPersonHourlyCosts !== undefined ? data.specialPersonHourlyCosts : currentWork?.specialPersonHourlyCosts,
  )

  const personIds = Object.keys(specialPersonHourlyCosts).map(personId => Number(personId))

  if (personIds.length > 0) {
    const matchingPeople = await prisma.person.findMany({
      where: {
        id: { in: personIds },
        companyId,
      },
      select: { id: true },
    })

    if (matchingPeople.length !== personIds.length) {
      throw new Error('Os preços especiais só podem usar pessoas da mesma empresa da obra.')
    }
  }

  return {
    number:
      data?.number !== undefined
        ? toPositiveInt(data.number)
        : toPositiveInt(currentWork?.number),
    companyId,
    clientId,
    name: data?.name !== undefined ? toRequiredString(data.name) : toRequiredString(currentWork?.name),
    location: data?.location !== undefined ? toRequiredString(data.location) : toRequiredString(currentWork?.location),
    status:
      data?.status !== undefined
        ? normalizeWorkStatus(data.status)
        : normalizeWorkStatus(currentWork?.status),
    budget: data?.budget !== undefined ? toNumber(data.budget) : toNumber(currentWork?.budget),
    defaultHourlyCost:
      data?.defaultHourlyCost !== undefined
        ? toNumber(data.defaultHourlyCost)
        : toNumber(currentWork?.defaultHourlyCost),
    startDate:
      data?.startDate !== undefined
        ? toDateOnlyValue(data.startDate)
        : toDateOnlyValue(currentWork?.startDate),
    endDate:
      data?.endDate !== undefined
        ? toDateOnlyValue(data.endDate)
        : toDateOnlyValue(currentWork?.endDate),
    workingDays: normalizeWorkingDays(
      data?.workingDays !== undefined ? data.workingDays : currentWork?.workingDays,
    ),
    roleHourlyCosts,
    specialPersonHourlyCosts,
    notes: data?.notes !== undefined ? toRequiredString(data.notes) : toRequiredString(currentWork?.notes),
  }
}

export async function getAllWorksDb(filters = {}) {
  const companyId = toPositiveInt(filters.companyId)
  const status = filters.status ? normalizeWorkStatus(filters.status, '') : ''

  const works = await prisma.work.findMany({
    where: {
      ...(companyId ? { companyId } : {}),
      ...(status ? { status } : {}),
    },
    include: getWorkIncludes(),
    orderBy: [{ number: 'asc' }, { id: 'asc' }],
  })

  return works.map(mapWorkRecord)
}

export async function getWorkByIdDb(id) {
  const work = await getRawWorkById(id)
  return mapWorkRecord(work)
}

export async function createWorkDb(data) {
  const nextWorkState = await buildWorkMutationState(data)
  const currentHighestId = await prisma.work.aggregate({
    _max: { id: true },
  })
  const currentHighestNumber = await prisma.work.aggregate({
    _max: { number: true },
  })

  const createdWork = await prisma.work.create({
    data: {
      id: toPositiveInt(data?.id) || (Number(currentHighestId._max.id) || 0) + 1,
      number: nextWorkState.number || (Number(currentHighestNumber._max.number) || 0) + 1,
      companyId: nextWorkState.companyId,
      clientId: nextWorkState.clientId,
      name: nextWorkState.name,
      location: nextWorkState.location || null,
      status: nextWorkState.status,
      budget: nextWorkState.budget,
      defaultHourlyCost: nextWorkState.defaultHourlyCost,
      startDate: nextWorkState.startDate,
      endDate: nextWorkState.endDate,
      notes: nextWorkState.notes || null,
      workingDays: {
        create: nextWorkState.workingDays.map(day => ({ day })),
      },
      roleHourlyCosts: {
        create: Object.entries(nextWorkState.roleHourlyCosts).map(([role, hourlyCost]) => ({
          role,
          hourlyCost,
        })),
      },
      personHourlyCosts: {
        create: Object.entries(nextWorkState.specialPersonHourlyCosts).map(([personId, hourlyCost]) => ({
          personId: Number(personId),
          hourlyCost,
        })),
      },
    },
    include: getWorkIncludes(),
  })

  return mapWorkRecord(createdWork)
}

export async function updateWorkDb(id, data) {
  const currentWork = await getWorkByIdDb(id)

  if (!currentWork) {
    return null
  }

  const nextWorkState = await buildWorkMutationState(data, currentWork)
  const updatedWork = await prisma.work.update({
    where: { id: Number(currentWork.id) },
    data: {
      number: nextWorkState.number,
      companyId: nextWorkState.companyId,
      clientId: nextWorkState.clientId,
      name: nextWorkState.name,
      location: nextWorkState.location || null,
      status: nextWorkState.status,
      budget: nextWorkState.budget,
      defaultHourlyCost: nextWorkState.defaultHourlyCost,
      startDate: nextWorkState.startDate,
      endDate: nextWorkState.endDate,
      notes: nextWorkState.notes || null,
      workingDays: {
        deleteMany: {},
        create: nextWorkState.workingDays.map(day => ({ day })),
      },
      roleHourlyCosts: {
        deleteMany: {},
        create: Object.entries(nextWorkState.roleHourlyCosts).map(([role, hourlyCost]) => ({
          role,
          hourlyCost,
        })),
      },
      personHourlyCosts: {
        deleteMany: {},
        create: Object.entries(nextWorkState.specialPersonHourlyCosts).map(([personId, hourlyCost]) => ({
          personId: Number(personId),
          hourlyCost,
        })),
      },
    },
    include: getWorkIncludes(),
  })

  return mapWorkRecord(updatedWork)
}

export async function deleteWorkDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return false
  }

  try {
    await prisma.work.delete({
      where: { id: normalizedId },
    })
    return true
  } catch (error) {
    return false
  }
}
