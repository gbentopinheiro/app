import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const loginAttemptsFilePath = join(dataDir, 'login-attempts.json')

export const MAX_FAILED_LOGIN_ATTEMPTS = 5
export const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000

function ensureDataDir() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
}

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase()
}

function normalizeAttemptRecord(record) {
  const username = normalizeUsername(record?.username)
  const failedAt = Array.isArray(record?.failedAt)
    ? record.failedAt.map(value => String(value || '').trim()).filter(Boolean)
    : []
  const blockedUntil = String(record?.blockedUntil || '').trim()

  return username ? { username, failedAt, blockedUntil } : null
}

function loadRecords() {
  ensureDataDir()

  if (!existsSync(loginAttemptsFilePath)) {
    return []
  }

  try {
    const records = JSON.parse(readFileSync(loginAttemptsFilePath, 'utf8'))
    return Array.isArray(records) ? records.map(normalizeAttemptRecord).filter(Boolean) : []
  } catch (error) {
    console.error('Error loading login attempt state:', error.message)
    return []
  }
}

function saveRecords(records) {
  ensureDataDir()
  writeFileSync(loginAttemptsFilePath, JSON.stringify(records.map(normalizeAttemptRecord).filter(Boolean), null, 2), 'utf8')
}

function getActiveFailures(record, now) {
  const cutoff = now.getTime() - LOGIN_ATTEMPT_WINDOW_MS

  return record.failedAt.filter(value => {
    const timestamp = new Date(value).getTime()
    return Number.isFinite(timestamp) && timestamp >= cutoff
  })
}

export function clearFailedLoginAttempts(username) {
  const normalizedUsername = normalizeUsername(username)

  if (!normalizedUsername) {
    return
  }

  const records = loadRecords()
  const nextRecords = records.filter(item => item.username !== normalizedUsername)

  if (nextRecords.length !== records.length) {
    saveRecords(nextRecords)
  }
}

export function getLoginBlockState(username, now = new Date()) {
  const normalizedUsername = normalizeUsername(username)

  if (!normalizedUsername) {
    return { blocked: false, retryAfterSeconds: 0 }
  }

  const record = loadRecords().find(item => item.username === normalizedUsername)

  if (!record?.blockedUntil) {
    return { blocked: false, retryAfterSeconds: 0 }
  }

  const remainingMs = new Date(record.blockedUntil).getTime() - now.getTime()

  if (remainingMs <= 0) {
    clearFailedLoginAttempts(normalizedUsername)
    return { blocked: false, retryAfterSeconds: 0 }
  }

  return {
    blocked: true,
    retryAfterSeconds: Math.ceil(remainingMs / 1000),
  }
}

export function recordFailedLoginAttempt(username, now = new Date()) {
  const normalizedUsername = normalizeUsername(username)

  if (!normalizedUsername) {
    return { blocked: false, retryAfterSeconds: 0 }
  }

  const records = loadRecords()
  const index = records.findIndex(item => item.username === normalizedUsername)
  const record = index === -1 ? { username: normalizedUsername, failedAt: [], blockedUntil: '' } : records[index]
  const failedAt = [...getActiveFailures(record, now), now.toISOString()]
  const blocked = failedAt.length >= MAX_FAILED_LOGIN_ATTEMPTS
  const updatedRecord = {
    username: normalizedUsername,
    failedAt,
    blockedUntil: blocked ? new Date(now.getTime() + LOGIN_ATTEMPT_WINDOW_MS).toISOString() : '',
  }

  if (index === -1) {
    records.push(updatedRecord)
  } else {
    records[index] = updatedRecord
  }

  saveRecords(records)

  return {
    blocked,
    retryAfterSeconds: blocked ? Math.ceil(LOGIN_ATTEMPT_WINDOW_MS / 1000) : 0,
  }
}
