import { canManageEntireApp } from '../../lib/auth.js'
import { isDailyPlanLocked } from '../../lib/daily-plan-lock.js'
import { isFeatureEnabled } from '../../lib/feature-flags.js'
import { hasPermission } from '../../lib/permissions.js'
import { isChefRole } from '../../lib/roles.js'
import {
  canAccessAssignment,
  canAccessWork,
  extendDefaultsForChef,
  filterAssignmentsForSession,
  filterDefaultsForSession,
  isChefPersonAllowedForWork,
  isDailyPlanStructureUpdate,
  resolveDailyPlanDate,
  resolvePreviewScopedSession,
} from '../../lib/work-assignment-policy.js'
import {
  createWorkAssignmentData,
  deleteWorkAssignmentData,
  getAllWorkAssignmentsData,
  getAssignmentDefaultsData,
  getWorkAssignmentByIdData,
  submitWorkAssignmentData,
  updateWorkAssignmentData,
} from '../../lib/work-assignments.js'
import { HttpError } from '../errors/http-error.js'

function ensurePermission(session, permissionKey, message) {
  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, message)
  }
}

function toAssignmentMutationError(error, fallbackMessage) {
  const message = String(error?.message || fallbackMessage).trim() || fallbackMessage
  const status = message.includes('nao encontrado') ? 404 : 500
  return new HttpError(status, message)
}

export async function getWorkAssignmentsListService(session, searchParams) {
  const scopedSession = await resolvePreviewScopedSession(session, searchParams)

  ensurePermission(
    scopedSession,
    'work_assignments.read',
    'Sem permissao para consultar afetacoes.',
  )

  const includeDefaults = searchParams.get('includeDefaults') === 'true'
  const filters = {
    workPlanId: searchParams.get('workPlanId'),
    workId: searchParams.get('workId'),
    personId: searchParams.get('personId'),
    date: searchParams.get('date'),
  }

  if (isChefRole(scopedSession.role) && filters.workId && !canAccessWork(scopedSession, filters.workId)) {
    throw new HttpError(403, 'Sem permissao para esta obra.')
  }

  const assignments = filterAssignmentsForSession(
    await getAllWorkAssignmentsData(filters),
    scopedSession,
  )

  if (!includeDefaults) {
    return assignments
  }

  const defaults = await getAssignmentDefaultsData()

  return {
    items: assignments,
    defaults: isChefRole(scopedSession.role)
      ? await extendDefaultsForChef(defaults, scopedSession, filters)
      : filterDefaultsForSession(defaults, scopedSession),
  }
}

export async function createWorkAssignmentService(session, body) {
  ensurePermission(session, 'work_assignments.create', 'Sem permissao para criar afetacoes.')

  const {
    workPlanId,
    workId,
    personId,
    date,
    hours,
    hourlyCost,
    manualHourlyCost,
    notes,
    hasWorkAccess,
  } = body || {}
  const targetDate = await resolveDailyPlanDate({ workPlanId, date })

  if (!workId || !personId || (!workPlanId && !date)) {
    throw new HttpError(400, 'workPlanId, workId e personId sao obrigatorios')
  }

  if (isDailyPlanLocked(targetDate)) {
    throw new HttpError(
      403,
      'Depois das 08:00 ja nao e possivel alterar o plano diario deste dia.',
    )
  }

  if (!canAccessWork(session, workId)) {
    throw new HttpError(403, 'Sem permissao para registar horas nesta obra.')
  }

  if (!(await isChefPersonAllowedForWork(session, { workPlanId, date, workId, personId }))) {
    throw new HttpError(
      403,
      'O chefe so pode registar pessoas colocadas pelo administrador no plano diario dessa obra.',
    )
  }

  if (date && Number.isNaN(new Date(date).getTime())) {
    throw new HttpError(400, 'date tem de ser uma data valida')
  }

  if (hours === undefined || Number(hours) < 0) {
    throw new HttpError(400, 'hours tem de ser 0 ou maior')
  }

  if (hourlyCost !== undefined && Number(hourlyCost) < 0) {
    throw new HttpError(400, 'hourlyCost nao pode ser negativo')
  }

  try {
    return await createWorkAssignmentData({
      workPlanId,
      workId,
      personId,
      date,
      hours,
      hourlyCost,
      manualHourlyCost,
      notes,
      hasWorkAccess,
    })
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toAssignmentMutationError(error, 'Erro ao criar afetacao')
  }
}

export async function getWorkAssignmentByIdService(session, id) {
  ensurePermission(session, 'work_assignments.read', 'Sem permissao para consultar afetacoes.')

  const assignment = await getWorkAssignmentByIdData(id)

  if (!assignment) {
    throw new HttpError(404, 'Afetacao nao encontrada')
  }

  if (!canAccessAssignment(session, assignment)) {
    throw new HttpError(403, 'Sem permissao para esta afetacao.')
  }

  return assignment
}

export async function updateWorkAssignmentService(session, id, body) {
  ensurePermission(session, 'work_assignments.update', 'Sem permissao para atualizar afetacoes.')

  const currentAssignment = await getWorkAssignmentByIdData(id)

  if (!currentAssignment) {
    throw new HttpError(404, 'Afetacao nao encontrada')
  }

  if (!canAccessAssignment(session, currentAssignment)) {
    throw new HttpError(403, 'Sem permissao para esta afetacao.')
  }

  const {
    workPlanId,
    workId,
    personId,
    date,
    hours,
    hourlyCost,
    manualHourlyCost,
    notes,
    hasWorkAccess,
    submitted,
  } = body || {}

  if (isDailyPlanLocked(currentAssignment.date) && isDailyPlanStructureUpdate(body || {})) {
    throw new HttpError(
      403,
      'Depois das 08:00 ja nao e possivel alterar o plano diario deste dia.',
    )
  }

  const targetWorkId = workId !== undefined ? Number(workId) : Number(currentAssignment.workId)
  const targetPersonId = personId !== undefined ? Number(personId) : Number(currentAssignment.personId)
  const targetWorkPlanId = workPlanId !== undefined ? workPlanId : currentAssignment.workPlan?.id
  const targetDate = date !== undefined ? date : currentAssignment.date

  if (workId !== undefined && !canAccessWork(session, workId)) {
    throw new HttpError(403, 'Sem permissao para mover a afetacao para essa obra.')
  }

  if (!(await isChefPersonAllowedForWork(session, {
    workPlanId: targetWorkPlanId,
    date: targetDate,
    workId: targetWorkId,
    personId: targetPersonId,
  }))) {
    throw new HttpError(
      403,
      'O chefe so pode registar pessoas colocadas pelo administrador no plano diario dessa obra.',
    )
  }

  if (date && Number.isNaN(new Date(date).getTime())) {
    throw new HttpError(400, 'date tem de ser uma data valida')
  }

  if (hours !== undefined && Number(hours) < 0) {
    throw new HttpError(400, 'hours tem de ser 0 ou maior')
  }

  if (hourlyCost !== undefined && Number(hourlyCost) < 0) {
    throw new HttpError(400, 'hourlyCost nao pode ser negativo')
  }

  const shouldAutoSubmitFromAdmin = canManageEntireApp(session.role) && hours !== undefined

  if (submitted !== undefined && !shouldAutoSubmitFromAdmin) {
    throw new HttpError(
      403,
      'O status so pode ser alterado pelo fluxo de submissao do chefe.',
    )
  }

  const submittedAt = shouldAutoSubmitFromAdmin
    ? currentAssignment.submittedAt || new Date().toISOString()
    : undefined
  const submittedBy = shouldAutoSubmitFromAdmin
    ? currentAssignment.submittedBy || session.name || session.id || 'Administrador'
    : undefined

  try {
    const assignment = await updateWorkAssignmentData(
      id,
      {
        workPlanId,
        workId,
        personId,
        date,
        hours,
        hourlyCost,
        manualHourlyCost,
        notes,
        hasWorkAccess,
        submitted: shouldAutoSubmitFromAdmin ? true : undefined,
        submittedAt,
        submittedBy,
      },
      {
        actorSession: shouldAutoSubmitFromAdmin ? session : null,
      },
    )

    if (!assignment) {
      throw new HttpError(404, 'Afetacao nao encontrada')
    }

    return assignment
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toAssignmentMutationError(error, 'Erro ao atualizar afetacao')
  }
}

export async function deleteWorkAssignmentService(session, id) {
  ensurePermission(session, 'work_assignments.delete', 'Sem permissao para remover afetacoes.')

  const assignment = await getWorkAssignmentByIdData(id)

  if (!assignment) {
    throw new HttpError(404, 'Afetacao nao encontrada')
  }

  if (!canAccessAssignment(session, assignment)) {
    throw new HttpError(403, 'Sem permissao para esta afetacao.')
  }

  if (isDailyPlanLocked(assignment.date)) {
    throw new HttpError(
      403,
      'Depois das 08:00 ja nao e possivel alterar o plano diario deste dia.',
    )
  }

  const deleted = await deleteWorkAssignmentData(id)

  if (!deleted) {
    throw new HttpError(404, 'Afetacao nao encontrada')
  }

  return { message: 'Afetacao removida com sucesso' }
}

export async function submitWorkAssignmentService(session, id) {
  if (!(await isFeatureEnabled('hoursSubmission'))) {
    throw new HttpError(503, 'A submissao de horas esta desativada.')
  }

  ensurePermission(session, 'work_assignments.submit', 'Apenas chefes podem submeter horas.')

  const currentAssignment = await getWorkAssignmentByIdData(id)

  if (!currentAssignment) {
    throw new HttpError(404, 'Afetacao nao encontrada')
  }

  if (!canAccessAssignment(session, currentAssignment)) {
    throw new HttpError(403, 'Sem permissao para esta afetacao.')
  }

  if (!isChefRole(session.role)) {
    throw new HttpError(403, 'Apenas chefes podem submeter horas.')
  }

  if (currentAssignment.submitted) {
    throw new HttpError(400, 'Esta afetacao ja foi submetida e nao pode ser modificada.')
  }

  try {
    const assignment = await submitWorkAssignmentData(id, session.name || session.id, {
      actorSession: session,
    })

    if (!assignment) {
      throw new HttpError(404, 'Afetacao nao encontrada')
    }

    return assignment
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toAssignmentMutationError(error, 'Erro ao submeter horas')
  }
}

export async function approveWorkAssignmentService(session, id, body) {
  if (!(await isFeatureEnabled('hoursApproval'))) {
    throw new HttpError(503, 'A aprovacao de horas esta desativada.')
  }

  ensurePermission(session, 'work_assignments.approve', 'Apenas administradores podem aprovar horas.')

  const currentAssignment = await getWorkAssignmentByIdData(id)

  if (!currentAssignment) {
    throw new HttpError(404, 'Afetacao nao encontrada')
  }

  if (!canAccessAssignment(session, currentAssignment)) {
    throw new HttpError(403, 'Sem permissao para esta afetacao.')
  }

  const { approvedHours } = body || {}

  if (approvedHours === undefined || Number(approvedHours) < 0) {
    throw new HttpError(400, 'approvedHours tem de ser 0 ou maior')
  }

  try {
    const assignment = await updateWorkAssignmentData(
      id,
      {
        approvedHours: Number(approvedHours),
        adminApprovedAt: new Date().toISOString(),
        adminApprovedBy: session.name || session.username || session.userId,
      },
      {
        actorSession: session,
      },
    )

    if (!assignment) {
      throw new HttpError(404, 'Afetacao nao encontrada')
    }

    return assignment
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toAssignmentMutationError(error, 'Erro ao aprovar horas')
  }
}
