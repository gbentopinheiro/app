import { resolveCompanyId } from '../../lib/companies.js'
import { getDefaultHoursForDate } from '../../lib/default-hours.js'
import { canBypassDailyPlanCreationLock, isDailyPlanLocked } from '../../lib/daily-plan-lock.js'
import { hasPermission } from '../../lib/permissions.js'
import {
  createWorkAssignmentData,
  deleteWorkAssignmentData,
  getAllWorkAssignmentsData,
} from '../../lib/work-assignments.js'
import {
  createWorkPlanData,
  deleteWorkPlanData,
  getAllWorkPlansData,
  getWorkPlanByDateData,
  getWorkPlanByIdData,
  updateWorkPlanData,
} from '../../lib/work-plans.js'
import { HttpError } from '../errors/http-error.js'

function ensurePermission(session, permissionKey, message = 'Sem permissao para gerir o plano diario.') {
  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, message)
  }
}

function toWorkPlanMutationError(error, fallbackMessage) {
  const message = String(error?.message || fallbackMessage).trim() || fallbackMessage
  const status =
    message.includes('Ja existe') ||
    message.includes('Já existe') ||
    message.includes('Já existe') ||
    message.includes('data valida') ||
    message.includes('data válida') ||
    message.includes('data válida')
      ? 400
      : message.includes('Nao existe') ||
          message.includes('Não existe') ||
          message.includes('nao encontrado') ||
          message.includes('não encontrado')
        ? 404
        : 500

  return new HttpError(status, message)
}

async function getLatestPreviousWorkPlanWithAssignments(date, companyId) {
  const targetDate = new Date(date)
  const normalizedCompanyId = resolveCompanyId(companyId)
  const workPlans = await getAllWorkPlansData({ companyId: normalizedCompanyId })
  const orderedWorkPlans = workPlans
    .filter(workPlan => new Date(workPlan.date) < targetDate)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())

  for (const workPlan of orderedWorkPlans) {
    const assignments = await getAllWorkAssignmentsData({ workPlanId: workPlan.id })

    if (assignments.length > 0) {
      return {
        workPlan,
        assignments,
      }
    }
  }

  return {
    workPlan: null,
    assignments: [],
  }
}

export async function getWorkPlansListService(session) {
  ensurePermission(session, 'work_plans.read', 'Sem permissao para consultar o plano diario.')
  return getAllWorkPlansData()
}

export async function createWorkPlanService(session, body) {
  ensurePermission(session, 'work_plans.create')

  const { date, clonePreviousDay } = body || {}
  const companyId = resolveCompanyId(body?.companyId)

  if (!date) {
    throw new HttpError(400, 'date e obrigatorio')
  }

  if (isDailyPlanLocked(date) && !canBypassDailyPlanCreationLock()) {
    throw new HttpError(
      403,
      'Depois das 08:00 ja nao e possivel alterar o plano diario deste dia.',
    )
  }

  let sourceWorkPlan = null
  let previousAssignments = []

  if (clonePreviousDay) {
    ensurePermission(session, 'work_plans.copy_previous', 'Sem permissao para copiar o plano anterior.')

    const previousWorkPlanPayload = await getLatestPreviousWorkPlanWithAssignments(date, companyId)
    sourceWorkPlan = previousWorkPlanPayload.workPlan
    previousAssignments = previousWorkPlanPayload.assignments

    if (!sourceWorkPlan) {
      throw new HttpError(
        404,
        'Nao existe nenhum work plan anterior com work assignments para copiar',
      )
    }
  }

  try {
    const existingWorkPlan = await getWorkPlanByDateData(date, companyId)
    const workPlan = existingWorkPlan || await createWorkPlanData({ date, companyId })

    if (!clonePreviousDay) {
      let clearedAssignments = 0

      if (existingWorkPlan) {
        const currentAssignments = await getAllWorkAssignmentsData({ workPlanId: existingWorkPlan.id })
        clearedAssignments = currentAssignments.length

        for (const assignment of currentAssignments) {
          await deleteWorkAssignmentData(assignment.id)
        }
      }

      return {
        ...workPlan,
        clonedAssignments: 0,
        clearedAssignments,
        reusedWorkPlan: Boolean(existingWorkPlan),
      }
    }

    if (existingWorkPlan) {
      const currentAssignments = await getAllWorkAssignmentsData({ workPlanId: existingWorkPlan.id })

      for (const assignment of currentAssignments) {
        await deleteWorkAssignmentData(assignment.id)
      }
    }

    for (const assignment of previousAssignments) {
      await createWorkAssignmentData({
        workPlanId: workPlan.id,
        workId: assignment.workId,
        personId: assignment.personId,
        hours: getDefaultHoursForDate(workPlan.date),
        hourlyCost: assignment.hourlyCost,
        manualHourlyCost: assignment.manualHourlyCost === true,
        notes: assignment.notes,
      })
    }

    return {
      ...workPlan,
      clonedAssignments: previousAssignments.length,
      clonedFromDate: sourceWorkPlan?.date || null,
      clonedFromWorkPlanId: sourceWorkPlan?.id || null,
      reusedWorkPlan: Boolean(existingWorkPlan),
    }
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toWorkPlanMutationError(error, 'Erro ao criar work plan')
  }
}

export async function getWorkPlanByIdService(session, id) {
  ensurePermission(session, 'work_plans.read', 'Sem permissao para consultar o plano diario.')

  const workPlan = await getWorkPlanByIdData(id)

  if (!workPlan) {
    throw new HttpError(404, 'Work plan não encontrado')
  }

  return workPlan
}

export async function updateWorkPlanService(session, id, body) {
  ensurePermission(session, 'work_plans.update')

  try {
    const workPlan = await updateWorkPlanData(id, { date: body?.date })

    if (!workPlan) {
      throw new HttpError(404, 'Work plan não encontrado')
    }

    return workPlan
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toWorkPlanMutationError(error, 'Erro ao atualizar work plan')
  }
}

export async function deleteWorkPlanService(session, id) {
  ensurePermission(session, 'work_plans.delete')

  const linkedAssignments = await getAllWorkAssignmentsData({ workPlanId: id })

  if (linkedAssignments.length > 0) {
    throw new HttpError(409, 'Não é possível remover um work plan com work assignments associados')
  }

  const deleted = await deleteWorkPlanData(id)

  if (!deleted) {
    throw new HttpError(404, 'Work plan não encontrado')
  }

  return { message: 'Work plan removido com sucesso' }
}
