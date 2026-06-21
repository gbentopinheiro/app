import { jsonResponse } from '../responses/route-response.js'
import { requireSessionService } from '../services/session-service.js'
import {
  createWorkService,
  deleteWorkService,
  getWorkByIdService,
  getWorksListService,
  updateWorkService,
} from '../services/works-service.js'

export async function getWorksController() {
  const session = await requireSessionService()
  return jsonResponse(await getWorksListService(session))
}

export async function createWorkController(request) {
  const session = await requireSessionService()
  return jsonResponse(await createWorkService(session, await request.json()), 201)
}

export async function getWorkController(id) {
  const session = await requireSessionService()
  return jsonResponse(await getWorkByIdService(session, id))
}

export async function updateWorkController(request, id) {
  const session = await requireSessionService()
  return jsonResponse(await updateWorkService(session, id, await request.json()))
}

export async function deleteWorkController(id) {
  const session = await requireSessionService()
  return jsonResponse(await deleteWorkService(session, id))
}
