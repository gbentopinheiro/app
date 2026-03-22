import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const workPlansFilePath = join(dataDir, 'work-plans.json')

export class WorkPlan {
  constructor(data) {
    this.id = data.id
    this.date = normalizeDate(data.date)
  }
}

export class WorkPlansService {
  constructor(filePath = workPlansFilePath) {
    this.filePath = filePath
    this.workPlans = this.load()
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
      return normalizeWorkPlans(rawData)
    } catch (error) {
      console.error('Error loading work plans:', error.message)
      return []
    }
  }

  save() {
    this.ensureDataDir()
    writeFileSync(this.filePath, JSON.stringify(this.workPlans, null, 2), 'utf8')
  }

  refresh() {
    this.workPlans = this.load()
    return this.workPlans
  }

  getAll() {
    return this.refresh()
  }

  getById(id) {
    return this.refresh().find(workPlan => workPlan.id === parseInt(id)) || null
  }

  getByDate(date) {
    const normalizedDate = normalizeDate(date)
    return this.refresh().find(workPlan => workPlan.date === normalizedDate) || null
  }

  getNextId() {
    if (this.workPlans.length === 0) return 1
    return Math.max(...this.workPlans.map(workPlan => workPlan.id)) + 1
  }

  create(data) {
    this.refresh()
    const date = normalizeDate(data.date)

    if (this.getByDate(date)) {
      throw new Error('Ja existe um work plan para essa data')
    }

    const workPlan = new WorkPlan({
      id: this.getNextId(),
      date,
    })

    this.workPlans.push(workPlan)
    this.save()
    return workPlan
  }

  update(id, data) {
    this.refresh()

    const index = this.workPlans.findIndex(workPlan => workPlan.id === parseInt(id))
    if (index === -1) return null

    const nextDate = data.date !== undefined ? normalizeDate(data.date) : this.workPlans[index].date
    const duplicate = this.workPlans.find(workPlan => workPlan.id !== parseInt(id) && workPlan.date === nextDate)

    if (duplicate) {
      throw new Error('Ja existe um work plan para essa data')
    }

    const updatedWorkPlan = new WorkPlan({
      ...this.workPlans[index],
      ...data,
      id: this.workPlans[index].id,
      date: nextDate,
    })

    this.workPlans[index] = updatedWorkPlan
    this.save()
    return updatedWorkPlan
  }

  delete(id) {
    this.refresh()

    const index = this.workPlans.findIndex(workPlan => workPlan.id === parseInt(id))
    if (index === -1) return false

    this.workPlans.splice(index, 1)
    this.save()
    return true
  }
}

function normalizeDate(date) {
  const value = String(date || '').trim()

  if (!value || Number.isNaN(new Date(value).getTime())) {
    throw new Error('date tem de ser uma data valida')
  }

  return value
}

function normalizeWorkPlans(list) {
  if (!Array.isArray(list)) return []

  const seenDates = new Set()

  return list
    .map((workPlan, index) => {
      try {
        return new WorkPlan({
          ...workPlan,
          id: workPlan.id !== undefined ? parseInt(workPlan.id) : index + 1,
        })
      } catch (error) {
        return null
      }
    })
    .filter(workPlan => {
      if (!workPlan) return false
      if (seenDates.has(workPlan.date)) return false
      seenDates.add(workPlan.date)
      return true
    })
}

const workPlansService = new WorkPlansService()

export function getAllWorkPlans() {
  return workPlansService.getAll()
}

export function getWorkPlanById(id) {
  return workPlansService.getById(id)
}

export function getWorkPlanByDate(date) {
  return workPlansService.getByDate(date)
}

export function createWorkPlan(data) {
  return workPlansService.create(data)
}

export function updateWorkPlan(id, data) {
  return workPlansService.update(id, data)
}

export function deleteWorkPlan(id) {
  return workPlansService.delete(id)
}
