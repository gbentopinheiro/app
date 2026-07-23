import { prisma } from '../prisma.js'
import { toDateTimeString, toOptionalString, toPositiveInt, toRequiredString } from './core-mappers.js'

const ALLOWED_UNITS = new Set(['un', 'cx', 'kg', 'l', 'm', 'm2', 'm3'])

function normalizeQuantity(value, fallback = 0) {
  const parsedValue = Number.parseFloat(String(value ?? '').replace(',', '.'))

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return fallback
  }

  return Number(parsedValue.toFixed(2))
}

function normalizeUnit(value, fallback = 'un') {
  const normalizedUnit = String(value || '').trim().toLowerCase() || fallback
  return ALLOWED_UNITS.has(normalizedUnit) ? normalizedUnit : fallback
}

function toDateTimeValue(value, fallback = null) {
  if (!value) {
    return fallback
  }

  const candidate = value instanceof Date ? value : new Date(value)
  return Number.isNaN(candidate.getTime()) ? fallback : candidate
}

function mapMaterialRecord(record) {
  if (!record) {
    return null
  }

  return {
    id: Number(record.id),
    name: toRequiredString(record.name),
    reference: toRequiredString(record.reference),
    category: toRequiredString(record.category),
    unit: normalizeUnit(record.unit),
    quantity: normalizeQuantity(record.quantity),
    minimumQuantity: normalizeQuantity(record.minimumQuantity),
    location: toRequiredString(record.location),
    supplier: toRequiredString(record.supplier),
    notes: toRequiredString(record.notes),
    createdAt: toDateTimeString(record.createdAt),
    updatedAt: toDateTimeString(record.updatedAt),
  }
}

function buildMaterialMutationData(data, currentMaterial = null) {
  return {
    name: data?.name !== undefined ? toRequiredString(data.name) : toRequiredString(currentMaterial?.name),
    reference:
      data?.reference !== undefined
        ? toOptionalString(data.reference)
        : toOptionalString(currentMaterial?.reference),
    category:
      data?.category !== undefined
        ? toOptionalString(data.category)
        : toOptionalString(currentMaterial?.category),
    unit:
      data?.unit !== undefined
        ? normalizeUnit(data.unit)
        : normalizeUnit(currentMaterial?.unit),
    quantity:
      data?.quantity !== undefined
        ? normalizeQuantity(data.quantity)
        : normalizeQuantity(currentMaterial?.quantity),
    minimumQuantity:
      data?.minimumQuantity !== undefined
        ? normalizeQuantity(data.minimumQuantity)
        : normalizeQuantity(currentMaterial?.minimumQuantity),
    location:
      data?.location !== undefined
        ? toOptionalString(data.location)
        : toOptionalString(currentMaterial?.location),
    supplier:
      data?.supplier !== undefined
        ? toOptionalString(data.supplier)
        : toOptionalString(currentMaterial?.supplier),
    notes:
      data?.notes !== undefined
        ? toOptionalString(data.notes)
        : toOptionalString(currentMaterial?.notes),
  }
}

async function getNextMaterialIdDb() {
  const result = await prisma.material.aggregate({
    _max: {
      id: true,
    },
  })

  return Number(result?._max?.id || 0) + 1
}

export async function getAllMaterialsDb() {
  const materials = await prisma.material.findMany({
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  })

  return materials.map(mapMaterialRecord)
}

export async function getMaterialByIdDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const material = await prisma.material.findUnique({
    where: { id: normalizedId },
  })

  return mapMaterialRecord(material)
}

export async function getMaterialByReferenceDb(reference) {
  const normalizedReference = toRequiredString(reference)

  if (!normalizedReference) {
    return null
  }

  const material = await prisma.material.findFirst({
    where: {
      reference: normalizedReference,
    },
  })

  return mapMaterialRecord(material)
}

export async function createMaterialDb(data) {
  const nextMaterialState = buildMaterialMutationData(data)
  const createData = {
    id: toPositiveInt(data?.id) || (await getNextMaterialIdDb()),
    ...nextMaterialState,
  }
  const createdAt = toDateTimeValue(data?.createdAt, null)
  const updatedAt = toDateTimeValue(data?.updatedAt, null)

  if (createdAt) {
    createData.createdAt = createdAt
  }

  if (updatedAt) {
    createData.updatedAt = updatedAt
  }

  const material = await prisma.material.create({
    data: createData,
  })

  return mapMaterialRecord(material)
}

export async function updateMaterialDb(id, data) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const currentMaterial = await prisma.material.findUnique({
    where: { id: normalizedId },
  })

  if (!currentMaterial) {
    return null
  }

  const nextMaterialState = buildMaterialMutationData(data, currentMaterial)
  const updateData = {
    ...nextMaterialState,
  }
  const createdAt = data?.createdAt !== undefined ? toDateTimeValue(data.createdAt, currentMaterial.createdAt) : null
  const updatedAt = data?.updatedAt !== undefined ? toDateTimeValue(data.updatedAt, currentMaterial.updatedAt) : null

  if (createdAt) {
    updateData.createdAt = createdAt
  }

  if (updatedAt) {
    updateData.updatedAt = updatedAt
  }

  const material = await prisma.material.update({
    where: { id: normalizedId },
    data: updateData,
  })

  return mapMaterialRecord(material)
}

export async function deleteMaterialDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return false
  }

  try {
    await prisma.material.delete({
      where: { id: normalizedId },
    })
    return true
  } catch (error) {
    return false
  }
}

export async function replaceAllMaterialsDb(materials = []) {
  const normalizedMaterials = Array.isArray(materials)
    ? materials
        .map((material, index) => {
          const nextMaterialState = buildMaterialMutationData(material)
          const normalizedId = toPositiveInt(material?.id, index + 1)

          if (!normalizedId || !nextMaterialState.name) {
            return null
          }

          return {
            id: normalizedId,
            ...nextMaterialState,
            createdAt: toDateTimeValue(material?.createdAt, new Date()),
            updatedAt: toDateTimeValue(material?.updatedAt, new Date()),
          }
        })
        .filter(Boolean)
    : []

  await prisma.$transaction(async transaction => {
    await transaction.material.deleteMany()

    if (normalizedMaterials.length > 0) {
      await transaction.material.createMany({
        data: normalizedMaterials,
      })
    }
  })

  return normalizedMaterials.map(material => ({
    ...material,
    createdAt: toDateTimeString(material.createdAt),
    updatedAt: toDateTimeString(material.updatedAt),
  }))
}
