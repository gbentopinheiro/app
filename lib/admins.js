import { existsSync, mkdirSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

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

export function getAdminByUsername(username) {
  const normalizedUsername = String(username || '').trim().toLowerCase()

  return (
    getAllAdmins().find(admin => admin.username.toLowerCase() === normalizedUsername) || null
  )
}
