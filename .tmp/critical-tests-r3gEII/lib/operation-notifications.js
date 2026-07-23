import { getAllDailyWorkNotesData } from './daily-work-notes.js'
import { getAllPeopleData } from './people.js'
import { getAllPersonDocumentRemindersData } from './person-document-reminders.js'

function formatNotificationDate(dateString, options = {}) {
  const date = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: options.withYear ? 'long' : '2-digit',
    ...(options.withYear ? { year: 'numeric' } : {}),
  }).format(date)
}

async function buildChefNoteNotifications({ withYear = false } = {}) {
  const notes = await getAllDailyWorkNotesData()

  return notes
    .filter(note => note.note)
    .map(note => ({
      id: `daily-note-${note.id}`,
      sourceType: 'daily-note',
      sourceId: note.id,
      deletable: true,
      chef: note.authorName || 'Chefe',
      work: note.work?.name || `Obra ${note.workId}`,
      date: formatNotificationDate(note.date, { withYear }),
      note: note.note,
      priority: 2,
      sortTimestamp: new Date(note.updatedAt || note.createdAt || 0).getTime(),
    }))
}

async function buildDocumentReminderNotifications({ withYear = false } = {}) {
  const [people, reminders] = await Promise.all([
    getAllPeopleData(),
    getAllPersonDocumentRemindersData(),
  ])
  const peopleById = new Map(people.map(person => [Number(person.id), person]))

  return reminders
    .filter(reminder => reminder.status === 'expired' || reminder.status === 'warning')
    .map(reminder => {
      const person = peopleById.get(Number(reminder.personId))
      const priority = reminder.status === 'expired' ? 0 : 1
      const expirationTimestamp = new Date(`${reminder.expirationDate}T00:00:00`).getTime()

      return {
        id: `document-reminder-${reminder.id}`,
        sourceType: 'document-reminder',
        sourceId: reminder.id,
        deletable: false,
        chef: person?.name || `Pessoa ${reminder.personId}`,
        work: reminder.name,
        date: formatNotificationDate(reminder.expirationDate, { withYear }),
        note:
          reminder.status === 'expired'
            ? 'Documento expirado.'
            : 'A expirar brevemente.',
        priority,
        sortTimestamp: Number.isFinite(expirationTimestamp) ? expirationTimestamp : 0,
      }
    })
}

function sortNotifications(list) {
  return [...list].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority
    }

    if (left.sourceType === 'daily-note' && right.sourceType === 'daily-note') {
      return right.sortTimestamp - left.sortTimestamp
    }

    return left.sortTimestamp - right.sortTimestamp
  })
}

async function resolveNotificationsForAudience(audience, options) {
  if (audience === 'responsavel') {
    return buildDocumentReminderNotifications(options)
  }

  if (audience === 'admin') {
    return buildChefNoteNotifications(options)
  }

  return [
    ...(await buildDocumentReminderNotifications(options)),
    ...(await buildChefNoteNotifications(options)),
  ]
}

export async function getOperationNotifications({ audience = 'all', withYear = false, limit } = {}) {
  const notifications = sortNotifications(await resolveNotificationsForAudience(audience, { withYear }))

  if (typeof limit === 'number') {
    return notifications.slice(0, limit)
  }

  return notifications
}
