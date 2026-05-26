import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { normalizeRole } from './roles.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const loginEventsFilePath = join(dataDir, 'login-events.json')
const MAX_LOGIN_EVENTS = 2000

function ensureDataDir() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
}

function normalizeLoginEvent(event, fallbackId) {
  return {
    id: event.id !== undefined ? parseInt(event.id) || fallbackId : fallbackId,
    username: String(event.username || '').trim(),
    name: String(event.name || event.username || '').trim(),
    role: event.role ? normalizeRole(event.role) : '',
    accountType: String(event.accountType || '').trim(),
    loginAt: String(event.loginAt || '').trim(),
    userAgent: String(event.userAgent || '').trim(),
  }
}

function normalizeLoginEvents(list) {
  if (!Array.isArray(list)) {
    return []
  }

  return list
    .map((event, index) => normalizeLoginEvent(event, index + 1))
    .filter(event => event.username && event.loginAt)
}

function saveLoginEvents(events) {
  ensureDataDir()
  writeFileSync(loginEventsFilePath, JSON.stringify(normalizeLoginEvents(events), null, 2), 'utf8')
}

export function getAllLoginEvents() {
  ensureDataDir()

  if (!existsSync(loginEventsFilePath)) {
    return []
  }

  try {
    return normalizeLoginEvents(JSON.parse(readFileSync(loginEventsFilePath, 'utf8')))
      .sort((left, right) => new Date(right.loginAt).getTime() - new Date(left.loginAt).getTime())
  } catch (error) {
    console.error('Error loading login events:', error.message)
    return []
  }
}

export function recordLoginEvent(data) {
  const currentEvents = getAllLoginEvents()
  const nextEvent = normalizeLoginEvent(
    {
      ...data,
      id: currentEvents.length === 0 ? 1 : Math.max(...currentEvents.map(event => event.id)) + 1,
      loginAt: data.loginAt || new Date().toISOString(),
    },
    currentEvents.length + 1,
  )

  const nextEvents = [nextEvent, ...currentEvents].slice(0, MAX_LOGIN_EVENTS)
  saveLoginEvents(nextEvents)
  return nextEvent
}
