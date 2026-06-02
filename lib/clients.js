import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { resolveCompanyId } from './companies.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const clientsFilePath = join(dataDir, 'clients.json')

export class Client {
  constructor(data) {
    this.id = data.id
    this.companyId = resolveCompanyId(data.companyId)
    this.name = String(data.name || '').trim()
    this.vatNumber = String(data.vatNumber || '').trim()
    this.contactName = String(data.contactName || '').trim()
    this.email = String(data.email || '').trim()
    this.phone = String(data.phone || '').trim()
    this.notes = String(data.notes || '').trim()
  }
}

export class ClientsService {
  constructor(filePath = clientsFilePath) {
    this.filePath = filePath
    this.clients = this.load()
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
      return normalizeClients(rawData)
    } catch (error) {
      console.error('Error loading clients:', error.message)
      return []
    }
  }

  save() {
    this.ensureDataDir()
    writeFileSync(this.filePath, JSON.stringify(this.clients, null, 2), 'utf8')
  }

  refresh() {
    this.clients = this.load()
    return this.clients
  }

  getAll() {
    return this.refresh()
  }

  getById(id) {
    return this.refresh().find(client => client.id === parseInt(id))
  }

  getByName(name, companyId) {
    const normalizedName = String(name || '').trim().toLowerCase()
    const normalizedCompanyId = companyId !== undefined ? resolveCompanyId(companyId) : null

    return (
      this.refresh().find(client =>
        client.name.toLowerCase() === normalizedName &&
        (normalizedCompanyId === null || client.companyId === normalizedCompanyId),
      ) || null
    )
  }

  getNextId() {
    if (this.clients.length === 0) return 1
    return Math.max(...this.clients.map(client => client.id)) + 1
  }

  create(data) {
    this.refresh()

    const client = new Client({
      ...data,
      id: this.getNextId(),
    })

    this.clients.push(client)
    this.save()
    return client
  }

  update(id, data) {
    this.refresh()

    const index = this.clients.findIndex(client => client.id === parseInt(id))
    if (index === -1) return null

    const updatedClient = new Client({
      ...this.clients[index],
      ...data,
      id: this.clients[index].id,
    })

    this.clients[index] = updatedClient
    this.save()
    return updatedClient
  }

  delete(id) {
    this.refresh()

    const index = this.clients.findIndex(client => client.id === parseInt(id))
    if (index === -1) return false

    this.clients.splice(index, 1)
    this.save()
    return true
  }
}

function normalizeClients(list) {
  if (!Array.isArray(list)) return []

  return list
    .map((client, index) => new Client({
      ...client,
      id: client.id !== undefined ? parseInt(client.id) : index + 1,
    }))
    .filter(client => client.name)
}

const clientsService = new ClientsService()

export function getAllClients() {
  return clientsService.getAll()
}

export function getClientById(id) {
  return clientsService.getById(id)
}

export function getClientByName(name, companyId) {
  return clientsService.getByName(name, companyId)
}

export function createClient(data) {
  return clientsService.create(data)
}

export function updateClient(id, data) {
  return clientsService.update(id, data)
}

export function deleteClient(id) {
  return clientsService.delete(id)
}
