import { jsonResponse } from '../responses/route-response.js'
import { requireSessionService } from '../services/session-service.js'
import {
  createMaterialService,
  deleteMaterialService,
  getMaterialByIdService,
  getMaterialsListService,
  updateMaterialService,
} from '../services/materials-service.js'

export async function getMaterialsController() {
  const session = await requireSessionService()
  return jsonResponse(await getMaterialsListService(session))
}

export async function createMaterialController(request) {
  const session = await requireSessionService()
  return jsonResponse(await createMaterialService(session, await request.json()), 201)
}

export async function getMaterialController(id) {
  const session = await requireSessionService()
  return jsonResponse(await getMaterialByIdService(session, id))
}

export async function updateMaterialController(request, id) {
  const session = await requireSessionService()
  return jsonResponse(await updateMaterialService(session, id, await request.json()))
}

export async function deleteMaterialController(id) {
  const session = await requireSessionService()
  return jsonResponse(await deleteMaterialService(session, id))
}
