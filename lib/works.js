import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { getAllClients, getClientById, getClientByName } from './clients.js'
import { resolveCompanyId } from './companies.js'
import { getPersonById } from './people.js'
import { ROLE_VALUES, normalizeRole } from './roles.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const worksFilePath = join(dataDir, 'works.json')

export const WorkStatus = Object.freeze({
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
})

const defaultWorkingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const validWorkingDays = new Set([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

export class Work {
  constructor(data) {
    this.id = data.id
    this.number = data.number
    this.companyId = resolveWorkCompanyId(data)
    this.name = String(data.name || '').trim()
    this.clientId = resolveClientId(data)
    this.location = String(data.location || '').trim()
    this.status = normalizeStatus(data.status)
    this.budget = parseFloat(data.budget) || 0
    this.defaultHourlyCost = parseFloat(data.defaultHourlyCost) || 0
    this.roleHourlyCosts = normalizeRoleHourlyCosts(data.roleHourlyCosts)
    this.specialPersonHourlyCosts = normalizeSpecialPersonHourlyCosts(data.specialPersonHourlyCosts)
    this.startDate = data.startDate || null
    this.endDate = data.endDate || null
    this.workingDays = normalizeWorkingDays(data.workingDays)
    this.notes = String(data.notes || '').trim()
  }
}

export class WorksService {
  constructor(filePath = worksFilePath) {
    this.filePath = filePath
    this.works = this.load()
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
      return normalizeWorks(rawData)
    } catch (error) {
      console.error('Error loading works:', error.message)
      return []
    }
  }

  save() {
    this.ensureDataDir()
    const serializedWorks = this.works.map(work => ({
      id: work.id,
      number: work.number,
      companyId: work.companyId,
      name: work.name,
      clientId: work.clientId,
      location: work.location,
      status: work.status,
      budget: work.budget,
      defaultHourlyCost: work.defaultHourlyCost,
      roleHourlyCosts: work.roleHourlyCosts,
      specialPersonHourlyCosts: work.specialPersonHourlyCosts,
      startDate: work.startDate,
      endDate: work.endDate,
      workingDays: work.workingDays,
      notes: work.notes,
    }))
    writeFileSync(this.filePath, JSON.stringify(serializedWorks, null, 2), 'utf8')
  }

  refresh() {
    this.works = this.load()
    return this.works
  }

  getAll() {
    return this.refresh().map(enrichWork)
  }

  getById(id) {
    const work = this.refresh().find(item => item.id === parseInt(id))
    return work ? enrichWork(work) : null
  }

  getNextId() {
    if (this.works.length === 0) return 1
    return Math.max(...this.works.map(work => work.id)) + 1
  }

  getNextNumber() {
    if (this.works.length === 0) return 1
    return Math.max(...this.works.map(work => work.number)) + 1
  }

  create(data) {
    this.refresh()

    const work = new Work({
      ...data,
      id: this.getNextId(),
      number: data.number !== undefined ? parseInt(data.number) : this.getNextNumber(),
    })

    this.works.push(work)
    this.save()
    return enrichWork(work)
  }

  update(id, data) {
    this.refresh()

    const index = this.works.findIndex(work => work.id === parseInt(id))
    if (index === -1) return null

    const updatedWork = new Work({
      ...this.works[index],
      ...data,
      id: this.works[index].id,
      number: data.number !== undefined ? parseInt(data.number) : this.works[index].number,
    })

    this.works[index] = updatedWork
    this.save()
    return enrichWork(updatedWork)
  }

  delete(id) {
    this.refresh()

    const index = this.works.findIndex(work => work.id === parseInt(id))
    if (index === -1) return false

    this.works.splice(index, 1)
    this.save()
    return true
  }
}

function normalizeStatus(status) {
  const validStatuses = new Set(Object.values(WorkStatus))
  return validStatuses.has(status) ? status : WorkStatus.PLANNED
}

function normalizeWorkingDays(workingDays) {
  if (!Array.isArray(workingDays)) {
    return defaultWorkingDays
  }

  const normalizedDays = Array.from(
    new Set(
      workingDays
        .map(day => String(day || '').trim().toLowerCase())
        .filter(day => validWorkingDays.has(day)),
    ),
  )

  return normalizedDays.length > 0 ? normalizedDays : defaultWorkingDays
}

function normalizeRoleHourlyCosts(roleHourlyCosts) {
  if (!roleHourlyCosts || typeof roleHourlyCosts !== 'object' || Array.isArray(roleHourlyCosts)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(roleHourlyCosts)
      .map(([role, value]) => [normalizeRole(role), parseFloat(value)])
      .filter(([role, value]) => ROLE_VALUES.includes(role) && !Number.isNaN(value) && value >= 0),
  )
}

function normalizeSpecialPersonHourlyCosts(specialPersonHourlyCosts) {
  if (!specialPersonHourlyCosts || typeof specialPersonHourlyCosts !== 'object' || Array.isArray(specialPersonHourlyCosts)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(specialPersonHourlyCosts)
      .map(([personId, value]) => [String(parseInt(personId, 10)), parseFloat(value)])
      .filter(([personId, value]) => Number.isInteger(Number(personId)) && getPersonById(personId) && !Number.isNaN(value) && value >= 0),
  )
}

function resolveClientId(work) {
  if (work.clientId !== undefined && getClientById(work.clientId)) {
    return parseInt(work.clientId)
  }

  if (typeof work.client === 'string') {
    const client = getClientByName(work.client)
    return client ? client.id : null
  }

  if (work.client && typeof work.client === 'object') {
    const client = getClientByName(work.client.name)
    return client ? client.id : null
  }

  return null
}

function resolveWorkCompanyId(work) {
  if (work.companyId !== undefined) {
    return resolveCompanyId(work.companyId)
  }

  const clientId = resolveClientId(work)
  const client = clientId ? getClientById(clientId) : null
  return resolveCompanyId(client?.companyId)
}

function enrichWork(work) {
  return {
    ...work,
    client: getClientById(work.clientId),
  }
}

function normalizeWorks(list) {
  if (!Array.isArray(list)) return []

  return list
    .map((work, index) => new Work({
      ...work,
      id: work.id !== undefined ? parseInt(work.id) : index + 1,
      number: work.number !== undefined ? parseInt(work.number) : index + 1,
    }))
    .filter(work => work.name && work.clientId)
}

const worksService = new WorksService()

export function getAllWorks() {
  return worksService.getAll()
}

export function getWorkById(id) {
  return worksService.getById(id)
}

export function createWork(data) {
  return worksService.create(data)
}

export function updateWork(id, data) {
  return worksService.update(id, data)
}

export function deleteWork(id) {
  return worksService.delete(id)
}

export function getWorkClientOptions() {
  return getAllClients().map(client => ({
    id: client.id,
    name: client.name,
  }))
}
