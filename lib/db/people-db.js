import { prisma } from '../prisma.js'
import { mapPersonRecord, toNumber, toPositiveInt, toRequiredString } from './core-mappers.js'
import { normalizeRole } from '../roles.js'

export async function getAllPeopleDb(filters = {}) {
  const companyId = toPositiveInt(filters.companyId)
  const role = filters.role ? normalizeRole(filters.role) : null

  const people = await prisma.person.findMany({
    where: {
      ...(companyId ? { companyId } : {}),
      ...(role ? { role } : {}),
    },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  })

  return people.map(mapPersonRecord)
}

export async function getPersonByIdDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const person = await prisma.person.findUnique({
    where: { id: normalizedId },
  })

  return mapPersonRecord(person)
}

export async function createPersonDb(data) {
  const monthlyPrice = toNumber(data?.monthlyPrice)

  const person = await prisma.person.create({
    data: {
      id: toPositiveInt(data?.id) || undefined,
      companyId: toPositiveInt(data?.companyId, 1),
      name: toRequiredString(data?.name),
      price: toNumber(data?.price),
      monthlyPrice,
      isMonthlyBilling: data?.isMonthlyBilling !== undefined ? data.isMonthlyBilling === true : monthlyPrice > 0,
      role: normalizeRole(data?.role),
    },
  })

  return mapPersonRecord(person)
}

export async function updatePersonDb(id, data) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const currentPerson = await prisma.person.findUnique({
    where: { id: normalizedId },
  })

  if (!currentPerson) {
    return null
  }

  const nextMonthlyPrice =
    data?.monthlyPrice !== undefined ? toNumber(data.monthlyPrice) : Number(currentPerson.monthlyPrice)

  const person = await prisma.person.update({
    where: { id: normalizedId },
    data: {
      companyId: data?.companyId !== undefined ? toPositiveInt(data.companyId, currentPerson.companyId) : currentPerson.companyId,
      name: data?.name !== undefined ? toRequiredString(data.name) : currentPerson.name,
      price: data?.price !== undefined ? toNumber(data.price) : Number(currentPerson.price),
      monthlyPrice: nextMonthlyPrice,
      isMonthlyBilling:
        data?.isMonthlyBilling !== undefined ? data.isMonthlyBilling === true : nextMonthlyPrice > 0,
      role: data?.role !== undefined ? normalizeRole(data.role) : currentPerson.role,
    },
  })

  return mapPersonRecord(person)
}

export async function deletePersonDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return false
  }

  try {
    await prisma.person.delete({
      where: { id: normalizedId },
    })
    return true
  } catch (error) {
    return false
  }
}
