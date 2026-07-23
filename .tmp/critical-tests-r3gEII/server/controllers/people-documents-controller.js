import { jsonResponse } from '../responses/route-response.js'
import { requireSessionService } from '../services/session-service.js'
import {
  createPeopleDocumentService,
  deletePeopleDocumentService,
  getPeopleDocumentsListService,
  updatePeopleDocumentService,
} from '../services/people-documents-service.js'

export async function getPeopleDocumentsController(personId) {
  const session = await requireSessionService()
  return jsonResponse(await getPeopleDocumentsListService(session, personId))
}

export async function createPeopleDocumentController(request, personId) {
  const session = await requireSessionService()
  return jsonResponse(await createPeopleDocumentService(session, personId, () => request.json()), 201)
}

export async function updatePeopleDocumentController(request, personId, documentId) {
  const session = await requireSessionService()
  return jsonResponse(
    await updatePeopleDocumentService(session, personId, documentId, () => request.json()),
  )
}

export async function deletePeopleDocumentController(personId, documentId) {
  const session = await requireSessionService()
  return jsonResponse(await deletePeopleDocumentService(session, personId, documentId))
}
