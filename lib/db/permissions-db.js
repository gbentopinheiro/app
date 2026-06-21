import { PERMISSION_DEFINITIONS } from '../permissions.js'
import { prisma } from '../prisma.js'
import { toPositiveInt } from './core-mappers.js'

const PERMISSION_DEFINITION_MAP = new Map(
  PERMISSION_DEFINITIONS.map(definition => [definition.key, definition]),
)
const PERMISSION_ORDER = new Map(
  PERMISSION_DEFINITIONS.map((definition, index) => [definition.key, index]),
)

export function mapPermissionRecord(record) {
  const key = String(record?.key || '').trim()
  const definition = PERMISSION_DEFINITION_MAP.get(key)

  return {
    id: toPositiveInt(record?.id),
    key,
    name: String(record?.name || definition?.name || key).trim(),
    description: String(record?.description || definition?.description || '').trim(),
    category: String(record?.category || definition?.category || 'simple').trim(),
  }
}

export function sortPermissionRecords(left, right) {
  const leftOrder = PERMISSION_ORDER.get(left.key) ?? Number.MAX_SAFE_INTEGER
  const rightOrder = PERMISSION_ORDER.get(right.key) ?? Number.MAX_SAFE_INTEGER

  return leftOrder - rightOrder || left.key.localeCompare(right.key, 'pt-PT')
}

export async function getAllPermissionsDb() {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ key: 'asc' }, { id: 'asc' }],
  })

  return permissions
    .map(mapPermissionRecord)
    .sort(sortPermissionRecords)
}
