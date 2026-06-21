import { HttpError } from '../errors/http-error.js'
import { jsonResponse } from '../responses/route-response.js'
import { requireSessionService } from '../services/session-service.js'
import {
  createClientService,
  deleteClientService,
  getClientByIdService,
  getClientsListService,
  updateClientService,
} from '../services/clients-service.js'

async function readRequestBody(request) {
  try {
    return await request.json()
  } catch (error) {
    throw new HttpError(500, String(error?.message || 'Erro interno.').trim() || 'Erro interno.')
  }
}

export async function getClientsController() {
  const session = await requireSessionService()
  return jsonResponse(await getClientsListService(session))
}

export async function createClientController(request) {
  const session = await requireSessionService()
  return jsonResponse(await createClientService(session, await readRequestBody(request)), 201)
}

export async function getClientController(id) {
  const session = await requireSessionService()
  return jsonResponse(await getClientByIdService(session, id))
}

export async function updateClientController(request, id) {
  const session = await requireSessionService()
  return jsonResponse(await updateClientService(session, id, await readRequestBody(request)))
}

export async function deleteClientController(id) {
  const session = await requireSessionService()
  return jsonResponse(await deleteClientService(session, id))
}
