import { jsonResponse } from '../responses/route-response.js'
import { getCurrentSessionService } from '../services/session-service.js'
import {
  deleteDailyWorkNotesService,
  getDailyWorkNotesService,
  upsertDailyWorkNoteService,
} from '../services/daily-work-notes-service.js'

export async function getDailyWorkNotesController(request) {
  const session = await getCurrentSessionService()
  const { searchParams } = new URL(request.url)

  return jsonResponse(await getDailyWorkNotesService(session, searchParams))
}

export async function upsertDailyWorkNoteController(request) {
  const session = await getCurrentSessionService()
  return jsonResponse(await upsertDailyWorkNoteService(session, await request.json()))
}

export async function deleteDailyWorkNotesController(request) {
  const session = await getCurrentSessionService()
  return jsonResponse(await deleteDailyWorkNotesService(session, await request.json()))
}
