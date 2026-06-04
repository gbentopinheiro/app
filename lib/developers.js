import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { isMysqlDataSourceEnabled } from './data-source.js'
import {
  getAllDevelopersDb,
  getDeveloperByIdDb,
  getDeveloperByUsernameDb,
  updateDeveloperPasswordDb,
} from './db/developers-db.js'
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

  const updatedDeveloper = {
    ...developers[index],
    password: hashPasswordIfNeeded(nextPassword, options),
  }

  if (!isMysqlDataSourceEnabled()) {
    developers[index] = updatedDeveloper
    saveDevelopers(developers)
  }

  return updatedDeveloper
}

function mapDbDeveloperToLegacyShape(developer) {
  if (!developer) {
    return null
  }

  return {
    id: Number(developer.id),
    username: String(developer.username || '').trim(),
    password: String(developer.passwordHash || developer.password || '').trim(),
    name: String(developer.name || developer.username || 'Programador').trim(),
    personId: null,
    role: developer.role || 'developer',
    accountType: developer.accountType || 'developer',
    active: developer.active !== false,
    deactivatedAt: developer.deactivatedAt || null,
    deletedAt: developer.deletedAt || null,
    lastLoginAt: developer.lastLoginAt || null,
    legacySource: developer.legacySource || null,
    legacySourceId: developer.legacySourceId || null,
    person: null,
  }
}

export async function getAllDevelopersData() {
  if (!isMysqlDataSourceEnabled()) {
    return getAllDevelopers()
  }

  const [dbDevelopers, legacyDevelopers] = await Promise.all([
    getAllDevelopersDb(),
    Promise.resolve(getAllDevelopers()),
  ])
  const coveredLegacyIds = new Set(
    dbDevelopers
      .map(developer => parseInt(developer.legacySourceId))
      .filter(legacySourceId => Number.isInteger(legacySourceId) && legacySourceId > 0),
  )
  const coveredUsernames = new Set(
    dbDevelopers
      .map(developer => String(developer.username || '').trim().toLowerCase())
      .filter(Boolean),
  )
  const mappedDbDevelopers = dbDevelopers.map(mapDbDeveloperToLegacyShape)
  const missingLegacyDevelopers = legacyDevelopers.filter(developer => {
    const legacyId = Number(developer.id)
    const username = String(developer.username || '').trim().toLowerCase()

    return (
      !(legacyId > 0 && coveredLegacyIds.has(legacyId)) &&
      !(username && coveredUsernames.has(username))
    )
  })

  return [...mappedDbDevelopers, ...missingLegacyDevelopers].sort((left, right) =>
    String(left.username || '').localeCompare(String(right.username || ''), 'pt-PT'),
  )
}

export async function getDeveloperByIdData(id) {
  if (isMysqlDataSourceEnabled()) {
    const dbDeveloper = await getDeveloperByIdDb(id)

    if (dbDeveloper) {
      return mapDbDeveloperToLegacyShape(dbDeveloper)
    }
  }

  return getDeveloperById(id)
}

export async function getDeveloperByUsernameData(username) {
  if (isMysqlDataSourceEnabled()) {
    const dbDeveloper = await getDeveloperByUsernameDb(username)

    if (dbDeveloper) {
      return mapDbDeveloperToLegacyShape(dbDeveloper)
    }
  }

  return getDeveloperByUsername(username)
}

export async function updateDeveloperPasswordData(id, password, options = {}) {
  if (!isMysqlDataSourceEnabled()) {
    return updateDeveloperPassword(id, password, options)
  }

  const currentDbDeveloper = await getDeveloperByIdDb(id)

  if (!currentDbDeveloper) {
    return updateDeveloperPassword(id, password, options)
  }

  const passwordHash = hashPasswordIfNeeded(password, options)
  const updatedDbDeveloper = await updateDeveloperPasswordDb(currentDbDeveloper.id, passwordHash)

  return mapDbDeveloperToLegacyShape(updatedDbDeveloper || currentDbDeveloper)
}
