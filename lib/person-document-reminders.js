import { existsSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import {
  createPersonDocumentReminderDb,
  deletePersonDocumentReminderDb,
  getAllPersonDocumentRemindersDb,
  getPersonDocumentRemindersByPersonIdDb,
  updatePersonDocumentReminderDb,
} from './db/person-document-reminders-db.js'
import { isMysqlDataSourceEnabled } from './data-source.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const remindersFilePath = join(dataDir, 'person-document-reminders.json')

export const DOCUMENT_WARNING_DAY_OPTIONS = [30, 15, 7, 1, 0]

let reminders = []
let nextId = 1
let legacyRemindersLoaded = false

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

function resetLegacyRemindersState() {
  reminders = []
  nextId = 1
}

function persistReminders() {
  if (isMysqlDataSourceEnabled()) {
    return
  }

  writeFileSync(remindersFilePath, JSON.stringify(reminders, null, 2), 'utf8')
}

function loadRemindersFromStorage() {
  if (isMysqlDataSourceEnabled()) {
    return
  }

  legacyRemindersLoaded = true

  if (!existsSync(remindersFilePath)) {
    resetLegacyRemindersState()
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
    resetLegacyRemindersState()
  }
}

function ensureLegacyRemindersLoaded() {
  if (isMysqlDataSourceEnabled()) {
    return false
  }

  if (!legacyRemindersLoaded || existsSync(remindersFilePath)) {
    loadRemindersFromStorage()
  }

  return true
}

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

function normalizeDbError(error) {
  if (error?.code === 'P2003') {
    throw new Error('Pessoa nao encontrada.')
  }

  throw error
}

export function getPersonDocumentReminders(personId) {
  if (!ensureLegacyRemindersLoaded()) {
    return sortReminders(
      reminders
        .filter(reminder => Number(reminder.personId) === Number(personId))
        .map(hydrateReminder),
    )
  }

  return sortReminders(
    reminders
      .filter(reminder => Number(reminder.personId) === Number(personId))
      .map(hydrateReminder),
  )
}

export function getAllPersonDocumentReminders() {
  if (!ensureLegacyRemindersLoaded()) {
    return sortReminders(reminders.map(hydrateReminder))
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

export function updatePersonDocumentReminder(personId, reminderId, data) {
  getPersonDocumentReminders(personId)

  const index = reminders.findIndex(
    reminder =>
      Number(reminder.personId) === Number(personId) &&
      Number(reminder.id) === Number(reminderId),
  )

  if (index === -1) {
    return null
  }

  const nextReminderInput = {
    ...reminders[index],
    ...data,
    id: reminders[index].id,
    personId: reminders[index].personId,
  }

  ensureValidReminderInput(nextReminderInput)

  const updatedReminder = normalizeReminder(
    {
      ...nextReminderInput,
      createdAt: reminders[index].createdAt,
      updatedAt: new Date().toISOString(),
    },
    reminders[index].id,
  )

  reminders[index] = updatedReminder
  persistReminders()

  return hydrateReminder(updatedReminder)
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

export async function getPersonDocumentRemindersData(personId) {
  if (!isMysqlDataSourceEnabled()) {
    return getPersonDocumentReminders(personId)
  }

  return getPersonDocumentRemindersByPersonIdDb(personId)
}

export async function getAllPersonDocumentRemindersData() {
  if (!isMysqlDataSourceEnabled()) {
    return getAllPersonDocumentReminders()
  }

  return getAllPersonDocumentRemindersDb()
}

export async function createPersonDocumentReminderData(personId, data) {
  if (!isMysqlDataSourceEnabled()) {
    return createPersonDocumentReminder(personId, data)
  }

  try {
    return await createPersonDocumentReminderDb(personId, data)
  } catch (error) {
    normalizeDbError(error)
  }
}

export async function updatePersonDocumentReminderData(personId, reminderId, data) {
  if (!isMysqlDataSourceEnabled()) {
    return updatePersonDocumentReminder(personId, reminderId, data)
  }

  try {
    return await updatePersonDocumentReminderDb(personId, reminderId, data)
  } catch (error) {
    normalizeDbError(error)
  }
}

export async function deletePersonDocumentReminderData(personId, reminderId) {
  if (!isMysqlDataSourceEnabled()) {
    return deletePersonDocumentReminder(personId, reminderId)
  }

  return deletePersonDocumentReminderDb(personId, reminderId)
}
