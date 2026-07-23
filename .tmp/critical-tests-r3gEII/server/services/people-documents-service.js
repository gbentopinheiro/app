import {
  createPersonDocumentReminderDb,
  deletePersonDocumentReminderDb,
  getPersonDocumentRemindersByPersonIdDb,
  updatePersonDocumentReminderDb,
} from '../../lib/db/person-document-reminders-db.js'
import { getPersonByIdDb } from '../../lib/db/people-db.js'
import { hasPermission } from '../../lib/permissions.js'
import { HttpError } from '../errors/http-error.js'

function ensurePermission(session, permissionKey, message) {
  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, message)
  }
}

function getMutationStatus(error) {
  const message = String(error?.message || '')

  if (message.includes('obrigatorio') || message.includes('valida') || message.includes('valido')) {
    return 400
  }

  if (message.includes('nao encontrada')) {
    return 404
  }

  return 500
}

function toMutationError(error, fallbackMessage) {
  const message = String(error?.message || fallbackMessage) || fallbackMessage
  return new HttpError(getMutationStatus(error), message)
}

async function ensurePersonExists(personId) {
  const person = await getPersonByIdDb(personId)

  if (!person) {
    throw new HttpError(404, 'Pessoa nao encontrada.')
  }

  return person
}

function rethrowMutationError(error, fallbackMessage) {
  if (error instanceof HttpError) {
    throw error
  }

  if (error?.code === 'P2003') {
    throw new HttpError(404, 'Pessoa nao encontrada.')
  }

  throw toMutationError(error, fallbackMessage)
}

export async function getPeopleDocumentsListService(session, personId) {
  ensurePermission(session, 'people.documents.read', 'Sem permissao para consultar documentos.')
  await ensurePersonExists(personId)
  return getPersonDocumentRemindersByPersonIdDb(personId)
}

export async function createPeopleDocumentService(session, personId, readBody) {
  ensurePermission(session, 'people.documents.write', 'Sem permissao para criar documentos.')
  await ensurePersonExists(personId)

  const body = await readBody()

  try {
    return await createPersonDocumentReminderDb(personId, body)
  } catch (error) {
    rethrowMutationError(error, 'Erro ao criar documento.')
  }
}

export async function updatePeopleDocumentService(session, personId, documentId, readBody) {
  ensurePermission(session, 'people.documents.write', 'Sem permissao para editar documentos.')
  await ensurePersonExists(personId)

  const body = await readBody()

  try {
    const updatedDocument = await updatePersonDocumentReminderDb(personId, documentId, body)

    if (!updatedDocument) {
      throw new HttpError(404, 'Documento nao encontrado.')
    }

    return updatedDocument
  } catch (error) {
    rethrowMutationError(error, 'Erro ao atualizar documento.')
  }
}

export async function deletePeopleDocumentService(session, personId, documentId) {
  ensurePermission(session, 'people.documents.delete', 'Sem permissao para remover documentos.')
  await ensurePersonExists(personId)

  const deleted = await deletePersonDocumentReminderDb(personId, documentId)

  if (!deleted) {
    throw new HttpError(404, 'Documento nao encontrado.')
  }

  return { message: 'Documento removido com sucesso.' }
}
