import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const notificationStateFilePath = join(dataDir, 'calendar-notification-state.json')

export class CalendarNotificationStateService {
  constructor(filePath = notificationStateFilePath) {
    this.filePath = filePath
    this.items = this.load()
  }

  ensureDataDir() {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  }

  load() {
    this.ensureDataDir()

    if (!existsSync(this.filePath)) {
      return []
    }

    try {
      const rawData = JSON.parse(readFileSync(this.filePath, 'utf8'))
      return normalizeItems(rawData)
    } catch (error) {
      console.error('Error loading calendar notification state:', error.message)
      return []
    }
  }

  save() {
    this.ensureDataDir()
    writeFileSync(this.filePath, JSON.stringify(this.items, null, 2), 'utf8')
  }

  refresh() {
    this.items = this.load()
    return this.items
  }

  getByUsername(username) {
    const normalizedUsername = normalizeUsername(username)

    if (!normalizedUsername) {
      return null
    }

    return this.refresh().find(item => item.username === normalizedUsername) || null
  }

  markSeen(username, seenAt = new Date().toISOString()) {
    const normalizedUsername = normalizeUsername(username)

    if (!normalizedUsername) {
      return null
    }

    this.refresh()

    const currentIndex = this.items.findIndex(item => item.username === normalizedUsername)
    const nextItem = {
      username: normalizedUsername,
      seenAt: normalizeSeenAt(seenAt),
    }

    if (currentIndex >= 0) {
      this.items[currentIndex] = nextItem
    } else {
      this.items.push(nextItem)
    }

    this.save()
    return nextItem
  }
}

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase()
}

function normalizeSeenAt(seenAt) {
  const value = String(seenAt || '').trim()
  return Number.isNaN(new Date(value).getTime()) ? new Date().toISOString() : value
}

function normalizeItems(list) {
  if (!Array.isArray(list)) return []

  return list
    .map(item => ({
      username: normalizeUsername(item.username),
      seenAt: normalizeSeenAt(item.seenAt),
    }))
    .filter(item => item.username)
}

const calendarNotificationStateService = new CalendarNotificationStateService()

export function getCalendarNotificationState(username) {
  return calendarNotificationStateService.getByUsername(username)
}

export function markCalendarNotificationsSeen(username, seenAt) {
  return calendarNotificationStateService.markSeen(username, seenAt)
}
