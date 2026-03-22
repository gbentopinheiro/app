import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { getAllClients, getClientById, getClientByName } from './clients.js'

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

export class Work {
  constructor(data) {
    this.id = data.id
    this.number = data.number
    this.name = String(data.name || '').trim()
    this.clientId = resolveClientId(data)
    this.location = String(data.location || '').trim()
    this.status = normalizeStatus(data.status)
    this.budget = parseFloat(data.budget) || 0
    this.defaultHourlyCost = parseFloat(data.defaultHourlyCost) || 0
    this.startDate = data.startDate || null
    this.endDate = data.endDate || null
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
      name: work.name,
      clientId: work.clientId,
      location: work.location,
      status: work.status,
      budget: work.budget,
      defaultHourlyCost: work.defaultHourlyCost,
      startDate: work.startDate,
      endDate: work.endDate,
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
