import { prisma } from '../prisma.js'
import {
  toDateOnlyString,
  toDateOnlyValue,
  toDateTimeString,
  toOptionalString,
  toPositiveInt,
  toRequiredString,
} from './core-mappers.js'

export const DOCUMENT_WARNING_DAY_OPTIONS_DB = [30, 15, 7, 1, 0]

function isValidDateValue(value) {
  const normalizedValue = String(value || '').trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return false
  }

  return !Number.isNaN(new Date(`${normalizedValue}T00:00:00`).getTime())
}

function normalizeWarningDays(value) {
  const normalizedValue = Number.parseInt(value, 10)
  return DOCUMENT_WARNING_DAY_OPTIONS_DB.includes(normalizedValue) ? normalizedValue : 30
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

function hydrateReminder(reminder) {
  return {
    ...reminder,
    warningDaysLabel: getWarningDaysLabel(reminder.warningDays),
    ...getDocumentStatus(reminder),
  }
}

function mapReminderRecord(record) {
  if (!record) {
    return null
  }

  return hydrateReminder({
    id: Number(record.id),
    personId: Number(record.personId),
    name: toRequiredString(record.name),
    expirationDate: toDateOnlyString(record.expirationDate) || '',
    warningDays: normalizeWarningDays(record.warningDays),
    notes: toRequiredString(record.notes),
    createdAt: toDateTimeString(record.createdAt),
    updatedAt: toDateTimeString(record.updatedAt),
  })
}

function buildReminderMutationData(data, currentReminder = null) {
  const expirationDate =
    data?.expirationDate !== undefined
      ? String(data.expirationDate || '').trim()
      : String(currentReminder?.expirationDate || '').trim()

  return {
    personId:
      data?.personId !== undefined
        ? toPositiveInt(data.personId)
        : toPositiveInt(currentReminder?.personId),
    name:
      data?.name !== undefined
        ? toRequiredString(data.name)
        : toRequiredString(currentReminder?.name),
    expirationDate: toDateOnlyValue(expirationDate),
    warningDays:
      data?.warningDays !== undefined
        ? normalizeWarningDays(data.warningDays)
        : normalizeWarningDays(currentReminder?.warningDays),
    notes:
      data?.notes !== undefined
        ? toOptionalString(data.notes)
        : toOptionalString(currentReminder?.notes),
  }
}

function ensureValidReminderInput(data) {
  if (!String(data?.name || '').trim()) {
    throw new Error('O nome do documento e obrigatorio.')
  }

  if (!isValidDateValue(data?.expirationDate)) {
    throw new Error('A data de expiracao tem de ser valida.')
  }

  if (!DOCUMENT_WARNING_DAY_OPTIONS_DB.includes(Number.parseInt(data?.warningDays, 10))) {
    throw new Error('Seleciona um prazo de aviso valido.')
  }
}

async function getNextReminderIdDb() {
  const result = await prisma.personDocumentReminder.aggregate({
    _max: {
      id: true,
    },
  })

  return Number(result?._max?.id || 0) + 1
}

export async function getAllPersonDocumentRemindersDb() {
  const reminders = await prisma.personDocumentReminder.findMany({
    orderBy: [{ expirationDate: 'asc' }, { name: 'asc' }, { id: 'asc' }],
  })

  return reminders.map(mapReminderRecord)
}

export async function getPersonDocumentRemindersByPersonIdDb(personId) {
  const normalizedPersonId = toPositiveInt(personId)

  if (!normalizedPersonId) {
    return []
  }

  const reminders = await prisma.personDocumentReminder.findMany({
    where: {
      personId: normalizedPersonId,
    },
    orderBy: [{ expirationDate: 'asc' }, { name: 'asc' }, { id: 'asc' }],
  })

  return reminders.map(mapReminderRecord)
}

export async function getPersonDocumentReminderByIdDb(personId, reminderId) {
  const normalizedPersonId = toPositiveInt(personId)
  const normalizedReminderId = toPositiveInt(reminderId)

  if (!normalizedPersonId || !normalizedReminderId) {
    return null
  }

  const reminder = await prisma.personDocumentReminder.findFirst({
    where: {
      id: normalizedReminderId,
      personId: normalizedPersonId,
    },
  })

  return mapReminderRecord(reminder)
}

export async function createPersonDocumentReminderDb(personId, data) {
  const normalizedPersonId = toPositiveInt(personId)
  ensureValidReminderInput(data)

  const nextReminderState = buildReminderMutationData({
    ...data,
    personId: normalizedPersonId,
  })
  const createData = {
    id: toPositiveInt(data?.id) || (await getNextReminderIdDb()),
    ...nextReminderState,
  }

  if (data?.createdAt) {
    createData.createdAt = new Date(data.createdAt)
  }

  if (data?.updatedAt) {
    createData.updatedAt = new Date(data.updatedAt)
  }

  const reminder = await prisma.personDocumentReminder.create({
    data: createData,
  })

  return mapReminderRecord(reminder)
}

export async function updatePersonDocumentReminderDb(personId, reminderId, data) {
  const currentReminder = await getPersonDocumentReminderByIdDb(personId, reminderId)

  if (!currentReminder) {
    return null
  }

  const nextStateInput = {
    personId: currentReminder.personId,
    name: data?.name !== undefined ? data.name : currentReminder.name,
    expirationDate: data?.expirationDate !== undefined ? data.expirationDate : currentReminder.expirationDate,
    warningDays: data?.warningDays !== undefined ? data.warningDays : currentReminder.warningDays,
    notes: data?.notes !== undefined ? data.notes : currentReminder.notes,
  }

  ensureValidReminderInput(nextStateInput)

  const nextReminderState = buildReminderMutationData(nextStateInput, currentReminder)
  const updateData = {
    ...nextReminderState,
  }

  if (data?.createdAt) {
    updateData.createdAt = new Date(data.createdAt)
  }

  if (data?.updatedAt) {
    updateData.updatedAt = new Date(data.updatedAt)
  }

  const reminder = await prisma.personDocumentReminder.update({
    where: {
      id: Number(currentReminder.id),
    },
    data: updateData,
  })

  return mapReminderRecord(reminder)
}

export async function deletePersonDocumentReminderDb(personId, reminderId) {
  const normalizedPersonId = toPositiveInt(personId)
  const normalizedReminderId = toPositiveInt(reminderId)

  if (!normalizedPersonId || !normalizedReminderId) {
    return false
  }

  try {
    const result = await prisma.personDocumentReminder.deleteMany({
      where: {
        id: normalizedReminderId,
        personId: normalizedPersonId,
      },
    })

    return Number(result?.count) > 0
  } catch (error) {
    return false
  }
}

export async function replaceAllPersonDocumentRemindersDb(reminders = []) {
  const normalizedReminders = Array.isArray(reminders)
    ? reminders
        .map((reminder, index) => {
          if (!toPositiveInt(reminder?.personId)) {
            return null
          }

          ensureValidReminderInput(reminder)

          const nextReminderState = buildReminderMutationData(reminder)
          const normalizedId = toPositiveInt(reminder?.id, index + 1)

          if (!normalizedId || !nextReminderState.name || !nextReminderState.expirationDate) {
            return null
          }

          return {
            id: normalizedId,
            ...nextReminderState,
            createdAt: reminder?.createdAt ? new Date(reminder.createdAt) : new Date(),
            updatedAt: reminder?.updatedAt ? new Date(reminder.updatedAt) : new Date(),
          }
        })
        .filter(Boolean)
    : []

  await prisma.$transaction(async transaction => {
    await transaction.personDocumentReminder.deleteMany()

    if (normalizedReminders.length > 0) {
      await transaction.personDocumentReminder.createMany({
        data: normalizedReminders,
      })
    }
  })

  return normalizedReminders.map(reminder =>
    mapReminderRecord({
      ...reminder,
      expirationDate: reminder.expirationDate,
    }),
  )
}
