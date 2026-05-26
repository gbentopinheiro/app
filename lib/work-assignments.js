import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { syncAccessIdentityWorksForPerson } from './access-identities.js'
import { getAllPeople, getPersonById } from './people.js'
import { isChefRole } from './roles.js'
import { getAllWorks, getWorkById } from './works.js'
import { createWorkPlan, getAllWorkPlans, getWorkPlanByDate, getWorkPlanById } from './work-plans.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const assignmentsFilePath = join(dataDir, 'work-assignments.json')

export class WorkAssignment {
  constructor(data) {
    this.id = data.id
    this.workPlanId = parseInt(data.workPlanId)
    this.workId = parseInt(data.workId)
    this.personId = parseInt(data.personId)
    this.hours = parseFloat(data.hours) || 0 // Horas reais (entrada do chef)
    this.dailyHours = data.dailyHours !== undefined ? parseFloat(data.dailyHours) : parseFloat(data.hours) || 0 // Horas diárias (proposta do chef)
    this.approvedHours = data.approvedHours !== undefined ? parseFloat(data.approvedHours) : null // Horas aprovadas pelo admin
    this.adminApprovedAt = data.adminApprovedAt || null
    this.adminApprovedBy = data.adminApprovedBy || null
    this.submitted = data.submitted === true // Flag que indica se o chef guardou as horas
    this.submittedAt = data.submittedAt || null // Timestamp de quando foi submetido
    this.submittedBy = data.submittedBy || null // ID ou nome do chef que submeteu
    this.hourlyCost = parseFloat(data.hourlyCost) || 0
    this.manualHourlyCost = data.manualHourlyCost === true
    this.notes = String(data.notes || '').trim()
    this.hasWorkAccess = data.hasWorkAccess === true
  }
}

export class WorkAssignmentsService {
  constructor(filePath = assignmentsFilePath) {
    this.filePath = filePath
    this.assignments = this.load()
  }

  ensureDataDir() {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  }

  load() {
    this.ensureDataDir()

    if (!existsSync(this.filePath)) {
      return []
    }

    try {
      const rawData = JSON.parse(readFileSync(this.filePath, 'utf8'))
      return normalizeAssignments(rawData)
    } catch (error) {
      console.error('Error loading work assignments:', error.message)
      return []
    }
  }

  save() {
    this.ensureDataDir()
    writeFileSync(this.filePath, JSON.stringify(this.assignments, null, 2), 'utf8')
  }

  refresh() {
    this.assignments = this.load()
    return this.assignments
  }

  getAll(filters = {}) {
    const assignments = this.refresh()
    const resolvedChefAccessMap = buildResolvedChefAccessMap(assignments)

    return assignments
      .filter(assignment => !filters.workPlanId || assignment.workPlanId === parseInt(filters.workPlanId))
      .filter(assignment => !filters.workId || assignment.workId === parseInt(filters.workId))
      .filter(assignment => !filters.personId || assignment.personId === parseInt(filters.personId))
      .filter(assignment => {
        if (!filters.date) return true
        const workPlan = getWorkPlanById(assignment.workPlanId)
        return workPlan?.date === filters.date
      })
      .map(assignment => enrichAssignment(assignment, resolvedChefAccessMap))
  }

  getById(id) {
    const assignments = this.refresh()
    const resolvedChefAccessMap = buildResolvedChefAccessMap(assignments)
    const assignment = assignments.find(item => item.id === parseInt(id))
    return assignment ? enrichAssignment(assignment, resolvedChefAccessMap) : null
  }

  getNextId() {
    if (this.assignments.length === 0) return 1
    return Math.max(...this.assignments.map(assignment => assignment.id)) + 1
  }

  create(data) {
    this.refresh()

    const workPlanId = resolveWorkPlanId(data)
    validateRelationship(workPlanId, data.workId, data.personId)
    validateNoDuplicatePersonWork(this.assignments, workPlanId, data.personId, data.workId)

    const assignment = new WorkAssignment({
      ...data,
      id: this.getNextId(),
      workPlanId,
      manualHourlyCost: data.manualHourlyCost === true,
      hourlyCost: resolveAssignmentHourlyCost({
        workId: data.workId,
        personId: data.personId,
        hourlyCost: data.hourlyCost,
        manualHourlyCost: data.manualHourlyCost === true,
      }),
    })

    this.assignments.push(assignment)
    if (assignment.hasWorkAccess) {
      applyExclusiveChefWorkAccess(this.assignments, assignment.workPlanId, assignment.workId, assignment.id)
    }
    this.save()
    syncChefAccessForWorkPlan(this.assignments, assignment.workPlanId)
    return enrichAssignment(assignment)
  }

  update(id, data) {
    this.refresh()

    const index = this.assignments.findIndex(assignment => assignment.id === parseInt(id))
    if (index === -1) return null

    const currentAssignment = this.assignments[index]
    const isApprovedHoursUpdate = data.approvedHours !== undefined
    const isSubmittedStatusUpdate =
      data.submitted !== undefined || data.submittedAt !== undefined || data.submittedBy !== undefined
    const shouldSyncChefAccess =
      data.workPlanId !== undefined ||
      data.workId !== undefined ||
      data.personId !== undefined ||
      data.date !== undefined ||
      data.hasWorkAccess !== undefined

    // Prevent editing if already submitted (locked)
    if (currentAssignment.submitted && !isApprovedHoursUpdate && !isSubmittedStatusUpdate) {
      throw new Error('Esta afetação já foi submetida pelo chef e não pode ser modificada. O administrador precisa de aprovar.')
    }

    const workPlanId = data.workPlanId !== undefined || data.date !== undefined
      ? resolveWorkPlanId({ ...currentAssignment, ...data })
      : currentAssignment.workPlanId
    const workId = data.workId !== undefined ? data.workId : currentAssignment.workId
    const personId = data.personId !== undefined ? data.personId : currentAssignment.personId

    validateRelationship(workPlanId, workId, personId)
    validateNoDuplicatePersonWork(this.assignments, workPlanId, personId, workId, currentAssignment.id)

    const updatedAssignment = new WorkAssignment({
      ...currentAssignment,
      ...data,
      id: currentAssignment.id,
      workPlanId,
      workId,
      personId,
      adminApprovedAt: data.adminApprovedAt !== undefined ? data.adminApprovedAt : currentAssignment.adminApprovedAt,
      adminApprovedBy: data.adminApprovedBy !== undefined ? data.adminApprovedBy : currentAssignment.adminApprovedBy,
      manualHourlyCost: data.manualHourlyCost !== undefined ? data.manualHourlyCost === true : currentAssignment.manualHourlyCost === true,
      hourlyCost: resolveAssignmentHourlyCost({
        workId,
        personId,
        hourlyCost: data.hourlyCost !== undefined ? data.hourlyCost : currentAssignment.hourlyCost,
        manualHourlyCost: data.manualHourlyCost !== undefined ? data.manualHourlyCost === true : currentAssignment.manualHourlyCost === true,
      }),
    })

    this.assignments[index] = updatedAssignment

    if (updatedAssignment.hasWorkAccess) {
      applyExclusiveChefWorkAccess(this.assignments, updatedAssignment.workPlanId, updatedAssignment.workId, updatedAssignment.id)
    }

    this.save()

    if (shouldSyncChefAccess) {
      syncChefAccessForWorkPlan(this.assignments, currentAssignment.workPlanId)
      syncChefAccessForWorkPlan(this.assignments, updatedAssignment.workPlanId)
    }

    return enrichAssignment(updatedAssignment)
  }

  submitAssignment(id, submittedBy) {
    this.refresh()

    const index = this.assignments.findIndex(assignment => assignment.id === parseInt(id))
    if (index === -1) return null

    const currentAssignment = this.assignments[index]

    const submittedAssignment = new WorkAssignment({
      ...currentAssignment,
      approvedHours: currentAssignment.hours,
      adminApprovedAt: null,
      adminApprovedBy: null,
      submitted: true,
      submittedAt: new Date().toISOString(),
      submittedBy,
    })

    this.assignments[index] = submittedAssignment
    this.save()
    return enrichAssignment(submittedAssignment)
  }

  delete(id) {
    this.refresh()

    const index = this.assignments.findIndex(assignment => assignment.id === parseInt(id))
    if (index === -1) return false

    const currentAssignment = this.assignments[index]

    this.assignments.splice(index, 1)
    this.save()
    syncChefAccessForWorkPlan(this.assignments, currentAssignment.workPlanId)
    return true
  }
}

function getChefAssignmentsForWork(assignments, workPlanId, workId) {
  const normalizedWorkPlanId = parseInt(workPlanId)

  return assignments
    .filter(
      assignment =>
        assignment.workPlanId === normalizedWorkPlanId &&
        assignment.workId === Number(workId) &&
        isChefRole(getPersonById(assignment.personId)?.role),
    )
    .sort((left, right) => Number(left.id) - Number(right.id))
}

function getChefAssignmentWithWorkAccess(assignments, workPlanId, workId) {
  const chefAssignments = getChefAssignmentsForWork(assignments, workPlanId, workId)

  if (chefAssignments.length === 0) {
    return null
  }

  return chefAssignments.find(assignment => assignment.hasWorkAccess) || chefAssignments[0]
}

function applyExclusiveChefWorkAccess(assignments, workPlanId, workId, selectedAssignmentId) {
  const chefAssignments = getChefAssignmentsForWork(assignments, workPlanId, workId)

  chefAssignments.forEach(assignment => {
    assignment.hasWorkAccess = Number(assignment.id) === Number(selectedAssignmentId)
  })
}

function syncChefAccessForWorkPlan(assignments, workPlanId) {
  const normalizedWorkPlanId = parseInt(workPlanId)

  if (!normalizedWorkPlanId) {
    return null
  }

  const resolvedChefAccessMap = buildResolvedChefAccessMap(assignments)
  const chefAssignments = assignments
    .filter(assignment => assignment.workPlanId === normalizedWorkPlanId)
    .filter(assignment => isChefRole(getPersonById(assignment.personId)?.role))

  const chefPersonIds = Array.from(new Set(chefAssignments.map(assignment => Number(assignment.personId))))
  const chefWorkIdsByPerson = new Map()
  const workIds = Array.from(new Set(chefAssignments.map(assignment => Number(assignment.workId))))

  workIds.forEach(workId => {
    const selectedAssignmentId = resolvedChefAccessMap.get(`${normalizedWorkPlanId}:${Number(workId)}`)
    const selectedAssignment = chefAssignments.find(assignment => Number(assignment.id) === Number(selectedAssignmentId))

    if (!selectedAssignment) {
      return
    }

    const personId = Number(selectedAssignment.personId)
    const currentWorkIds = chefWorkIdsByPerson.get(personId) || new Set()
    currentWorkIds.add(Number(workId))
    chefWorkIdsByPerson.set(personId, currentWorkIds)
  })

  chefPersonIds.forEach(personId => {
    const workIdsForPerson = Array.from(chefWorkIdsByPerson.get(personId) || [])
    syncAccessIdentityWorksForPerson(personId, workIdsForPerson)
  })
}

function buildResolvedChefAccessMap(assignments) {
  const resolvedChefAccessMap = new Map()
  const workPlanDatesById = new Map(
    getAllWorkPlans().map(workPlan => [Number(workPlan.id), String(workPlan.date || '')]),
  )
  const chefAssignmentsByPlanWork = new Map()

  assignments.forEach(assignment => {
    const person = getPersonById(assignment.personId)

    if (!isChefRole(person?.role)) {
      return
    }

    const key = `${Number(assignment.workPlanId)}:${Number(assignment.workId)}`
    const currentAssignments = chefAssignmentsByPlanWork.get(key) || []
    currentAssignments.push(assignment)
    chefAssignmentsByPlanWork.set(key, currentAssignments)
  })

  const sortedKeys = Array.from(chefAssignmentsByPlanWork.keys()).sort((left, right) => {
    const [leftWorkPlanId, leftWorkId] = left.split(':').map(Number)
    const [rightWorkPlanId, rightWorkId] = right.split(':').map(Number)
    const leftDate = workPlanDatesById.get(leftWorkPlanId) || ''
    const rightDate = workPlanDatesById.get(rightWorkPlanId) || ''

    return (
      leftDate.localeCompare(rightDate, 'pt-PT') ||
      leftWorkPlanId - rightWorkPlanId ||
      leftWorkId - rightWorkId
    )
  })

  const previousChefByWorkId = new Map()

  sortedKeys.forEach(key => {
    const [workPlanId, workId] = key.split(':').map(Number)
    const chefAssignments = (chefAssignmentsByPlanWork.get(key) || []).sort((left, right) => Number(left.id) - Number(right.id))

    if (chefAssignments.length === 0) {
      return
    }

    const explicitAssignment = chefAssignments.find(assignment => assignment.hasWorkAccess === true)
    const previousChefPersonId = previousChefByWorkId.get(String(workId))
    const previousChefAssignment = previousChefPersonId
      ? chefAssignments.find(assignment => Number(assignment.personId) === Number(previousChefPersonId))
      : null
    const selectedAssignment = explicitAssignment || previousChefAssignment || chefAssignments[0]

    resolvedChefAccessMap.set(`${workPlanId}:${workId}`, Number(selectedAssignment.id))
    previousChefByWorkId.set(String(workId), Number(selectedAssignment.personId))
  })

  return resolvedChefAccessMap
}

function normalizeAssignments(list) {
  if (!Array.isArray(list)) return []

  return list
    .map((assignment, index) => {
      try {
        return new WorkAssignment({
          ...assignment,
          id: assignment.id !== undefined ? parseInt(assignment.id) : index + 1,
          workPlanId: resolveWorkPlanId(assignment),
        })
      } catch (error) {
        return null
      }
    })
    .filter(assignment => assignment && assignment.workPlanId && assignment.workId && assignment.personId)
}

function resolveWorkPlanId(data) {
  if (data.workPlanId !== undefined) {
    const workPlan = getWorkPlanById(data.workPlanId)
    if (!workPlan) {
      throw new Error('Work plan não encontrado')
    }
    return workPlan.id
  }

  if (data.date) {
    const existingWorkPlan = getWorkPlanByDate(data.date)
    if (existingWorkPlan) {
      return existingWorkPlan.id
    }
    return createWorkPlan({ date: data.date }).id
  }

  throw new Error('workPlanId é obrigatório')
}

function validateRelationship(workPlanId, workId, personId) {
  if (!getWorkPlanById(workPlanId)) {
    throw new Error('Work plan não encontrado')
  }

  if (!getWorkById(workId)) {
    throw new Error('Obra não encontrada')
  }

  if (!getPersonById(personId)) {
    throw new Error('Pessoa não encontrada')
  }
}

function validateNoDuplicatePersonWork(assignments, workPlanId, personId, workId, excludeAssignmentId = null) {
  const duplicate = assignments.find(
    assignment =>
      assignment.workPlanId === workPlanId &&
      assignment.personId === personId &&
      assignment.workId === workId &&
      assignment.id !== excludeAssignmentId
  )

  if (duplicate) {
    const person = getPersonById(personId)
    const work = getWorkById(workId)
    throw new Error(
      `${person?.name || 'Pessoa'} já tem uma afetação para a obra "${work?.name || `#${workId}`}" neste plano diário.`
    )
  }
}

function getDefaultHourlyCost(workId) {
  const work = getWorkById(workId)
  return work ? parseFloat(work.defaultHourlyCost) || 0 : 0
}

function getSpecialPersonHourlyCost(workId, personId) {
  const work = getWorkById(workId)
  const specialCost = work?.specialPersonHourlyCosts?.[String(personId)]

  if (specialCost !== undefined && specialCost !== null && !Number.isNaN(parseFloat(specialCost))) {
    return parseFloat(specialCost) || 0
  }

  return null
}

function getHourlyCostForRole(workId, personId) {
  const work = getWorkById(workId)
  const person = getPersonById(personId)
  const specialPersonCost = getSpecialPersonHourlyCost(workId, personId)

  if (specialPersonCost !== null) {
    return specialPersonCost
  }

  const roleCost = work?.roleHourlyCosts?.[person?.role]

  if (roleCost !== undefined && roleCost !== null && !Number.isNaN(parseFloat(roleCost))) {
    return parseFloat(roleCost) || 0
  }

  return getDefaultHourlyCost(workId)
}

function resolveAssignmentHourlyCost({ workId, personId, hourlyCost, manualHourlyCost }) {
  if (manualHourlyCost) {
    return parseFloat(hourlyCost) || 0
  }

  return getHourlyCostForRole(workId, personId)
}

function enrichAssignment(assignment, resolvedChefAccessMap = null) {
  const person = getPersonById(assignment.personId)
  const work = getWorkById(assignment.workId)
  const workPlan = getWorkPlanById(assignment.workPlanId)
  const resolvedWorkAccessAssignmentId = resolvedChefAccessMap?.get(`${Number(assignment.workPlanId)}:${Number(assignment.workId)}`)
  const resolvedHasWorkAccess = isChefRole(person?.role)
    ? Number(resolvedWorkAccessAssignmentId) === Number(assignment.id)
    : false

  return {
    ...assignment,
    date: workPlan?.date || null,
    totalCost: Number((assignment.hours * assignment.hourlyCost).toFixed(2)),
    hasWorkAccess: resolvedHasWorkAccess,
    person: person ? {
      id: person.id,
      name: person.name,
      defaultHourlyPrice: person.price,
      role: person.role,
    } : null,
    work: work ? {
      id: work.id,
      number: work.number,
      name: work.name,
      defaultHourlyCost: work.defaultHourlyCost,
      roleHourlyCosts: work.roleHourlyCosts,
      specialPersonHourlyCosts: work.specialPersonHourlyCosts,
    } : null,
    workPlan: workPlan ? {
      id: workPlan.id,
      date: workPlan.date,
    } : null,
  }
}

const workAssignmentsService = new WorkAssignmentsService()

export function getAllWorkAssignments(filters) {
  return workAssignmentsService.getAll(filters)
}

export function getWorkAssignmentById(id) {
  return workAssignmentsService.getById(id)
}

export function createWorkAssignment(data) {
  return workAssignmentsService.create(data)
}

export function updateWorkAssignment(id, data) {
  return workAssignmentsService.update(id, data)
}

export function submitWorkAssignment(id, submittedBy) {
  return workAssignmentsService.submitAssignment(id, submittedBy)
}

export function deleteWorkAssignment(id) {
  return workAssignmentsService.delete(id)
}

export function getAssignmentDefaults() {
  return {
    people: getAllPeople().map(person => ({
      id: person.id,
      name: person.name,
      defaultHourlyPrice: person.price,
      role: person.role,
    })),
    works: getAllWorks().map(work => ({
      id: work.id,
      number: work.number,
      name: work.name,
      defaultHourlyCost: work.defaultHourlyCost,
      roleHourlyCosts: work.roleHourlyCosts,
      specialPersonHourlyCosts: work.specialPersonHourlyCosts,
      status: work.status,
    })),
    workPlans: getAllWorkPlans(),
  }
}
