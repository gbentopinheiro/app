import {
  createCalendarEventDb,
  deleteCalendarEventDb,
  getAllCalendarEventsDb,
  updateCalendarEventDb,
} from '../../lib/db/calendar-events-db.js'
import { markCalendarNotificationsSeenDb } from '../../lib/db/calendar-notifications-db.js'
import { isFeatureEnabled } from '../../lib/feature-flags.js'
import { hasPermission } from '../../lib/permissions.js'
import { HttpError } from '../errors/http-error.js'

async function ensureCalendarPermission(session, permissionKey) {
  if (!(await isFeatureEnabled('calendarManagement'))) {
    throw new HttpError(503, 'O calendario esta desativado.')
  }

  if (!session) {
    throw new HttpError(401, 'Sessao expirada.')
  }

  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, 'Sem permissao.')
  }
}

export async function ensureCalendarReadAccessService(session) {
  await ensureCalendarPermission(session, 'calendar.read')
}

export async function ensureCalendarManageAccessService(session) {
  await ensureCalendarPermission(session, 'calendar.manage')
}

export async function getCalendarEventsService(session, filters = {}) {
  await ensureCalendarReadAccessService(session)

  return getAllCalendarEventsDb({
    year: filters?.year,
    month: filters?.month,
  })
}

export async function createCalendarEventService(session, body) {
  await ensureCalendarManageAccessService(session)

  const event = await createCalendarEventDb({
    date: body?.date,
    title: body?.title,
    type: body?.type,
    transport: body?.transport,
    airport: body?.airport,
    destination: body?.destination,
    departureDate: body?.departureDate,
    arrivalDate: body?.arrivalDate,
    departureTime: body?.departureTime,
    arrivalTime: body?.arrivalTime,
    color: body?.color,
    createdBy: session.name || session.username,
  })

  await markCalendarNotificationsSeenDb(session.username, event.updatedAt || event.createdAt)

  return event
}

export async function updateCalendarEventService(session, body) {
  await ensureCalendarManageAccessService(session)

  const event = await updateCalendarEventDb(body?.id, {
    date: body?.date,
    title: body?.title,
    type: body?.type,
    transport: body?.transport,
    airport: body?.airport,
    destination: body?.destination,
    departureDate: body?.departureDate,
    arrivalDate: body?.arrivalDate,
    departureTime: body?.departureTime,
    arrivalTime: body?.arrivalTime,
    color: body?.color,
    createdBy: session.name || session.username,
  })

  await markCalendarNotificationsSeenDb(session.username, event.updatedAt || event.createdAt)

  return event
}

export async function deleteCalendarEventService(session, body) {
  await ensureCalendarManageAccessService(session)
  return deleteCalendarEventDb(body?.id)
}
