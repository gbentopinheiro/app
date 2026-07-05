import { resolveCompanyId } from '../../lib/companies.js'
import { hasPermission } from '../../lib/permissions.js'
import {
  createPlanningDraftAssignmentData,
  deletePlanningDraftAssignmentData,
  getPlanningWorkspaceViewData,
  initializePlanningWorkspaceDraftData,
  publishPlanningWorkspaceData,
  setPlanningWorkspaceToDraftData,
  updatePlanningDraftAssignmentData,
} from '../../lib/planning-publication.js'
import { HttpError } from '../errors/http-error.js'

function ensurePermission(session, permissionKey, message = 'Sem permissao para gerir o planeamento diario.') {
  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, message)
  }
}

function toPlanningMutationError(error, fallbackMessage) {
  const message = String(error?.message || fallbackMessage).trim() || fallbackMessage
  const status =
    message.includes('nao encontrado') ||
    message.includes('não encontrado') ||
    message.includes('Nao existe') ||
    message.includes('Não existe')
      ? 404
      : message.includes('obrigatorio') ||
          message.includes('obrigatório') ||
          message.includes('Ja existe') ||
          message.includes('Já existe') ||
          message.includes('data valida') ||
          message.includes('data válida') ||
          message.includes('negativo') ||
          message.includes('voltar a rascunho')
        ? 400
        : 500

  return new HttpError(status, message)
}

export async function getPlanningWorkspaceViewService(session, searchParams) {
  ensurePermission(session, 'work_plans.read', 'Sem permissao para consultar o planeamento diario.')

  const date = searchParams.get('date')
  const companyId = resolveCompanyId(searchParams.get('companyId'))

  if (!date) {
    throw new HttpError(400, 'date e obrigatorio')
  }

  return getPlanningWorkspaceViewData({ date, companyId })
}

export async function initializePlanningWorkspaceDraftService(session, body) {
  ensurePermission(session, 'work_plans.create')

  const date = body?.date
  const clonePreviousDay = body?.clonePreviousDay === true
  const onlyIfMissing = body?.onlyIfMissing === true
  const companyId = resolveCompanyId(body?.companyId)

  if (!date) {
    throw new HttpError(400, 'date e obrigatorio')
  }

  if (clonePreviousDay) {
    ensurePermission(
      session,
      'work_plans.copy_previous',
      'Sem permissao para copiar o planeamento anterior.',
    )
  }

  try {
    return await initializePlanningWorkspaceDraftData({
      date,
      companyId,
      clonePreviousDay,
      onlyIfMissing,
    })
  } catch (error) {
    throw toPlanningMutationError(error, 'Erro ao preparar rascunho do planeamento')
  }
}

export async function publishPlanningWorkspaceService(session, workspaceId) {
  ensurePermission(session, 'work_plans.update')

  try {
    return await publishPlanningWorkspaceData(workspaceId)
  } catch (error) {
    throw toPlanningMutationError(error, 'Erro ao publicar planeamento')
  }
}

export async function setPlanningWorkspaceToDraftService(session, workspaceId) {
  ensurePermission(session, 'work_plans.update')

  try {
    return await setPlanningWorkspaceToDraftData(workspaceId)
  } catch (error) {
    throw toPlanningMutationError(error, 'Erro ao voltar o planeamento para rascunho')
  }
}

export async function createPlanningDraftAssignmentService(session, body) {
  ensurePermission(session, 'work_assignments.create', 'Sem permissao para criar afetações no rascunho.')

  const workspaceId = Number(body?.workspaceId)
  const workId = Number(body?.workId)
  const personId = Number(body?.personId)

  if (!workspaceId || !workId || !personId) {
    throw new HttpError(400, 'workspaceId, workId e personId sao obrigatorios')
  }

  try {
    return await createPlanningDraftAssignmentData(workspaceId, body || {})
  } catch (error) {
    throw toPlanningMutationError(error, 'Erro ao criar afetação no rascunho')
  }
}

export async function updatePlanningDraftAssignmentService(session, assignmentId, body) {
  ensurePermission(session, 'work_assignments.update', 'Sem permissao para editar afetações no rascunho.')

  try {
    const assignment = await updatePlanningDraftAssignmentData(assignmentId, body || {})

    if (!assignment) {
      throw new HttpError(404, 'Afetação de rascunho não encontrada')
    }

    return assignment
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toPlanningMutationError(error, 'Erro ao atualizar afetação no rascunho')
  }
}

export async function deletePlanningDraftAssignmentService(session, assignmentId) {
  ensurePermission(session, 'work_assignments.delete', 'Sem permissao para remover afetações do rascunho.')

  try {
    const deleted = await deletePlanningDraftAssignmentData(assignmentId)

    if (!deleted) {
      throw new HttpError(404, 'Afetação de rascunho não encontrada')
    }

    return { message: 'Afetação de rascunho removida com sucesso' }
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toPlanningMutationError(error, 'Erro ao remover afetação do rascunho')
  }
}
