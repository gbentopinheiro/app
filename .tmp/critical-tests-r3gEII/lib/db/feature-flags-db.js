import { prisma } from '../prisma.js'
import { toDateTimeString, toRequiredString } from './core-mappers.js'

function normalizeFeatureFlagKey(key) {
  return toRequiredString(key)
}

function mapFeatureFlagRecord(record) {
  if (!record) {
    return null
  }

  return {
    key: normalizeFeatureFlagKey(record.key),
    enabled: record.enabled === true,
    createdAt: toDateTimeString(record.createdAt),
    updatedAt: toDateTimeString(record.updatedAt),
  }
}

export async function getAllFeatureFlagsDb() {
  const featureFlags = await prisma.featureFlag.findMany({
    orderBy: [{ key: 'asc' }],
  })

  return featureFlags.map(mapFeatureFlagRecord)
}

export async function getFeatureFlagByKeyDb(key) {
  const normalizedKey = normalizeFeatureFlagKey(key)

  if (!normalizedKey) {
    return null
  }

  const featureFlag = await prisma.featureFlag.findUnique({
    where: {
      key: normalizedKey,
    },
  })

  return mapFeatureFlagRecord(featureFlag)
}

export async function updateFeatureFlagDb(key, enabled) {
  const normalizedKey = normalizeFeatureFlagKey(key)

  if (!normalizedKey) {
    return null
  }

  const featureFlag = await prisma.featureFlag.upsert({
    where: {
      key: normalizedKey,
    },
    update: {
      enabled: enabled === true,
    },
    create: {
      key: normalizedKey,
      enabled: enabled === true,
    },
  })

  return mapFeatureFlagRecord(featureFlag)
}
