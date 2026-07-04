import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { syncAccessIdentityWorksForPerson } from './access-identities.js'
import {
  applyExclusiveChefWorkAccessDb,
  createWorkAssignmentDb,
  deleteWorkAssignmentDb,
  getAllWorkAssignmentsDb,
  getWorkAssignmentByIdDb,
  updateWorkAssignmentDb,
} from './db/work-assignments-db.js'
import { getDefaultHoursForDate } from './default-hours.js'
import { isMysqlDataSourceEnabled } from './data-source.js'
import { getAllPeople, getAllPeopleData, getPersonById, getPersonByIdData } from './people.js'
import { prisma } from './prisma.js'
import { isChefRole } from './roles.js'
import { isAssignmentApproved } from './work-assignment-approval.js'
import { getAllWorks, getAllWorksData, getWorkById, getWorkByIdData } from './works.js'
import {
  createWorkPlan,
  createWorkPlanData,
  getAllWorkPlans,
  getAllWorkPlansData,
  getWorkPlanByDate,
  getWorkPlanByDateData,
  getWorkPlanById,
  getWorkPlanByIdData,
} from './work-plans.js'

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
    this.approvedHours = normalizeApprovedHours(data.approvedHours) // Horas aprovadas pelo admin
    this.adminApprovedAt = data.adminApprovedAt || null
    this.adminApprovedBy = data.adminApprovedBy || null
    this.submitted = data.submitted === true // Flag que indica se o chef guardou as horas
    this.submittedAt = data.submittedAt || null // Timestamp de quando foi submetido
    this.submittedBy = data.submittedBy || null // ID ou nome do chef que submeteu
    this.hourlyCost = parseFloat(data.hourlyCost) || 0
    this.manualHourlyCost = data.manualHourlyCost === true
    this.notes = String(data.notes || '').trim()
    this.hasWorkAccess = data.hasWorkAccess === true
    this.planningVisible = data.planningVisible !== false
  }
}

function normalizeApprovedHours(approvedHours) {
  if (approvedHours === undefined || approvedHours === null || approvedHours === '') {
    return null
  }

  const parsedApprovedHours = parseFloat(approvedHours)
  return Number.isNaN(parsedApprovedHours) ? null : parsedApprovedHours
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
    if (isMysqlDataSourceEnabled()) {
      return
    }

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
      .filter(
        assignment =>
          filters.planningVisible === undefined || assignment.planningVisible === (filters.planningVisible !== false),
      )
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
    validateCompanyConsistency(workPlanId, data.workId, data.personId)
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
    validateCompanyConsistency(workPlanId, workId, personId)
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
      dailyHours:
        data.dailyHours !== undefined
          ? data.dailyHours
          : data.hours !== undefined
            ? data.hours
            : currentAssignment.dailyHours,
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
      approvedHours: null,
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

  repriceForWork(workId, startDate) {
    this.refresh()

    const normalizedWorkId = parseInt(workId, 10)
    const normalizedStartDate = String(startDate || '').slice(0, 10)

    if (!Number.isInteger(normalizedWorkId) || !normalizedStartDate) {
      return 0
    }

    let updatedCount = 0

    this.assignments = this.assignments.map(assignment => {
      if (assignment.workId !== normalizedWorkId) {
        return assignment
      }

      if (assignment.manualHourlyCost || isAssignmentApproved(assignment)) {
        return assignment
      }

      const workPlan = getWorkPlanById(assignment.workPlanId)
      const assignmentDate = workPlan?.date

      if (!assignmentDate || assignmentDate < normalizedStartDate) {
        return assignment
      }

      const nextHourlyCost = resolveAssignmentHourlyCost({
        workId: assignment.workId,
        personId: assignment.personId,
        hourlyCost: assignment.hourlyCost,
        manualHourlyCost: false,
      })

      if (Number(nextHourlyCost) === Number(assignment.hourlyCost)) {
        return assignment
      }

      updatedCount += 1

      return new WorkAssignment({
        ...assignment,
        hourlyCost: nextHourlyCost,
      })
    })

    if (updatedCount > 0) {
      this.save()
    }

    return updatedCount
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

function resolveAssignmentPerson(assignment) {
  return assignment?.person || getPersonById(assignment?.personId)
}

function resolveAssignmentWork(assignment) {
  return assignment?.work || getWorkById(assignment?.workId)
}

function resolveAssignmentWorkPlan(assignment) {
  return assignment?.workPlan || getWorkPlanById(assignment?.workPlanId)
}

function resolveAssignmentDate(assignment) {
  return String(assignment?.date || assignment?.workPlan?.date || resolveAssignmentWorkPlan(assignment)?.date || '')
}

function hasAssignmentHoursDeltaFromDefault(assignment) {
  const assignmentDate = resolveAssignmentDate(assignment)

  if (!assignmentDate) {
    return false
  }

  const defaultHours = Number(getDefaultHoursForDate(assignmentDate) || 0)
  const hours = Number(assignment?.hours ?? 0)
  const dailyHours = Number(assignment?.dailyHours ?? hours)

  return hours !== defaultHours || dailyHours !== defaultHours
}

export function hasAssignmentWorkflowActivity(assignment) {
  if (!assignment) {
    return false
  }

  return (
    assignment.submitted === true ||
    Boolean(assignment.submittedAt) ||
    assignment.approvedHours !== undefined && assignment.approvedHours !== null ||
    Boolean(assignment.adminApprovedAt) ||
    hasAssignmentHoursDeltaFromDefault(assignment)
  )
}

export function isAssignmentOperationallyVisible(assignment) {
  if (!assignment) {
    return false
  }

  return assignment.planningVisible !== false || hasAssignmentWorkflowActivity(assignment)
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
  const chefAssignmentsByPlanWork = new Map()

  assignments.forEach(assignment => {
    const person = resolveAssignmentPerson(assignment)

    if (!isChefRole(person?.role) || assignment.planningVisible === false) {
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
    const leftDate = resolveAssignmentDate((chefAssignmentsByPlanWork.get(left) || [])[0])
    const rightDate = resolveAssignmentDate((chefAssignmentsByPlanWork.get(right) || [])[0])

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
    const work = data.workId !== undefined ? getWorkById(data.workId) : null
    const companyId = work?.companyId
    const existingWorkPlan = getWorkPlanByDate(data.date, companyId)
    if (existingWorkPlan) {
      return existingWorkPlan.id
    }
    return createWorkPlan({ date: data.date, companyId }).id
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

function validateNoDuplicatePersonWork(
  assignments,
  workPlanId,
  personId,
  workId,
  excludeAssignmentId = null,
  options = {},
) {
  const duplicate = assignments.find(
    assignment =>
      assignment.workPlanId === workPlanId &&
      assignment.personId === personId &&
      assignment.workId === workId &&
      assignment.id !== excludeAssignmentId
  )

  if (duplicate) {
    const person = options.person || getPersonById(personId)
    const work = options.work || getWorkById(workId)
    throw new Error(
      `${person?.name || 'Pessoa'} já tem uma afetação para a obra "${work?.name || `#${workId}`}" neste plano diário.`
    )
  }
}

function getDefaultHourlyCost(workId, work = null) {
  const resolvedWork = work || getWorkById(workId)
  return resolvedWork ? parseFloat(resolvedWork.defaultHourlyCost) || 0 : 0
}

function getSpecialPersonHourlyCost(workId, personId, work = null) {
  const resolvedWork = work || getWorkById(workId)
  const specialCost = resolvedWork?.specialPersonHourlyCosts?.[String(personId)]

  if (specialCost !== undefined && specialCost !== null && !Number.isNaN(parseFloat(specialCost))) {
    return parseFloat(specialCost) || 0
  }

  return null
}

function getHourlyCostForRole(workId, personId, options = {}) {
  const work = options.work || getWorkById(workId)
  const person = options.person || getPersonById(personId)
  const specialPersonCost = getSpecialPersonHourlyCost(workId, personId, work)

  if (specialPersonCost !== null) {
    return specialPersonCost
  }

  const roleCost = work?.roleHourlyCosts?.[person?.role]

  if (roleCost !== undefined && roleCost !== null && !Number.isNaN(parseFloat(roleCost))) {
    return parseFloat(roleCost) || 0
  }

  return getDefaultHourlyCost(workId, work)
}

function resolveAssignmentHourlyCost({ workId, personId, hourlyCost, manualHourlyCost, work = null, person = null }) {
  if (manualHourlyCost) {
    return parseFloat(hourlyCost) || 0
  }

  return getHourlyCostForRole(workId, personId, { work, person })
}

function enrichAssignment(assignment, resolvedChefAccessMap = null) {
  const person = resolveAssignmentPerson(assignment)
  const work = resolveAssignmentWork(assignment)
  const workPlan = resolveAssignmentWorkPlan(assignment)
  const resolvedWorkAccessAssignmentId = resolvedChefAccessMap?.get(`${Number(assignment.workPlanId)}:${Number(assignment.workId)}`)
  const resolvedHasWorkAccess = isChefRole(person?.role)
    ? Number(resolvedWorkAccessAssignmentId) === Number(assignment.id)
    : false

  return {
    ...assignment,
    date: assignment?.date || workPlan?.date || null,
    totalCost: Number((assignment.hours * assignment.hourlyCost).toFixed(2)),
    hasWorkAccess: resolvedHasWorkAccess,
    planningVisible: assignment.planningVisible !== false,
    person: person ? {
      id: person.id,
      name: person.name,
      defaultHourlyPrice: person.price,
      role: person.role,
      chefCategory: person.chefCategory || null,
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
      companyId: workPlan.companyId,
      date: workPlan.date,
    } : null,
  }
}

function validateCompanyConsistency(workPlanId, workId, personId) {
  const workPlan = getWorkPlanById(workPlanId)
  const work = getWorkById(workId)
  const person = getPersonById(personId)

  if (!workPlan || !work || !person) {
    return
  }

  if (Number(workPlan.companyId) !== Number(work.companyId)) {
    throw new Error('O work plan e a obra tÃªm de pertencer Ã  mesma empresa')
  }

  if (Number(person.companyId) !== Number(work.companyId)) {
    throw new Error('A pessoa e a obra tÃªm de pertencer Ã  mesma empresa')
  }
}

let workAssignmentsService = null

function getLegacyWorkAssignmentsService() {
  if (isMysqlDataSourceEnabled()) {
    return null
  }

  if (!workAssignmentsService) {
    workAssignmentsService = new WorkAssignmentsService()
  }

  return workAssignmentsService
}

function upsertWorkAssignmentMirror(assignmentData) {
  const normalizedAssignment = new WorkAssignment(assignmentData)
  const legacyService = getLegacyWorkAssignmentsService()

  if (!legacyService) {
    return normalizedAssignment
  }

  legacyService.refresh()

  const existingIndex = legacyService.assignments.findIndex(
    assignment => assignment.id === normalizedAssignment.id,
  )

  if (existingIndex >= 0) {
    legacyService.assignments[existingIndex] = normalizedAssignment
  } else {
    legacyService.assignments.push(normalizedAssignment)
  }

  legacyService.save()
  return normalizedAssignment
}

function removeWorkAssignmentMirror(id) {
  const legacyService = getLegacyWorkAssignmentsService()

  if (!legacyService) {
    return false
  }

  legacyService.refresh()

  const normalizedId = parseInt(id, 10)
  const existingIndex = legacyService.assignments.findIndex(
    assignment => assignment.id === normalizedId,
  )

  if (existingIndex === -1) {
    return false
  }

  legacyService.assignments.splice(existingIndex, 1)
  legacyService.save()
  return true
}

async function syncWorkAssignmentMirrorsForScope(workPlanId, workId) {
  if (!workPlanId || !workId) {
    return []
  }

  const scopedAssignments = await getAllWorkAssignmentsDb({ workPlanId, workId })
  const legacyService = getLegacyWorkAssignmentsService()

  if (!legacyService) {
    return scopedAssignments
  }

  scopedAssignments.forEach(upsertWorkAssignmentMirror)
  return scopedAssignments
}

async function resolveWorkPlanIdData(data) {
  if (data.workPlanId !== undefined) {
    const workPlan = await getWorkPlanByIdData(data.workPlanId)

    if (!workPlan) {
      throw new Error('Work plan nao encontrado')
    }

    return workPlan.id
  }

  if (data.date) {
    const work = data.workId !== undefined ? await getWorkByIdData(data.workId) : null
    const companyId = work?.companyId

    if (!work) {
      throw new Error('Obra nao encontrada')
    }

    const existingWorkPlan = await getWorkPlanByDateData(data.date, companyId)

    if (existingWorkPlan) {
      return existingWorkPlan.id
    }

    return (await createWorkPlanData({ date: data.date, companyId })).id
  }

  throw new Error('workPlanId e obrigatorio')
}

async function validateRelationshipData(workPlanId, workId, personId) {
  const [workPlan, work, person] = await Promise.all([
    getWorkPlanByIdData(workPlanId),
    getWorkByIdData(workId),
    getPersonByIdData(personId),
  ])

  if (!workPlan) {
    throw new Error('Work plan nao encontrado')
  }

  if (!work) {
    throw new Error('Obra nao encontrada')
  }

  if (!person) {
    throw new Error('Pessoa nao encontrada')
  }

  return { workPlan, work, person }
}

function validateCompanyConsistencyData(workPlan, work, person) {
  if (Number(workPlan.companyId) !== Number(work.companyId)) {
    throw new Error('O work plan e a obra tem de pertencer a mesma empresa')
  }

  if (Number(person.companyId) !== Number(work.companyId)) {
    throw new Error('A pessoa e a obra tem de pertencer a mesma empresa')
  }
}

async function validateNoDuplicatePersonWorkData(
  workPlanId,
  personId,
  workId,
  excludeAssignmentId = null,
  options = {},
) {
  const matchingAssignments = await getAllWorkAssignmentsDb({ workPlanId, personId, workId })
  validateNoDuplicatePersonWork(
    matchingAssignments,
    workPlanId,
    personId,
    workId,
    excludeAssignmentId,
    options,
  )
}

async function resolveAuditMetadata(value, actorSession = null) {
  const fallbackName = String(
    value ?? actorSession?.name ?? actorSession?.username ?? actorSession?.userId ?? '',
  ).trim()

  if (!actorSession?.username) {
    return {
      userId: null,
      name: fallbackName || null,
    }
  }

  const user = await prisma.user.findUnique({
    where: { username: String(actorSession.username).trim() },
    select: {
      id: true,
      name: true,
      username: true,
    },
  })

  return {
    userId: user?.id || null,
    name: user?.name || fallbackName || user?.username || null,
  }
}

function enrichAssignmentsWithResolvedAccess(assignments) {
  const resolvedChefAccessMap = buildResolvedChefAccessMap(assignments)
  return assignments.map(assignment => enrichAssignment(assignment, resolvedChefAccessMap))
}

async function syncChefAccessForWorkPlanData(workPlanId) {
  if (isMysqlDataSourceEnabled()) {
    return null
  }

  const legacyService = getLegacyWorkAssignmentsService()

  if (!legacyService) {
    return null
  }

  legacyService.refresh()
  syncChefAccessForWorkPlan(legacyService.assignments, workPlanId)
  return null
}

export async function syncChefWorkAccessForWorkPlanData(workPlanId) {
  return syncChefAccessForWorkPlanData(workPlanId)
}

export function getAllWorkAssignments(filters) {
  return getLegacyWorkAssignmentsService()?.getAll(filters) || []
}

export function getWorkAssignmentById(id) {
  return getLegacyWorkAssignmentsService()?.getById(id) || null
}

export function createWorkAssignment(data) {
  return getLegacyWorkAssignmentsService()?.create(data) || null
}

export function updateWorkAssignment(id, data) {
  return getLegacyWorkAssignmentsService()?.update(id, data) || null
}

export function submitWorkAssignment(id, submittedBy) {
  return getLegacyWorkAssignmentsService()?.submitAssignment(id, submittedBy) || null
}

export function deleteWorkAssignment(id) {
  return getLegacyWorkAssignmentsService()?.delete(id) || false
}

export function repriceWorkAssignmentsForWork(workId, startDate) {
  return getLegacyWorkAssignmentsService()?.repriceForWork(workId, startDate) || 0
}

export function getAssignmentDefaults() {
  return {
    people: getAllPeople().map(person => ({
      id: person.id,
      name: person.name,
      defaultHourlyPrice: person.price,
      role: person.role,
      chefCategory: person.chefCategory || null,
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

export async function getAllWorkAssignmentsData(filters = {}) {
  if (!isMysqlDataSourceEnabled()) {
    return getAllWorkAssignments(filters)
  }

  const assignments = await getAllWorkAssignmentsDb(filters)
  return enrichAssignmentsWithResolvedAccess(assignments)
}

export async function getWorkAssignmentByIdData(id) {
  if (!isMysqlDataSourceEnabled()) {
    return getWorkAssignmentById(id)
  }

  const assignment = await getWorkAssignmentByIdDb(id)

  if (!assignment) {
    return null
  }

  return enrichAssignmentsWithResolvedAccess([assignment])[0] || null
}

export async function createWorkAssignmentData(data) {
  if (!isMysqlDataSourceEnabled()) {
    return createWorkAssignment(data)
  }

  const workPlanId = await resolveWorkPlanIdData(data)
  const { workPlan, work, person } = await validateRelationshipData(workPlanId, data.workId, data.personId)
  validateCompanyConsistencyData(workPlan, work, person)
  await validateNoDuplicatePersonWorkData(workPlanId, data.personId, data.workId, null, { work, person })

  const assignment = await createWorkAssignmentDb({
    workPlanId,
    workId: data.workId,
    personId: data.personId,
    hours: data.hours,
    dailyHours: data.dailyHours !== undefined ? data.dailyHours : data.hours,
    approvedHours: data.approvedHours ?? null,
    adminApprovedAt: data.adminApprovedAt ?? null,
    adminApprovedByUserId: data.adminApprovedByUserId ?? null,
    adminApprovedByName: data.adminApprovedByName ?? data.adminApprovedBy ?? null,
    submitted: data.submitted === true,
    submittedAt: data.submittedAt ?? null,
    submittedByUserId: data.submittedByUserId ?? null,
    submittedByName: data.submittedByName ?? data.submittedBy ?? null,
    hourlyCost: resolveAssignmentHourlyCost({
      workId: data.workId,
      personId: data.personId,
      hourlyCost: data.hourlyCost,
      manualHourlyCost: data.manualHourlyCost === true,
      work,
      person,
    }),
    manualHourlyCost: data.manualHourlyCost === true,
    notes: data.notes,
    hasWorkAccess: data.hasWorkAccess === true,
    planningVisible: data.planningVisible !== false,
  })

  if (assignment.hasWorkAccess) {
    await applyExclusiveChefWorkAccessDb(assignment.workPlanId, assignment.workId, assignment.id)
  }

  const scopedAssignments = await getAllWorkAssignmentsDb({
    workPlanId: assignment.workPlanId,
    workId: assignment.workId,
  })

  await syncChefAccessForWorkPlanData(assignment.workPlanId)

  const createdAssignment =
    assignment.hasWorkAccess
      ? scopedAssignments.find(item => Number(item.id) === Number(assignment.id)) || assignment
      : assignment

  return enrichAssignmentsWithResolvedAccess([createdAssignment])[0] || null
}

export async function updateWorkAssignmentData(id, data, options = {}) {
  if (!isMysqlDataSourceEnabled()) {
    return updateWorkAssignment(id, data)
  }

  const currentAssignment = await getWorkAssignmentByIdDb(id)

  if (!currentAssignment) {
    return null
  }

  const isApprovedHoursUpdate = data.approvedHours !== undefined
  const isSubmittedStatusUpdate =
    data.submitted !== undefined || data.submittedAt !== undefined || data.submittedBy !== undefined
  const isPlanningVisibilityOnlyUpdate =
    Object.keys(data || {}).every(key => key === 'planningVisible' || key === 'hasWorkAccess' || key === 'notes')

  if (
    currentAssignment.submitted &&
    !isApprovedHoursUpdate &&
    !isSubmittedStatusUpdate &&
    !options.allowSubmittedPlanningUpdate &&
    !isPlanningVisibilityOnlyUpdate
  ) {
    throw new Error('Esta afetacao ja foi submetida pelo chef e nao pode ser modificada. O administrador precisa de aprovar.')
  }

  const workPlanId =
    data.workPlanId !== undefined || data.date !== undefined
      ? await resolveWorkPlanIdData({
          ...currentAssignment,
          ...data,
          workId: data.workId !== undefined ? data.workId : currentAssignment.workId,
        })
      : currentAssignment.workPlanId
  const workId = data.workId !== undefined ? Number(data.workId) : Number(currentAssignment.workId)
  const personId = data.personId !== undefined ? Number(data.personId) : Number(currentAssignment.personId)

  const { workPlan, work, person } = await validateRelationshipData(workPlanId, workId, personId)
  validateCompanyConsistencyData(workPlan, work, person)
  await validateNoDuplicatePersonWorkData(workPlanId, personId, workId, currentAssignment.id, { work, person })

  const submittedAudit = isSubmittedStatusUpdate
    ? await resolveAuditMetadata(data.submittedBy, options.actorSession)
    : {
        userId: currentAssignment.submittedByUserId ?? null,
        name: currentAssignment.submittedByName || currentAssignment.submittedBy || null,
      }
  const shouldClearApprovalAudit =
    data.approvedHours === null || data.adminApprovedAt === null || data.adminApprovedBy === null
  const approvedAudit = shouldClearApprovalAudit
    ? {
        userId: null,
        name: null,
      }
    : data.approvedHours !== undefined || data.adminApprovedAt !== undefined || data.adminApprovedBy !== undefined
      ? await resolveAuditMetadata(data.adminApprovedBy, options.actorSession)
      : {
          userId: currentAssignment.adminApprovedByUserId ?? null,
          name: currentAssignment.adminApprovedByName || currentAssignment.adminApprovedBy || null,
        }

  const updatedAssignment = await updateWorkAssignmentDb(id, {
    workPlanId,
    workId,
    personId,
    hours: data.hours !== undefined ? data.hours : currentAssignment.hours,
    dailyHours:
      data.dailyHours !== undefined
        ? data.dailyHours
        : data.hours !== undefined
          ? data.hours
        : currentAssignment.dailyHours,
    approvedHours: data.approvedHours !== undefined ? data.approvedHours : currentAssignment.approvedHours,
    adminApprovedAt: data.adminApprovedAt !== undefined ? data.adminApprovedAt : currentAssignment.adminApprovedAt,
    adminApprovedByUserId: approvedAudit.userId,
    adminApprovedByName: approvedAudit.name,
    submitted: data.submitted !== undefined ? data.submitted === true : currentAssignment.submitted,
    submittedAt: data.submittedAt !== undefined ? data.submittedAt : currentAssignment.submittedAt,
    submittedByUserId: submittedAudit.userId,
    submittedByName: submittedAudit.name,
    hourlyCost: resolveAssignmentHourlyCost({
      workId,
      personId,
      hourlyCost: data.hourlyCost !== undefined ? data.hourlyCost : currentAssignment.hourlyCost,
      manualHourlyCost:
        data.manualHourlyCost !== undefined
          ? data.manualHourlyCost === true
          : currentAssignment.manualHourlyCost === true,
      work,
      person,
    }),
    manualHourlyCost:
      data.manualHourlyCost !== undefined
        ? data.manualHourlyCost === true
        : currentAssignment.manualHourlyCost === true,
    notes: data.notes !== undefined ? data.notes : currentAssignment.notes,
    hasWorkAccess:
      data.hasWorkAccess !== undefined
        ? data.hasWorkAccess === true
        : currentAssignment.hasWorkAccess === true,
    planningVisible:
      data.planningVisible !== undefined
        ? data.planningVisible !== false
        : currentAssignment.planningVisible !== false,
  })

  if (!updatedAssignment) {
    return null
  }

  if (updatedAssignment.hasWorkAccess) {
    await applyExclusiveChefWorkAccessDb(updatedAssignment.workPlanId, updatedAssignment.workId, updatedAssignment.id)
  }

  const scopedAssignments = await getAllWorkAssignmentsDb({
    workPlanId: updatedAssignment.workPlanId,
    workId: updatedAssignment.workId,
  })

  await syncChefAccessForWorkPlanData(currentAssignment.workPlanId)
  await syncChefAccessForWorkPlanData(updatedAssignment.workPlanId)

  const syncedAssignment =
    scopedAssignments.find(item => Number(item.id) === Number(updatedAssignment.id)) || updatedAssignment

  return enrichAssignmentsWithResolvedAccess([syncedAssignment])[0] || null
}

export async function submitWorkAssignmentData(id, submittedBy, options = {}) {
  if (!isMysqlDataSourceEnabled()) {
    return submitWorkAssignment(id, submittedBy)
  }

  return updateWorkAssignmentData(
    id,
    {
      approvedHours: null,
      adminApprovedAt: null,
      adminApprovedBy: null,
      submitted: true,
      submittedAt: new Date().toISOString(),
      submittedBy,
    },
    options,
  )
}

export async function deleteWorkAssignmentData(id) {
  if (!isMysqlDataSourceEnabled()) {
    return deleteWorkAssignment(id)
  }

  const currentAssignment = await getWorkAssignmentByIdDb(id)

  if (!currentAssignment) {
    return false
  }

  const deleted = await deleteWorkAssignmentDb(id)

  if (!deleted) {
    return false
  }

  await syncChefAccessForWorkPlanData(currentAssignment.workPlanId)
  return true
}

export async function updateWorkAssignmentPlanningData(id, data) {
  if (!isMysqlDataSourceEnabled()) {
    const legacyService = getLegacyWorkAssignmentsService()

    if (!legacyService) {
      return null
    }

    legacyService.refresh()

    const index = legacyService.assignments.findIndex(
      assignment => assignment.id === parseInt(id, 10),
    )

    if (index === -1) {
      return null
    }

    const currentAssignment = legacyService.assignments[index]
    const nextAssignment = new WorkAssignment({
      ...currentAssignment,
      ...(data.hourlyCost !== undefined ? { hourlyCost: data.hourlyCost } : {}),
      ...(data.manualHourlyCost !== undefined
        ? { manualHourlyCost: data.manualHourlyCost === true }
        : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.hasWorkAccess !== undefined
        ? { hasWorkAccess: data.hasWorkAccess === true }
        : {}),
      ...(data.planningVisible !== undefined
        ? { planningVisible: data.planningVisible !== false }
        : {}),
    })

    legacyService.assignments[index] = nextAssignment

    if (nextAssignment.hasWorkAccess) {
      applyExclusiveChefWorkAccess(
        legacyService.assignments,
        nextAssignment.workPlanId,
        nextAssignment.workId,
        nextAssignment.id,
      )
    }

    legacyService.save()
    syncChefAccessForWorkPlan(legacyService.assignments, nextAssignment.workPlanId)
    return enrichAssignment(nextAssignment, buildResolvedChefAccessMap(legacyService.assignments))
  }

  const allowedKeys = new Set([
    'hourlyCost',
    'manualHourlyCost',
    'notes',
    'hasWorkAccess',
    'planningVisible',
  ])
  const payload = Object.fromEntries(
    Object.entries(data || {}).filter(([key]) => allowedKeys.has(key)),
  )

  return updateWorkAssignmentData(id, payload, {
    allowSubmittedPlanningUpdate: true,
  })
}

export async function repriceWorkAssignmentsForWorkData(workId, startDate) {
  if (!isMysqlDataSourceEnabled()) {
    return repriceWorkAssignmentsForWork(workId, startDate)
  }

  const normalizedWorkId = parseInt(workId, 10)
  const normalizedStartDate = String(startDate || '').slice(0, 10)

  if (!Number.isInteger(normalizedWorkId) || !normalizedStartDate) {
    return 0
  }

  const assignments = await getAllWorkAssignmentsDb({ workId: normalizedWorkId })
  let updatedCount = 0

  for (const assignment of assignments) {
    const assignmentDate = assignment.workPlan?.date

    if (!assignmentDate || assignmentDate < normalizedStartDate) {
      continue
    }

    if (assignment.manualHourlyCost || isAssignmentApproved(assignment)) {
      continue
    }

    const nextHourlyCost = resolveAssignmentHourlyCost({
      workId: assignment.workId,
      personId: assignment.personId,
      hourlyCost: assignment.hourlyCost,
      manualHourlyCost: false,
      work: assignment.work,
      person: assignment.person,
    })

    if (Number(nextHourlyCost) === Number(assignment.hourlyCost)) {
      continue
    }

    const updatedAssignment = await updateWorkAssignmentDb(assignment.id, {
      hourlyCost: nextHourlyCost,
    })

    if (!updatedAssignment) {
      continue
    }

    updatedCount += 1
  }

  return updatedCount
}

export async function getAssignmentDefaultsData() {
  if (!isMysqlDataSourceEnabled()) {
    return getAssignmentDefaults()
  }

  const [people, works, workPlans] = await Promise.all([
    getAllPeopleData(),
    getAllWorksData(),
    getAllWorkPlansData(),
  ])

  return {
    people: people.map(person => ({
      id: person.id,
      name: person.name,
      defaultHourlyPrice: person.price,
      role: person.role,
      chefCategory: person.chefCategory || null,
    })),
    works: works.map(work => ({
      id: work.id,
      number: work.number,
      name: work.name,
      defaultHourlyCost: work.defaultHourlyCost,
      roleHourlyCosts: work.roleHourlyCosts,
      specialPersonHourlyCosts: work.specialPersonHourlyCosts,
      status: work.status,
    })),
    workPlans,
  }
}
