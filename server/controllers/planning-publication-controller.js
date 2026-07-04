import { HttpError } from '../errors/http-error.js'
import { jsonResponse } from '../responses/route-response.js'
import { requireSessionService } from '../services/session-service.js'
import {
  createPlanningDraftAssignmentService,
  deletePlanningDraftAssignmentService,
  getPlanningWorkspaceViewService,
  initializePlanningWorkspaceDraftService,
  publishPlanningWorkspaceService,
  setPlanningWorkspaceToDraftService,
  updatePlanningDraftAssignmentService,
} from '../services/planning-publication-service.js'

async function readRequestBody(request) {
  try {
    return await request.json()
  } catch (error) {
    throw new HttpError(500, String(error?.message || 'Corpo JSON invalido').trim() || 'Corpo JSON invalido')
  }
}

export async function getPlanningWorkspaceViewController(request) {
  const session = await requireSessionService()
  const searchParams = new URL(request.url).searchParams
  return jsonResponse(await getPlanningWorkspaceViewService(session, searchParams))
}

export async function initializePlanningWorkspaceDraftController(request) {
  const session = await requireSessionService()
  return jsonResponse(await initializePlanningWorkspaceDraftService(session, await readRequestBody(request)), 201)
}

export async function publishPlanningWorkspaceController(workspaceId) {
  const session = await requireSessionService()
  return jsonResponse(await publishPlanningWorkspaceService(session, workspaceId))
}

export async function setPlanningWorkspaceToDraftController(workspaceId) {
  const session = await requireSessionService()
  return jsonResponse(await setPlanningWorkspaceToDraftService(session, workspaceId))
}

export async function createPlanningDraftAssignmentController(request) {
  const session = await requireSessionService()
  return jsonResponse(await createPlanningDraftAssignmentService(session, await readRequestBody(request)), 201)
}

export async function updatePlanningDraftAssignmentController(request, assignmentId) {
  const session = await requireSessionService()
  return jsonResponse(await updatePlanningDraftAssignmentService(session, assignmentId, await readRequestBody(request)))
}

export async function deletePlanningDraftAssignmentController(assignmentId) {
  const session = await requireSessionService()
  return jsonResponse(await deletePlanningDraftAssignmentService(session, assignmentId))
}
