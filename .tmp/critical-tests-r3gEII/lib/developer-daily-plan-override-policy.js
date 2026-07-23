import { getPersonByIdData } from './people.js'
import { getWorkPlanByDateData, getWorkPlanByIdData } from './work-plans.js'
import { getAllWorkAssignmentsData } from './work-assignments.js'
import { getWorkByIdData } from './works.js'

function normalizeDateOnly(value) {
  if (!value) {
    return ''
  }

  const rawValue = String(value).trim()
  const dateMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
  }

  const parsedValue = new Date(rawValue)

  if (Number.isNaN(parsedValue.getTime())) {
    return ''
  }

  return parsedValue.toISOString().slice(0, 10)
}

function validateScopeCompanyConsistency(workPlan, work, person) {
  if (Number(workPlan.companyId) !== Number(work.companyId)) {
    throw new Error('O work plan e a obra tem de pertencer a mesma empresa')
  }

  if (Number(person.companyId) !== Number(work.companyId)) {
    throw new Error('A pessoa e a obra tem de pertencer a mesma empresa')
  }
}

async function resolveTargetWorkPlan({ workPlanId, date, work }) {
  if (workPlanId !== undefined && workPlanId !== null && String(workPlanId).trim() !== '') {
    const workPlan = await getWorkPlanByIdData(workPlanId)

    if (!workPlan) {
      throw new Error('Work plan nao encontrado')
    }

    if (date) {
      const normalizedTargetDate = normalizeDateOnly(date)
      const normalizedWorkPlanDate = normalizeDateOnly(workPlan.date)

      if (normalizedTargetDate && normalizedWorkPlanDate && normalizedTargetDate !== normalizedWorkPlanDate) {
        throw new Error('date tem de coincidir com a data do work plan')
      }
    }

    return workPlan
  }

  if (!date) {
    throw new Error('workPlanId ou date e obrigatorio')
  }

  const workPlan = await getWorkPlanByDateData(date, work.companyId)

  if (!workPlan) {
    throw new Error('Work plan nao encontrado')
  }

  return workPlan
}

export async function validateDeveloperOverrideAssignmentScope({
  currentAssignment = null,
  workPlanId,
  workId,
  personId,
  date,
}) {
  const targetWorkId =
    workId !== undefined ? Number(workId) : Number(currentAssignment?.workId)
  const targetPersonId =
    personId !== undefined ? Number(personId) : Number(currentAssignment?.personId)

  const work = await getWorkByIdData(targetWorkId)

  if (!work) {
    throw new Error('Obra nao encontrada')
  }

  const person = await getPersonByIdData(targetPersonId)

  if (!person) {
    throw new Error('Pessoa nao encontrada')
  }

  const targetWorkPlan = await resolveTargetWorkPlan({
    workPlanId: workPlanId !== undefined ? workPlanId : currentAssignment?.workPlanId,
    date: date !== undefined ? date : currentAssignment?.date,
    work,
  })

  validateScopeCompanyConsistency(targetWorkPlan, work, person)

  const targetAssignments = await getAllWorkAssignmentsData({
    workPlanId: targetWorkPlan.id,
    workId: work.id,
  })
  const sameContextAsCurrentAssignment =
    currentAssignment &&
    Number(currentAssignment.workPlanId) === Number(targetWorkPlan.id) &&
    Number(currentAssignment.workId) === Number(work.id)

  if (!sameContextAsCurrentAssignment && targetAssignments.length === 0) {
    throw new Error('A obra indicada nao faz parte do plano diario alvo.')
  }

  return {
    workPlan: targetWorkPlan,
    work,
    person,
    targetDate: normalizeDateOnly(targetWorkPlan.date),
  }
}

export async function canDeveloperOverrideWorkAssignment(assignment) {
  if (!assignment) {
    return false
  }

  try {
    await validateDeveloperOverrideAssignmentScope({
      currentAssignment: assignment,
      workPlanId: assignment.workPlanId,
      workId: assignment.workId,
      personId: assignment.personId,
      date: assignment.date,
    })
    return true
  } catch (error) {
    return false
  }
}

export async function assertDeveloperOverrideWorkAssignment(assignment) {
  if (!assignment) {
    throw new Error('Afetacao nao encontrada')
  }

  const isAllowed = await canDeveloperOverrideWorkAssignment(assignment)

  if (!isAllowed) {
    throw new Error('Afetacao fora do contexto tecnico permitido para override.')
  }

  return true
}
