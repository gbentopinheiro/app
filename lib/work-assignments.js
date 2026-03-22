import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { getAllPeople, getPersonById } from './people.js'
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
    this.hours = parseFloat(data.hours) || 0
    this.hourlyCost = parseFloat(data.hourlyCost) || 0
    this.notes = String(data.notes || '').trim()
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

    return assignments
      .filter(assignment => !filters.workPlanId || assignment.workPlanId === parseInt(filters.workPlanId))
      .filter(assignment => !filters.workId || assignment.workId === parseInt(filters.workId))
      .filter(assignment => !filters.personId || assignment.personId === parseInt(filters.personId))
      .filter(assignment => {
        if (!filters.date) return true
        const workPlan = getWorkPlanById(assignment.workPlanId)
        return workPlan?.date === filters.date
      })
      .map(enrichAssignment)
  }

  getById(id) {
    const assignment = this.refresh().find(item => item.id === parseInt(id))
    return assignment ? enrichAssignment(assignment) : null
  }

  getNextId() {
    if (this.assignments.length === 0) return 1
    return Math.max(...this.assignments.map(assignment => assignment.id)) + 1
  }

  create(data) {
    this.refresh()

    const workPlanId = resolveWorkPlanId(data)
    validateRelationship(workPlanId, data.workId, data.personId)

    const assignment = new WorkAssignment({
      ...data,
      id: this.getNextId(),
      workPlanId,
      hourlyCost: data.hourlyCost !== undefined ? data.hourlyCost : getDefaultHourlyCost(data.workId),
    })

    this.assignments.push(assignment)
    this.save()
    return enrichAssignment(assignment)
  }

  update(id, data) {
    this.refresh()

    const index = this.assignments.findIndex(assignment => assignment.id === parseInt(id))
    if (index === -1) return null

    const currentAssignment = this.assignments[index]
    const workPlanId = data.workPlanId !== undefined || data.date !== undefined
      ? resolveWorkPlanId({ ...currentAssignment, ...data })
      : currentAssignment.workPlanId
    const workId = data.workId !== undefined ? data.workId : currentAssignment.workId
    const personId = data.personId !== undefined ? data.personId : currentAssignment.personId

    validateRelationship(workPlanId, workId, personId)

    const updatedAssignment = new WorkAssignment({
      ...currentAssignment,
      ...data,
      id: currentAssignment.id,
      workPlanId,
      workId,
      personId,
      hourlyCost: data.hourlyCost !== undefined
        ? data.hourlyCost
        : currentAssignment.hourlyCost || getDefaultHourlyCost(workId),
    })

    this.assignments[index] = updatedAssignment
    this.save()
    return enrichAssignment(updatedAssignment)
  }

  delete(id) {
    this.refresh()

    const index = this.assignments.findIndex(assignment => assignment.id === parseInt(id))
    if (index === -1) return false

    this.assignments.splice(index, 1)
    this.save()
    return true
  }
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
      throw new Error('Work plan nao encontrado')
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

  throw new Error('workPlanId e obrigatorio')
}

function validateRelationship(workPlanId, workId, personId) {
  if (!getWorkPlanById(workPlanId)) {
    throw new Error('Work plan nao encontrado')
  }

  if (!getWorkById(workId)) {
    throw new Error('Obra nao encontrada')
  }

  if (!getPersonById(personId)) {
    throw new Error('Pessoa nao encontrada')
  }
}

function getDefaultHourlyCost(workId) {
  const work = getWorkById(workId)
  return work ? parseFloat(work.defaultHourlyCost) || 0 : 0
}

function enrichAssignment(assignment) {
  const person = getPersonById(assignment.personId)
  const work = getWorkById(assignment.workId)
  const workPlan = getWorkPlanById(assignment.workPlanId)

  return {
    ...assignment,
    date: workPlan?.date || null,
    totalCost: Number((assignment.hours * assignment.hourlyCost).toFixed(2)),
    person: person ? {
      id: person.id,
      name: person.name,
      defaultHourlyPrice: person.price,
    } : null,
    work: work ? {
      id: work.id,
      number: work.number,
      name: work.name,
      defaultHourlyCost: work.defaultHourlyCost,
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

export function deleteWorkAssignment(id) {
  return workAssignmentsService.delete(id)
}

export function getAssignmentDefaults() {
  return {
    people: getAllPeople().map(person => ({
      id: person.id,
      name: person.name,
      defaultHourlyPrice: person.price,
    })),
    works: getAllWorks().map(work => ({
      id: work.id,
      number: work.number,
      name: work.name,
      defaultHourlyCost: work.defaultHourlyCost,
      status: work.status,
    })),
    workPlans: getAllWorkPlans(),
  }
}
