import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { resolveCompanyId } from './companies.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const workPlansFilePath = join(dataDir, 'work-plans.json')

export class WorkPlan {
  constructor(data) {
    this.id = data.id
    this.companyId = resolveCompanyId(data.companyId)
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

  getByDate(date, companyId) {
    const normalizedDate = normalizeDate(date)
    const normalizedCompanyId = resolveCompanyId(companyId)

    return (
      this.refresh().find(
        workPlan =>
          workPlan.date === normalizedDate &&
          resolveCompanyId(workPlan.companyId) === normalizedCompanyId,
      ) || null
    )
  }

  getNextId() {
    if (this.workPlans.length === 0) return 1
    return Math.max(...this.workPlans.map(workPlan => workPlan.id)) + 1
  }

  create(data) {
    this.refresh()
    const date = normalizeDate(data.date)
    const companyId = resolveCompanyId(data.companyId)

    if (this.getByDate(date, companyId)) {
      throw new Error('JÃ¡ existe um work plan para essa data')
    }

    const workPlan = new WorkPlan({
      id: this.getNextId(),
      companyId,
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
    const nextCompanyId =
      data.companyId !== undefined
        ? resolveCompanyId(data.companyId)
        : resolveCompanyId(this.workPlans[index].companyId)
    const duplicate = this.workPlans.find(
      workPlan =>
        workPlan.id !== parseInt(id) &&
        workPlan.date === nextDate &&
        resolveCompanyId(workPlan.companyId) === nextCompanyId,
    )

    if (duplicate) {
      throw new Error('JÃ¡ existe um work plan para essa data')
    }

    const updatedWorkPlan = new WorkPlan({
      ...this.workPlans[index],
      ...data,
      id: this.workPlans[index].id,
      companyId: nextCompanyId,
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
    throw new Error('date tem de ser uma data vÃ¡lida')
  }

  return value
}

function normalizeWorkPlans(list) {
  if (!Array.isArray(list)) return []

  const seenPlanKeys = new Set()

  return list
    .map((workPlan, index) => {
      try {
        return new WorkPlan({
          ...workPlan,
          id: workPlan.id !== undefined ? parseInt(workPlan.id) : index + 1,
          companyId: resolveCompanyId(workPlan.companyId),
        })
      } catch (error) {
        return null
      }
    })
    .filter(workPlan => {
      if (!workPlan) return false
      const planKey = `${resolveCompanyId(workPlan.companyId)}:${workPlan.date}`
      if (seenPlanKeys.has(planKey)) return false
      seenPlanKeys.add(planKey)
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

export function getWorkPlanByDate(date, companyId) {
  return workPlansService.getByDate(date, companyId)
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
