import { jsonResponse } from '../responses/route-response.js'
import { getCurrentSessionService } from '../services/session-service.js'
import {
  createCalendarEventService,
  deleteCalendarEventService,
  ensureCalendarManageAccessService,
  ensureCalendarReadAccessService,
  getCalendarEventsService,
  updateCalendarEventService,
} from '../services/calendar-service.js'

export async function getCalendarEventsController(request) {
  const session = await getCurrentSessionService()
  await ensureCalendarReadAccessService(session)
  const { searchParams } = new URL(request.url)

  return jsonResponse(
    await getCalendarEventsService(session, {
      year: searchParams.get('year'),
      month: searchParams.get('month'),
    }),
  )
}

export async function createCalendarEventController(request) {
  const session = await getCurrentSessionService()
  await ensureCalendarManageAccessService(session)
  return jsonResponse(await createCalendarEventService(session, await request.json()), 201)
}

export async function updateCalendarEventController(request) {
  const session = await getCurrentSessionService()
  await ensureCalendarManageAccessService(session)
  return jsonResponse(await updateCalendarEventService(session, await request.json()))
}

export async function deleteCalendarEventController(request) {
  const session = await getCurrentSessionService()
  await ensureCalendarManageAccessService(session)
  return jsonResponse(await deleteCalendarEventService(session, await request.json()))
}
