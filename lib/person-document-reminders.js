import { existsSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const remindersFilePath = join(dataDir, 'person-document-reminders.json')

export const DOCUMENT_WARNING_DAY_OPTIONS = [30, 15, 7, 1, 0]

let reminders = []
let nextId = 1

function isValidDateValue(value) {
  const normalizedValue = String(value || '').trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return false
  }

  return !Number.isNaN(new Date(`${normalizedValue}T00:00:00`).getTime())
}

function normalizeWarningDays(value) {
  const normalizedValue = Number.parseInt(value, 10)
  return DOCUMENT_WARNING_DAY_OPTIONS.includes(normalizedValue) ? normalizedValue : 30
}

function getWarningDaysLabel(warningDays) {
  if (warningDays === 0) {
    return 'No proprio dia'
  }

  return `${warningDays} ${warningDays === 1 ? 'dia antes' : 'dias antes'}`
}

function toUtcTimestamp(dateValue) {
  const [year, month, day] = String(dateValue || '').split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

function getTodayDateKey() {
  return new Intl.DateTimeFormat('sv-SE').format(new Date())
}

function formatUtcDateKey(timestamp) {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDaysUntilExpiration(expirationDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  const todayTimestamp = toUtcTimestamp(getTodayDateKey())
  const expirationTimestamp = toUtcTimestamp(expirationDate)
  return Math.round((expirationTimestamp - todayTimestamp) / millisecondsPerDay)
}

function getWarningDate(expirationDate, warningDays) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  const expirationTimestamp = toUtcTimestamp(expirationDate)
  return formatUtcDateKey(expirationTimestamp - Number(warningDays || 0) * millisecondsPerDay)
}

function getDocumentStatus(reminder) {
  const todayDate = getTodayDateKey()
  const daysUntilExpiration = getDaysUntilExpiration(reminder.expirationDate)
  const warningDate = getWarningDate(reminder.expirationDate, reminder.warningDays)

  if (daysUntilExpiration < 0) {
    return {
      status: 'expired',
      statusLabel: 'Expirado',
      daysUntilExpiration,
      warningDate,
    }
  }

  if (todayDate >= warningDate) {
    return {
      status: 'warning',
      statusLabel: 'A expirar brevemente',
      daysUntilExpiration,
      warningDate,
    }
  }

  return {
    status: 'valid',
    statusLabel: 'Valido',
    daysUntilExpiration,
    warningDate,
  }
}

function normalizeReminder(reminder, fallbackId) {
  return {
    id: Number.parseInt(reminder.id, 10) > 0 ? Number.parseInt(reminder.id, 10) : fallbackId,
    personId: Number.parseInt(reminder.personId, 10) || 0,
    name: String(reminder.name || '').trim(),
    expirationDate: isValidDateValue(reminder.expirationDate) ? String(reminder.expirationDate).trim() : '',
    warningDays: normalizeWarningDays(reminder.warningDays),
    notes: String(reminder.notes || '').trim(),
    createdAt: String(reminder.createdAt || new Date().toISOString()),
    updatedAt: String(reminder.updatedAt || reminder.createdAt || new Date().toISOString()),
  }
}

function hydrateReminder(reminder) {
  return {
    ...reminder,
    warningDaysLabel: getWarningDaysLabel(reminder.warningDays),
    ...getDocumentStatus(reminder),
  }
}

function sortReminders(list) {
  return [...list].sort((left, right) => {
    const dateComparison = String(left.expirationDate || '').localeCompare(String(right.expirationDate || ''))

    if (dateComparison !== 0) {
      return dateComparison
    }

    return String(left.name || '').localeCompare(String(right.name || ''), 'pt-PT', { sensitivity: 'base' })
  })
}

function syncNextId() {
  nextId = reminders.length === 0 ? 1 : Math.max(...reminders.map(reminder => reminder.id)) + 1
}

function persistReminders() {
  writeFileSync(remindersFilePath, JSON.stringify(reminders, null, 2), 'utf8')
}

function loadRemindersFromStorage() {
  if (!existsSync(remindersFilePath)) {
    reminders = []
    nextId = 1
    return
  }

  try {
    const jsonData = JSON.parse(readFileSync(remindersFilePath, 'utf8'))
    reminders = Array.isArray(jsonData)
      ? jsonData
          .map((reminder, index) => normalizeReminder(reminder, index + 1))
          .filter(reminder => reminder.personId > 0 && reminder.name && reminder.expirationDate)
      : []
    syncNextId()
  } catch (error) {
    console.error('Error loading person document reminders:', error.message)
    reminders = []
    nextId = 1
  }
}

loadRemindersFromStorage()

function ensureValidReminderInput(data) {
  if (!String(data?.name || '').trim()) {
    throw new Error('O nome do documento e obrigatorio.')
  }

  if (!isValidDateValue(data?.expirationDate)) {
    throw new Error('A data de expiracao tem de ser valida.')
  }

  if (!DOCUMENT_WARNING_DAY_OPTIONS.includes(Number.parseInt(data?.warningDays, 10))) {
    throw new Error('Seleciona um prazo de aviso valido.')
  }
}

export function getPersonDocumentReminders(personId) {
  if (existsSync(remindersFilePath)) {
    loadRemindersFromStorage()
  }

  return sortReminders(
    reminders
      .filter(reminder => Number(reminder.personId) === Number(personId))
      .map(hydrateReminder),
  )
}

export function getAllPersonDocumentReminders() {
  if (existsSync(remindersFilePath)) {
    loadRemindersFromStorage()
  }

  return sortReminders(reminders.map(hydrateReminder))
}

export function createPersonDocumentReminder(personId, data) {
  getPersonDocumentReminders(personId)
  ensureValidReminderInput(data)

  const now = new Date().toISOString()
  const reminder = normalizeReminder(
    {
      id: nextId++,
      personId: Number(personId),
      name: data.name,
      expirationDate: data.expirationDate,
      warningDays: data.warningDays,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    },
    nextId,
  )

  reminders.push(reminder)
  persistReminders()

  return hydrateReminder(reminder)
}

export function deletePersonDocumentReminder(personId, reminderId) {
  getPersonDocumentReminders(personId)

  const index = reminders.findIndex(
    reminder =>
      Number(reminder.personId) === Number(personId) &&
      Number(reminder.id) === Number(reminderId),
  )

  if (index === -1) {
    return false
  }

  reminders.splice(index, 1)
  syncNextId()
  persistReminders()
  return true
}
