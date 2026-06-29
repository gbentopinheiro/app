import { prisma } from '../prisma.js'
import { mapPersonRecord, toNumber, toPositiveInt, toRequiredString } from './core-mappers.js'
import { normalizeChefCategory, normalizeRole, roleSupportsChefCategory } from '../roles.js'

function getChefCategoryForRole(role, chefCategory) {
  return roleSupportsChefCategory(role) ? normalizeChefCategory(chefCategory) : null
}

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
  const role = normalizeRole(data?.role)
  const currentHighestId = await prisma.person.aggregate({
    _max: { id: true },
  })

  const person = await prisma.person.create({
    data: {
      id: toPositiveInt(data?.id) || (Number(currentHighestId._max.id) || 0) + 1,
      companyId: toPositiveInt(data?.companyId, 1),
      name: toRequiredString(data?.name),
      price: toNumber(data?.price),
      monthlyPrice,
      isMonthlyBilling: data?.isMonthlyBilling !== undefined ? data.isMonthlyBilling === true : monthlyPrice > 0,
      role,
      chefCategory: getChefCategoryForRole(role, data?.chefCategory),
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
  const nextRole = data?.role !== undefined ? normalizeRole(data.role) : normalizeRole(currentPerson.role)
  const nextChefCategory =
    data?.chefCategory !== undefined ? data.chefCategory : currentPerson.chefCategory

  const person = await prisma.person.update({
    where: { id: normalizedId },
    data: {
      companyId: data?.companyId !== undefined ? toPositiveInt(data.companyId, currentPerson.companyId) : currentPerson.companyId,
      name: data?.name !== undefined ? toRequiredString(data.name) : currentPerson.name,
      price: data?.price !== undefined ? toNumber(data.price) : Number(currentPerson.price),
      monthlyPrice: nextMonthlyPrice,
      isMonthlyBilling:
        data?.isMonthlyBilling !== undefined ? data.isMonthlyBilling === true : nextMonthlyPrice > 0,
      role: nextRole,
      chefCategory: getChefCategoryForRole(nextRole, nextChefCategory),
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
