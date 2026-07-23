import { canManageEntireApp } from '../../lib/auth.js'
import { canBypassTemporaryDailyPlanMutationLock, isDailyPlanLocked } from '../../lib/daily-plan-lock.js'
import { isFeatureEnabled } from '../../lib/feature-flags.js'
import { hasPermission } from '../../lib/permissions.js'
import { isChefRole } from '../../lib/roles.js'
import { isAssignmentApproved } from '../../lib/work-assignment-approval.js'
import { getWorkByIdData } from '../../lib/works.js'
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

async function ensureHoursApprovalAvailable(session) {
  if (!(await isFeatureEnabled('hoursApproval'))) {
    throw new HttpError(503, 'A aprovacao de horas esta desativada.')
  }

  ensurePermission(session, 'work_assignments.approve', 'Apenas administradores podem aprovar horas.')
}

function normalizeApprovedHoursValue(approvedHours) {
  const normalizedApprovedHours = Number(approvedHours)

  if (approvedHours === undefined || Number.isNaN(normalizedApprovedHours) || normalizedApprovedHours < 0) {
    throw new HttpError(400, 'approvedHours tem de ser 0 ou maior')
  }

  return normalizedApprovedHours
}

async function approveWorkAssignmentWithCurrentState(session, currentAssignment, approvedHours) {
  if (!currentAssignment) {
    throw new HttpError(404, 'Afetacao nao encontrada')
  }

  if (!canAccessAssignment(session, currentAssignment)) {
    throw new HttpError(403, 'Sem permissao para esta afetacao.')
  }

  const assignment = await updateWorkAssignmentData(
    currentAssignment.id,
    {
      approvedHours,
      adminApprovedAt: new Date().toISOString(),
      adminApprovedBy: session.name || session.username || session.userId,
    },
    {
      actorSession: session,
      ensureHoursAuditWithActor: true,
    },
  )

  if (!assignment) {
    throw new HttpError(404, 'Afetacao nao encontrada')
  }

  return assignment
}

function toAssignmentMutationError(error, fallbackMessage) {
  const message = String(error?.message || fallbackMessage).trim() || fallbackMessage
  const status = message.includes('nao encontrado') ? 404 : 500
  return new HttpError(status, message)
}

async function isDailyPlanLockedForWorkIds(dateString, workIds = [], options = {}) {
  if (canBypassTemporaryDailyPlanMutationLock(options)) {
    return false
  }

  const normalizedWorkIds = Array.from(
    new Set(
      (Array.isArray(workIds) ? workIds : [workIds])
        .map(workId => Number.parseInt(workId, 10))
        .filter(workId => Number.isInteger(workId) && workId > 0),
    ),
  )

  if (normalizedWorkIds.length === 0) {
    return isDailyPlanLocked(dateString, options)
  }

  const works = await Promise.all(normalizedWorkIds.map(workId => getWorkByIdData(workId)))

  return works.some(work => isDailyPlanLocked(dateString, { ...options, clientId: work?.clientId }))
}

async function ensureDailyPlanUnlockedForWorkIds(dateString, workIds = [], options = {}) {
  if (await isDailyPlanLockedForWorkIds(dateString, workIds, options)) {
    throw new HttpError(
      403,
      'Depois das 08:00 ja nao e possivel alterar o plano diario deste dia.',
    )
  }
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
    assignmentPurpose,
  } = body || {}
  const targetDate = await resolveDailyPlanDate({ workPlanId, date })

  if (!workId || !personId || (!workPlanId && !date)) {
    throw new HttpError(400, 'workPlanId, workId e personId sao obrigatorios')
  }

  await ensureDailyPlanUnlockedForWorkIds(targetDate, [workId])

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
      assignmentPurpose,
    }, {
      actorSession: session,
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
    assignmentPurpose,
    submitted,
  } = body || {}
  const targetWorkId = workId !== undefined ? Number(workId) : Number(currentAssignment.workId)
  const targetPersonId = personId !== undefined ? Number(personId) : Number(currentAssignment.personId)
  const targetWorkPlanId = workPlanId !== undefined ? workPlanId : currentAssignment.workPlan?.id
  const targetDate = date !== undefined ? date : currentAssignment.date

  if (isDailyPlanStructureUpdate(body || {})) {
    await ensureDailyPlanUnlockedForWorkIds(currentAssignment.date, [currentAssignment.workId, targetWorkId])

    if (targetDate !== currentAssignment.date) {
      await ensureDailyPlanUnlockedForWorkIds(targetDate, [targetWorkId])
    }
  }

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
        assignmentPurpose,
        submitted: shouldAutoSubmitFromAdmin ? true : undefined,
        submittedAt,
        submittedBy,
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

  await ensureDailyPlanUnlockedForWorkIds(assignment.date, [assignment.workId])

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
  await ensureHoursApprovalAvailable(session)

  const currentAssignment = await getWorkAssignmentByIdData(id)
  const approvedHours = normalizeApprovedHoursValue(body?.approvedHours)

  try {
    return await approveWorkAssignmentWithCurrentState(session, currentAssignment, approvedHours)
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toAssignmentMutationError(error, 'Erro ao aprovar horas')
  }
}

export async function approveWorkAssignmentsBatchService(session, body) {
  await ensureHoursApprovalAvailable(session)

  const items = Array.isArray(body?.items) ? body.items : []

  if (items.length === 0) {
    throw new HttpError(400, 'items sao obrigatorios')
  }

  const seenAssignmentIds = new Set()
  const result = {
    requested: items.length,
    approvedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    approved: [],
    skipped: [],
    failed: [],
  }

  for (const item of items) {
    const assignmentId = Number(item?.assignmentId ?? item?.id)

    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      result.failedCount += 1
      result.failed.push({
        assignmentId: item?.assignmentId ?? item?.id ?? null,
        message: 'Afetacao invalida',
      })
      continue
    }

    if (seenAssignmentIds.has(assignmentId)) {
      result.skippedCount += 1
      result.skipped.push({
        assignmentId,
        message: 'Afetacao duplicada no pedido',
      })
      continue
    }

    seenAssignmentIds.add(assignmentId)

    let approvedHours

    try {
      approvedHours = normalizeApprovedHoursValue(item?.approvedHours)
    } catch (error) {
      result.failedCount += 1
      result.failed.push({
        assignmentId,
        message: error instanceof HttpError ? error.message : 'approvedHours tem de ser 0 ou maior',
      })
      continue
    }

    try {
      const currentAssignment = await getWorkAssignmentByIdData(assignmentId)

      if (!currentAssignment) {
        throw new HttpError(404, 'Afetacao nao encontrada')
      }

      if (!canAccessAssignment(session, currentAssignment)) {
        throw new HttpError(403, 'Sem permissao para esta afetacao.')
      }

      if (isAssignmentApproved(currentAssignment)) {
        result.skippedCount += 1
        result.skipped.push({
          assignmentId,
          message: 'Afetacao ja estava aprovada',
        })
        continue
      }

      const assignment = await approveWorkAssignmentWithCurrentState(
        session,
        currentAssignment,
        approvedHours,
      )

      result.approvedCount += 1
      result.approved.push({
        assignmentId,
        approvedHours: Number(assignment.approvedHours ?? approvedHours),
      })
    } catch (error) {
      result.failedCount += 1
      result.failed.push({
        assignmentId,
        message: error instanceof HttpError ? error.message : 'Erro ao aprovar horas',
      })
    }
  }

  return result
}
