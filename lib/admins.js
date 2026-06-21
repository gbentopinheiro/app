import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { isMysqlDataSourceEnabled } from './data-source.js'
import {
  getAdminByIdDb,
  getAdminByUsernameDb,
  getAllAdminsDb,
  updateAdminPasswordDb,
} from './db/admins-db.js'
import { hashPasswordIfNeeded } from './passwords.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const adminsFilePath = join(dataDir, 'admins.json')

function ensureDataDir() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
}

function normalizeAdmins(list) {
  if (!Array.isArray(list)) return []

  return list
    .map((admin, index) => ({
      id: admin.id !== undefined ? parseInt(admin.id) : index + 1,
      username: String(admin.username || '').trim(),
      password: String(admin.password || '').trim(),
      name: String(admin.name || 'Administrador').trim(),
    }))
    .filter(admin => admin.username && admin.password)
}

export function getAllAdmins() {
  ensureDataDir()

  if (!existsSync(adminsFilePath)) {
    return []
  }

  try {
    const rawData = JSON.parse(readFileSync(adminsFilePath, 'utf8'))
    return normalizeAdmins(rawData)
  } catch (error) {
    console.error('Error loading admins:', error.message)
    return []
  }
}

function saveAdmins(admins) {
  ensureDataDir()
  writeFileSync(adminsFilePath, JSON.stringify(normalizeAdmins(admins), null, 2), 'utf8')
}

export function getAdminById(id) {
  const normalizedId = parseInt(id)

  return getAllAdmins().find(admin => admin.id === normalizedId) || null
}

export function getAdminByUsername(username) {
  const normalizedUsername = String(username || '').trim().toLowerCase()

  return (
    getAllAdmins().find(admin => admin.username.toLowerCase() === normalizedUsername) || null
  )
}

export function updateAdminPassword(id, password, options = {}) {
  const normalizedId = parseInt(id)
  const nextPassword = String(password || '')

  if (!nextPassword) {
    throw new Error('A nova palavra-passe é obrigatória')
  }

  const admins = getAllAdmins()
  const index = admins.findIndex(admin => admin.id === normalizedId)

  if (index === -1) {
    return null
  }

  const updatedAdmin = {
    ...admins[index],
    password: hashPasswordIfNeeded(nextPassword, options),
  }

  if (!isMysqlDataSourceEnabled()) {
    admins[index] = updatedAdmin
    saveAdmins(admins)
  }

  return updatedAdmin
}

function mapDbAdminToLegacyShape(admin) {
  if (!admin) {
    return null
  }

  return {
    id: Number(admin.id),
    username: String(admin.username || '').trim(),
    password: String(admin.passwordHash || admin.password || '').trim(),
    name: String(admin.name || admin.username || 'Administrador').trim(),
    personId: admin.personId || null,
    role: admin.person?.role || admin.role || 'admin',
    accountType: admin.accountType || 'admin',
    active: admin.active !== false,
    deactivatedAt: admin.deactivatedAt || null,
    deletedAt: admin.deletedAt || null,
    lastLoginAt: admin.lastLoginAt || null,
    legacySource: admin.legacySource || null,
    legacySourceId: admin.legacySourceId || null,
    person: admin.person || null,
  }
}

export async function getAllAdminsData() {
  if (!isMysqlDataSourceEnabled()) {
    return getAllAdmins()
  }

  const dbAdmins = await getAllAdminsDb()
  return dbAdmins
    .map(mapDbAdminToLegacyShape)
    .sort((left, right) =>
    String(left.username || '').localeCompare(String(right.username || ''), 'pt-PT'),
    )
}

export async function getAdminByIdData(id) {
  if (isMysqlDataSourceEnabled()) {
    const dbAdmin = await getAdminByIdDb(id)

    return dbAdmin ? mapDbAdminToLegacyShape(dbAdmin) : null
  }

  return getAdminById(id)
}

export async function getAdminByUsernameData(username) {
  if (isMysqlDataSourceEnabled()) {
    const dbAdmin = await getAdminByUsernameDb(username)

    return dbAdmin ? mapDbAdminToLegacyShape(dbAdmin) : null
  }

  return getAdminByUsername(username)
}

export async function updateAdminPasswordData(id, password, options = {}) {
  if (!isMysqlDataSourceEnabled()) {
    return updateAdminPassword(id, password, options)
  }

  const currentDbAdmin = await getAdminByIdDb(id)

  if (!currentDbAdmin) {
    return null
  }

  const passwordHash = hashPasswordIfNeeded(password, options)
  const updatedDbAdmin = await updateAdminPasswordDb(currentDbAdmin.id, passwordHash)

  return mapDbAdminToLegacyShape(updatedDbAdmin || currentDbAdmin)
}
