import { HttpError } from '../errors/http-error.js'
import { jsonResponse } from '../responses/route-response.js'
import { requireSessionService } from '../services/session-service.js'
import {
  approveWorkAssignmentsBatchService,
  approveWorkAssignmentService,
  createWorkAssignmentService,
  deleteWorkAssignmentService,
  getWorkAssignmentByIdService,
  getWorkAssignmentsListService,
  submitWorkAssignmentService,
  updateWorkAssignmentService,
} from '../services/work-assignments-service.js'

async function readRequestBody(request) {
  try {
    return await request.json()
  } catch (error) {
    throw new HttpError(500, String(error?.message || 'Corpo JSON invalido').trim() || 'Corpo JSON invalido')
  }
}

export async function getWorkAssignmentsController(request) {
  const session = await requireSessionService()
  const searchParams = new URL(request.url).searchParams
  return jsonResponse(await getWorkAssignmentsListService(session, searchParams))
}

export async function createWorkAssignmentController(request) {
  const session = await requireSessionService()
  return jsonResponse(await createWorkAssignmentService(session, await readRequestBody(request)), 201)
}

export async function getWorkAssignmentController(id) {
  const session = await requireSessionService()
  return jsonResponse(await getWorkAssignmentByIdService(session, id))
}

export async function updateWorkAssignmentController(request, id) {
  const session = await requireSessionService()
  return jsonResponse(await updateWorkAssignmentService(session, id, await readRequestBody(request)))
}

export async function deleteWorkAssignmentController(id) {
  const session = await requireSessionService()
  return jsonResponse(await deleteWorkAssignmentService(session, id))
}

export async function submitWorkAssignmentController(id) {
  const session = await requireSessionService()
  return jsonResponse(await submitWorkAssignmentService(session, id))
}

export async function approveWorkAssignmentController(request, id) {
  const session = await requireSessionService()
  return jsonResponse(await approveWorkAssignmentService(session, id, await readRequestBody(request)))
}

export async function approveWorkAssignmentsBatchController(request) {
  const session = await requireSessionService()
  return jsonResponse(await approveWorkAssignmentsBatchService(session, await readRequestBody(request)))
}
