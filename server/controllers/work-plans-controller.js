import { jsonResponse } from '../responses/route-response.js'
import { requireSessionService } from '../services/session-service.js'
import {
  createWorkPlanService,
  deleteWorkPlanService,
  getWorkPlanByIdService,
  getWorkPlansListService,
  updateWorkPlanService,
} from '../services/work-plans-service.js'

export async function getWorkPlansController() {
  const session = await requireSessionService()
  return jsonResponse(await getWorkPlansListService(session))
}

export async function createWorkPlanController(request) {
  const session = await requireSessionService()
  return jsonResponse(await createWorkPlanService(session, await request.json()), 201)
}

export async function getWorkPlanController(id) {
  const session = await requireSessionService()
  return jsonResponse(await getWorkPlanByIdService(session, id))
}

export async function updateWorkPlanController(request, id) {
  const session = await requireSessionService()
  return jsonResponse(await updateWorkPlanService(session, id, await request.json()))
}

export async function deleteWorkPlanController(id) {
  const session = await requireSessionService()
  return jsonResponse(await deleteWorkPlanService(session, id))
}
