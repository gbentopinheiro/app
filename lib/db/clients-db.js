import { prisma } from '../prisma.js'
import { mapClientRecord, toPositiveInt, toRequiredString } from './core-mappers.js'

export async function getAllClientsDb(filters = {}) {
  const companyId = toPositiveInt(filters.companyId)

  const clients = await prisma.client.findMany({
    where: companyId ? { companyId } : undefined,
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  })

  return clients.map(mapClientRecord)
}

export async function getClientByIdDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const client = await prisma.client.findUnique({
    where: { id: normalizedId },
  })

  return mapClientRecord(client)
}

export async function getClientByNameDb(name, companyId) {
  const normalizedName = toRequiredString(name)
  const normalizedCompanyId = toPositiveInt(companyId)

  if (!normalizedName) {
    return null
  }

  const client = await prisma.client.findFirst({
    where: {
      name: normalizedName,
      ...(normalizedCompanyId ? { companyId: normalizedCompanyId } : {}),
    },
  })

  return mapClientRecord(client)
}

export async function createClientDb(data) {
  const currentHighestId = await prisma.client.aggregate({
    _max: { id: true },
  })

  const client = await prisma.client.create({
    data: {
      id: toPositiveInt(data?.id) || (Number(currentHighestId._max.id) || 0) + 1,
      companyId: toPositiveInt(data?.companyId, 1),
      name: toRequiredString(data?.name),
      vatNumber: toRequiredString(data?.vatNumber) || null,
      contactName: toRequiredString(data?.contactName) || null,
      email: toRequiredString(data?.email) || null,
      phone: toRequiredString(data?.phone) || null,
      notes: toRequiredString(data?.notes) || null,
    },
  })

  return mapClientRecord(client)
}

export async function updateClientDb(id, data) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const currentClient = await prisma.client.findUnique({
    where: { id: normalizedId },
  })

  if (!currentClient) {
    return null
  }

  const client = await prisma.client.update({
    where: { id: normalizedId },
    data: {
      companyId: data?.companyId !== undefined ? toPositiveInt(data.companyId, currentClient.companyId) : currentClient.companyId,
      name: data?.name !== undefined ? toRequiredString(data.name) : currentClient.name,
      vatNumber: data?.vatNumber !== undefined ? toRequiredString(data.vatNumber) || null : currentClient.vatNumber,
      contactName: data?.contactName !== undefined ? toRequiredString(data.contactName) || null : currentClient.contactName,
      email: data?.email !== undefined ? toRequiredString(data.email) || null : currentClient.email,
      phone: data?.phone !== undefined ? toRequiredString(data.phone) || null : currentClient.phone,
      notes: data?.notes !== undefined ? toRequiredString(data.notes) || null : currentClient.notes,
    },
  })

  return mapClientRecord(client)
}

export async function deleteClientDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return false
  }

  try {
    await prisma.client.delete({
      where: { id: normalizedId },
    })
    return true
  } catch (error) {
    return false
  }
}
