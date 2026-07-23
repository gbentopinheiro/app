import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { normalizeClientSummaryLanguage } from './client-summary-language.js'
import { resolveCompanyId } from './companies.js'
import { getAllClientsDb, getClientByIdDb, getClientByNameDb, createClientDb, updateClientDb, deleteClientDb } from './db/clients-db.js'
import { isMysqlDataSourceEnabled } from './data-source.js'

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
    this.summaryLanguage = normalizeClientSummaryLanguage(data.summaryLanguage)
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
    if (isMysqlDataSourceEnabled()) {
      return
    }

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

function upsertClientMirror(clientData) {
  const normalizedClient = new Client(clientData)
  const legacyService = getLegacyClientsService()

  if (!legacyService) {
    return normalizedClient
  }

  legacyService.refresh()

  const existingIndex = legacyService.clients.findIndex(client => client.id === normalizedClient.id)

  if (existingIndex >= 0) {
    legacyService.clients[existingIndex] = normalizedClient
  } else {
    legacyService.clients.push(normalizedClient)
  }

  legacyService.save()
  return normalizedClient
}

function removeClientMirror(id) {
  const legacyService = getLegacyClientsService()

  if (!legacyService) {
    return false
  }

  legacyService.refresh()

  const normalizedId = parseInt(id, 10)
  const existingIndex = legacyService.clients.findIndex(client => client.id === normalizedId)

  if (existingIndex === -1) {
    return false
  }

  legacyService.clients.splice(existingIndex, 1)
  legacyService.save()
  return true
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

let clientsService = null

function getLegacyClientsService() {
  if (isMysqlDataSourceEnabled()) {
    return null
  }

  if (!clientsService) {
    clientsService = new ClientsService()
  }

  return clientsService
}

function normalizeDbError(error) {
  if (error?.code === 'P2002') {
    throw new Error('Ja existe um cliente com esse nome')
  }

  if (error?.code === 'P2003') {
    throw new Error('A empresa associada ao cliente nao existe')
  }

  throw error
}

export function getAllClients() {
  return getLegacyClientsService()?.getAll() || []
}

export function getClientById(id) {
  return getLegacyClientsService()?.getById(id) || null
}

export function getClientByName(name, companyId) {
  return getLegacyClientsService()?.getByName(name, companyId) || null
}

export function createClient(data) {
  return getLegacyClientsService()?.create(data) || null
}

export function updateClient(id, data) {
  return getLegacyClientsService()?.update(id, data) || null
}

export function deleteClient(id) {
  return getLegacyClientsService()?.delete(id) || false
}

export async function getAllClientsData() {
  if (!isMysqlDataSourceEnabled()) {
    return getAllClients()
  }

  return getAllClientsDb()
}

export async function getClientByIdData(id) {
  if (!isMysqlDataSourceEnabled()) {
    return getClientById(id)
  }

  return getClientByIdDb(id)
}

export async function getClientByNameData(name, companyId) {
  if (!isMysqlDataSourceEnabled()) {
    return getClientByName(name, companyId)
  }

  return getClientByNameDb(name, companyId)
}

export async function createClientData(data) {
  if (!isMysqlDataSourceEnabled()) {
    return createClient(data)
  }

  try {
    return await createClientDb(data)
  } catch (error) {
    normalizeDbError(error)
  }
}

export async function updateClientData(id, data) {
  if (!isMysqlDataSourceEnabled()) {
    return updateClient(id, data)
  }

  try {
    return await updateClientDb(id, data)
  } catch (error) {
    normalizeDbError(error)
  }
}

export async function deleteClientData(id) {
  if (!isMysqlDataSourceEnabled()) {
    return deleteClient(id)
  }

  return deleteClientDb(id)
}
