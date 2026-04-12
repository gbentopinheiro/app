import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { getAllWorks, getWorkById } from './works.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const chefsFilePath = join(dataDir, 'chefs.json')

export class ChefIdentity {
  constructor(data) {
    this.id = data.id
    this.username = String(data.username || '').trim()
    this.password = String(data.password || '').trim()
    this.works = normalizeWorksIds(data.works)
  }
}

export class ChefsService {
  constructor(filePath = chefsFilePath) {
    this.filePath = filePath
    this.identities = this.load()
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
      return normalizeIdentities(rawData)
    } catch (error) {
      console.error('Error loading chef identities:', error.message)
      return []
    }
  }

  save() {
    this.ensureDataDir()
    writeFileSync(this.filePath, JSON.stringify(this.identities, null, 2), 'utf8')
  }

  refresh() {
    this.identities = this.load()
    return this.identities
  }

  getAll() {
    return this.refresh().map(enrichIdentity)
  }

  getById(id) {
    const identity = this.refresh().find(item => item.id === parseInt(id))
    return identity ? enrichIdentity(identity) : null
  }

  getByUsername(username) {
    const identity = this.refresh().find(
      item => item.username.toLowerCase() === String(username || '').trim().toLowerCase(),
    )
    return identity ? enrichIdentity(identity) : null
  }

  getNextId() {
    if (this.identities.length === 0) return 1
    return Math.max(...this.identities.map(identity => identity.id)) + 1
  }

  create(data) {
    this.refresh()
    validateIdentityData(data, this.identities)

    const identity = new ChefIdentity({
      ...data,
      id: this.getNextId(),
    })

    this.identities.push(identity)
    this.save()
    return enrichIdentity(identity)
  }

  update(id, data) {
    this.refresh()

    const index = this.identities.findIndex(identity => identity.id === parseInt(id))
    if (index === -1) return null

    const currentIdentity = this.identities[index]
    validateIdentityData({ ...currentIdentity, ...data }, this.identities, currentIdentity.id)

    const updatedIdentity = new ChefIdentity({
      ...currentIdentity,
      ...data,
      id: currentIdentity.id,
    })

    this.identities[index] = updatedIdentity
    this.save()
    return enrichIdentity(updatedIdentity)
  }

  delete(id) {
    this.refresh()

    const index = this.identities.findIndex(identity => identity.id === parseInt(id))
    if (index === -1) return false

    this.identities.splice(index, 1)
    this.save()
    return true
  }
}

function normalizeWorksIds(works) {
  if (!Array.isArray(works)) return []

  return Array.from(
    new Set(
      works
        .map(workId => parseInt(workId))
        .filter(workId => Number.isInteger(workId)),
    ),
  )
}

function normalizeIdentities(list) {
  if (!Array.isArray(list)) return []

  return list
    .map((identity, index) => new ChefIdentity({
      ...identity,
      id: identity.id !== undefined ? parseInt(identity.id) : index + 1,
    }))
    .filter(identity => identity.username)
}

function validateIdentityData(data, existingIdentities, currentId = null) {
  const username = String(data.username || '').trim()
  const password = String(data.password || '').trim()

  if (!username) {
    throw new Error('username e obrigatorio')
  }

  if (!password) {
    throw new Error('password e obrigatoria')
  }

  const duplicatedUsername = existingIdentities.find(identity =>
    identity.id !== currentId && identity.username.toLowerCase() === username.toLowerCase(),
  )

  if (duplicatedUsername) {
    throw new Error('Ja existe uma identidade com esse username')
  }

  const works = normalizeWorksIds(data.works)
  for (const workId of works) {
    if (!getWorkById(workId)) {
      throw new Error(`Obra ${workId} nao encontrada`)
    }
  }
}

function enrichIdentity(identity) {
  return {
    ...identity,
    works: identity.works.map(workId => {
      const work = getWorkById(workId)
      return work
        ? {
            id: work.id,
            number: work.number,
            name: work.name,
            clientId: work.clientId,
          }
        : {
            id: workId,
            missing: true,
          }
    }),
  }
}

const chefsService = new ChefsService()

export function getAllChefs() {
  return chefsService.getAll()
}

export function getChefById(id) {
  return chefsService.getById(id)
}

export function getChefByUsername(username) {
  return chefsService.getByUsername(username)
}

export function createChef(data) {
  return chefsService.create(data)
}

export function updateChef(id, data) {
  return chefsService.update(id, data)
}

export function deleteChef(id) {
  return chefsService.delete(id)
}

export function getChefWorkOptions() {
  return getAllWorks().map(work => ({
    id: work.id,
    number: work.number,
    name: work.name,
    clientId: work.clientId,
  }))
}
