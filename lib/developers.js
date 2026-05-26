import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { hashPasswordIfNeeded } from './passwords.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const developersFilePath = join(dataDir, 'developers.json')

function ensureDataDir() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
}

function normalizeDevelopers(list) {
  if (!Array.isArray(list)) return []

  return list
    .map((developer, index) => ({
      id: developer.id !== undefined ? parseInt(developer.id) : index + 1,
      username: String(developer.username || '').trim(),
      password: String(developer.password || '').trim(),
      name: String(developer.name || 'Programador').trim(),
    }))
    .filter(developer => developer.username && developer.password)
}

export function getAllDevelopers() {
  ensureDataDir()

  if (!existsSync(developersFilePath)) {
    return []
  }

  try {
    const rawData = JSON.parse(readFileSync(developersFilePath, 'utf8'))
    return normalizeDevelopers(rawData)
  } catch (error) {
    console.error('Error loading developers:', error.message)
    return []
  }
}

function saveDevelopers(developers) {
  ensureDataDir()
  writeFileSync(developersFilePath, JSON.stringify(normalizeDevelopers(developers), null, 2), 'utf8')
}

export function getDeveloperById(id) {
  const normalizedId = parseInt(id)

  return getAllDevelopers().find(developer => developer.id === normalizedId) || null
}

export function getDeveloperByUsername(username) {
  const normalizedUsername = String(username || '').trim().toLowerCase()

  return getAllDevelopers().find(developer => developer.username.toLowerCase() === normalizedUsername) || null
}

export function updateDeveloperPassword(id, password, options = {}) {
  const normalizedId = parseInt(id)
  const nextPassword = String(password || '')

  if (!nextPassword) {
    throw new Error('A nova palavra-passe e obrigatoria')
  }

  const developers = getAllDevelopers()
  const index = developers.findIndex(developer => developer.id === normalizedId)

  if (index === -1) {
    return null
  }

  developers[index] = {
    ...developers[index],
    password: hashPasswordIfNeeded(nextPassword, options),
  }

  saveDevelopers(developers)
  return developers[index]
}
