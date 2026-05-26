import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
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

  admins[index] = {
    ...admins[index],
    password: hashPasswordIfNeeded(nextPassword, options),
  }

  saveAdmins(admins)
  return admins[index]
}
