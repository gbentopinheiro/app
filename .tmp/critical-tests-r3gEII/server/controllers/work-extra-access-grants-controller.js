import { HttpError } from '../errors/http-error.js'
import { jsonResponse } from '../responses/route-response.js'
import { requireSessionService } from '../services/session-service.js'
import {
  getWorkExtraAccessSelectionsService,
  replaceWorkExtraAccessSelectionsService,
} from '../services/work-extra-access-grants-service.js'

async function readRequestBody(request) {
  try {
    return await request.json()
  } catch (error) {
    throw new HttpError(
      500,
      String(error?.message || 'Corpo JSON invalido').trim() || 'Corpo JSON invalido',
    )
  }
}

export async function getWorkExtraAccessSelectionsController(request) {
  const session = await requireSessionService()
  const searchParams = new URL(request.url).searchParams
  return jsonResponse(await getWorkExtraAccessSelectionsService(session, searchParams))
}

export async function replaceWorkExtraAccessSelectionsController(request) {
  const session = await requireSessionService()
  return jsonResponse(
    await replaceWorkExtraAccessSelectionsService(session, await readRequestBody(request)),
  )
}
