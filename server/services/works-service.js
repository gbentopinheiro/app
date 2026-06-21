import { getClientByIdData } from '../../lib/clients.js'
import { hasPermission } from '../../lib/permissions.js'
import { repriceWorkAssignmentsForWorkData } from '../../lib/work-assignments.js'
import {
  createWorkData,
  deleteWorkData,
  getAllWorksData,
  getWorkByIdData,
  updateWorkData,
} from '../../lib/works.js'
import { HttpError } from '../errors/http-error.js'

function ensurePermission(session, permissionKey, message = 'Sem permissao para gerir obras.') {
  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, message)
  }
}

function toWorkMutationError(error, fallbackMessage) {
  const message = String(error?.message || fallbackMessage).trim() || fallbackMessage
  const status = message === 'Ja existe uma obra com esse numero nesta empresa' ? 409 : 500
  return new HttpError(status, message)
}

export async function getWorksListService(session) {
  ensurePermission(session, 'works.read')
  return getAllWorksData()
}

export async function createWorkService(session, body) {
  ensurePermission(session, 'works.create')

  const {
    name,
    clientId,
    location,
    status,
    budget,
    defaultHourlyCost,
    roleHourlyCosts,
    specialPersonHourlyCosts,
    startDate,
    endDate,
    workingDays,
    notes,
    number,
  } = body || {}

  if (!name) {
    throw new HttpError(400, 'Nome da obra é obrigatório')
  }

  if (!clientId || !(await getClientByIdData(clientId))) {
    throw new HttpError(400, 'A obra tem de pertencer a um cliente')
  }

  if (defaultHourlyCost !== undefined && Number(defaultHourlyCost) < 0) {
    throw new HttpError(400, 'defaultHourlyCost não pode ser negativo')
  }

  if (startDate && Number.isNaN(new Date(startDate).getTime())) {
    throw new HttpError(400, 'startDate tem de ser uma data válida')
  }

  if (endDate && Number.isNaN(new Date(endDate).getTime())) {
    throw new HttpError(400, 'endDate tem de ser uma data válida')
  }

  try {
    return await createWorkData({
      name,
      clientId,
      location,
      status,
      budget,
      defaultHourlyCost,
      roleHourlyCosts,
      specialPersonHourlyCosts,
      startDate,
      endDate,
      workingDays,
      notes,
      number,
    })
  } catch (error) {
    throw toWorkMutationError(error, 'Erro ao criar obra')
  }
}

export async function getWorkByIdService(session, id) {
  ensurePermission(session, 'works.read')

  const work = await getWorkByIdData(id)

  if (!work) {
    throw new HttpError(404, 'Obra não encontrada')
  }

  return work
}

export async function updateWorkService(session, id, body) {
  ensurePermission(session, 'works.update')

  const {
    name,
    clientId,
    location,
    status,
    budget,
    defaultHourlyCost,
    roleHourlyCosts,
    specialPersonHourlyCosts,
    startDate,
    endDate,
    workingDays,
    notes,
    number,
    pricingChangeApplication,
  } = body || {}

  if (clientId !== undefined && (!clientId || !(await getClientByIdData(clientId)))) {
    throw new HttpError(400, 'A obra tem de pertencer a um cliente válido')
  }

  if (defaultHourlyCost !== undefined && Number(defaultHourlyCost) < 0) {
    throw new HttpError(400, 'defaultHourlyCost não pode ser negativo')
  }

  if (startDate && Number.isNaN(new Date(startDate).getTime())) {
    throw new HttpError(400, 'startDate tem de ser uma data válida')
  }

  if (endDate && Number.isNaN(new Date(endDate).getTime())) {
    throw new HttpError(400, 'endDate tem de ser uma data válida')
  }

  if (
    pricingChangeApplication?.startDate &&
    Number.isNaN(new Date(`${pricingChangeApplication.startDate}T00:00:00`).getTime())
  ) {
    throw new HttpError(400, 'A data de aplicacao da tarifa e invalida')
  }

  try {
    const updatedWork = await updateWorkData(id, {
      name,
      clientId,
      location,
      status,
      budget,
      defaultHourlyCost,
      roleHourlyCosts,
      specialPersonHourlyCosts,
      startDate,
      endDate,
      workingDays,
      notes,
      number,
    })

    if (!updatedWork) {
      throw new HttpError(404, 'Obra não encontrada')
    }

    const repricedAssignmentsCount = pricingChangeApplication?.startDate
      ? await repriceWorkAssignmentsForWorkData(id, pricingChangeApplication.startDate)
      : 0

    return {
      ...updatedWork,
      repricedAssignmentsCount,
      pricingAppliedFrom: pricingChangeApplication?.startDate || null,
      pricingApplicationMode: pricingChangeApplication?.mode || null,
    }
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toWorkMutationError(error, 'Erro ao atualizar obra')
  }
}

export async function deleteWorkService(session, id) {
  ensurePermission(session, 'works.delete')

  const deleted = await deleteWorkData(id)

  if (!deleted) {
    throw new HttpError(404, 'Obra não encontrada')
  }

  return { message: 'Obra removida com sucesso' }
}
