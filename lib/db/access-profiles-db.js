import { ACCESS_PROFILE_DEFINITIONS, normalizeAccessProfile } from '../access-profiles.js'
import { prisma } from '../prisma.js'
import { toPositiveInt } from './core-mappers.js'
import { mapPermissionRecord, sortPermissionRecords } from './permissions-db.js'

const ACCESS_PROFILE_DEFINITION_MAP = new Map(
  ACCESS_PROFILE_DEFINITIONS.map(definition => [definition.key, definition]),
)
const ACCESS_PROFILE_ORDER = new Map(
  ACCESS_PROFILE_DEFINITIONS.map((definition, index) => [definition.key, index]),
)

function getAccessProfileIncludes() {
  return {
    permissions: {
      include: {
        permission: true,
      },
    },
  }
}

export function mapAccessProfileRecord(record) {
  const key = normalizeAccessProfile(record?.key)
  const definition = ACCESS_PROFILE_DEFINITION_MAP.get(key)
  const permissions = Array.isArray(record?.permissions)
    ? record.permissions
      .map(entry => mapPermissionRecord(entry.permission || entry))
      .filter(permission => permission.key)
      .sort(sortPermissionRecords)
    : []

  return {
    id: toPositiveInt(record?.id),
    key,
    name: String(record?.name || definition?.name || key).trim(),
    description: String(record?.description || definition?.description || '').trim(),
    permissions,
    permissionKeys: permissions.map(permission => permission.key),
  }
}

export async function getAllAccessProfilesDb() {
  const profiles = await prisma.accessProfile.findMany({
    include: getAccessProfileIncludes(),
    orderBy: [{ id: 'asc' }, { key: 'asc' }],
  })

  const mappedProfiles = profiles.map(mapAccessProfileRecord)
  const profilesByKey = new Map(mappedProfiles.map(profile => [profile.key, profile]))
  const orderedProfiles = ACCESS_PROFILE_DEFINITIONS
    .map(definition => profilesByKey.get(definition.key))
    .filter(Boolean)

  mappedProfiles.forEach(profile => {
    if (!orderedProfiles.some(item => item.id === profile.id)) {
      orderedProfiles.push(profile)
    }
  })

  return orderedProfiles.sort((left, right) => {
    const leftOrder = ACCESS_PROFILE_ORDER.get(left.key) ?? Number.MAX_SAFE_INTEGER
    const rightOrder = ACCESS_PROFILE_ORDER.get(right.key) ?? Number.MAX_SAFE_INTEGER

    return leftOrder - rightOrder || left.key.localeCompare(right.key, 'pt-PT')
  })
}

export async function getAccessProfileByIdDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const profile = await prisma.accessProfile.findUnique({
    where: { id: normalizedId },
    include: getAccessProfileIncludes(),
  })

  return mapAccessProfileRecord(profile)
}
