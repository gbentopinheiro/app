import {
  createClientData,
  deleteClientData,
  getAllClientsData,
  getClientByIdData,
  updateClientData,
} from '../../lib/clients.js'
import { hasPermission } from '../../lib/permissions.js'
import { getAllWorksData } from '../../lib/works.js'
import { HttpError } from '../errors/http-error.js'

function ensurePermission(session, permissionKey, message = 'Sem permissao para gerir clientes.') {
  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, message)
  }
}

function toClientMutationError(error, fallbackMessage) {
  const message =
    error?.code === 'P2002'
      ? 'Ja existe um cliente com esse nome'
      : error?.code === 'P2003'
        ? 'A empresa associada ao cliente nao existe'
        : String(error?.message || fallbackMessage).trim() || fallbackMessage
  const status = message === 'Ja existe um cliente com esse nome' ? 409 : 500

  return new HttpError(status, message)
}

export async function getClientsListService(session) {
  ensurePermission(session, 'clients.read')
  return getAllClientsData()
}

export async function createClientService(session, body) {
  ensurePermission(session, 'clients.create')

  const { name, vatNumber, contactName, email, phone, notes } = body || {}

  if (!name) {
    throw new HttpError(400, 'Nome do cliente e obrigatorio')
  }

  try {
    return await createClientData({ name, vatNumber, contactName, email, phone, notes })
  } catch (error) {
    throw toClientMutationError(error, 'Erro ao criar cliente')
  }
}

export async function getClientByIdService(session, id) {
  ensurePermission(session, 'clients.read')

  const client = await getClientByIdData(id)

  if (!client) {
    throw new HttpError(404, 'Cliente nao encontrado')
  }

  return client
}

export async function updateClientService(session, id, body) {
  ensurePermission(session, 'clients.update')

  const { name, vatNumber, contactName, email, phone, notes } = body || {}

  try {
    const client = await updateClientData(id, { name, vatNumber, contactName, email, phone, notes })

    if (!client) {
      throw new HttpError(404, 'Cliente nao encontrado')
    }

    return client
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toClientMutationError(error, 'Erro ao atualizar cliente')
  }
}

export async function deleteClientService(session, id) {
  ensurePermission(session, 'clients.delete')

  const linkedWorks = (await getAllWorksData()).filter(work => Number(work.clientId) === Number.parseInt(id, 10))

  if (linkedWorks.length > 0) {
    throw new HttpError(409, 'Nao e possivel remover um cliente associado a obras existentes')
  }

  const deleted = await deleteClientData(id)

  if (!deleted) {
    throw new HttpError(404, 'Cliente nao encontrado')
  }

  return { message: 'Cliente removido com sucesso' }
}
