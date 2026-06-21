import { readProtectedRequestJson } from '../../lib/login-transport.js'
import { HttpError } from '../errors/http-error.js'
import { jsonResponse } from '../responses/route-response.js'
import {
  createPersonService,
  deletePersonService,
  getPeopleListService,
  getPersonByIdService,
  updatePersonService,
} from '../services/people-service.js'
import { requireSessionService } from '../services/session-service.js'

function toProtectedRequestError(error) {
  if (error?.message?.includes('protecao') || error?.message?.includes('protegido')) {
    return new HttpError(400, 'Pedido sensivel nao protegido.')
  }

  return error
}

export async function getPeopleController() {
  const session = await requireSessionService()
  return jsonResponse(await getPeopleListService(session))
}

export async function createPersonController(request) {
  const session = await requireSessionService()

  try {
    const body = await readProtectedRequestJson(request)
    return jsonResponse(await createPersonService(session, body), 201)
  } catch (error) {
    throw toProtectedRequestError(error)
  }
}

export async function getPersonController(id) {
  const session = await requireSessionService()
  return jsonResponse(await getPersonByIdService(session, id))
}

export async function updatePersonController(request, id) {
  const session = await requireSessionService()

  try {
    const body = await readProtectedRequestJson(request)
    return jsonResponse(await updatePersonService(session, id, body))
  } catch (error) {
    throw toProtectedRequestError(error)
  }
}

export async function deletePersonController(id) {
  const session = await requireSessionService()
  return jsonResponse(await deletePersonService(session, id))
}
