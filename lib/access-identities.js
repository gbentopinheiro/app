import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { getAdminByUsername } from './admins.js'
import { hashPasswordIfNeeded } from './passwords.js'
import { getPersonById } from './people.js'
import { ROLE_CHEF_PRIMEIRA, getRoleLabel, isSupportedRole, normalizeRole } from './roles.js'
import { getAllWorks, getWorkById } from './works.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const accessIdentitiesFilePath = join(dataDir, 'access-identities.json')
const legacyChefsFilePath = join(dataDir, 'chefs.json')

export class AccessIdentity {
  constructor(data) {
    this.id = data.id
    this.personId = normalizePersonId(data.personId)
    this.role = normalizeRole(data.role)
    this.username = String(data.username || '').trim()
    this.password = String(data.password || '').trim()
    this.works = normalizeWorksIds(data.works)
  }
}

export class AccessIdentitiesService {
  constructor(filePath = accessIdentitiesFilePath) {
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

    if (existsSync(this.filePath)) {
      try {
        const rawData = JSON.parse(readFileSync(this.filePath, 'utf8'))
        return normalizeIdentities(rawData)
      } catch (error) {
        console.error('Error loading access identities:', error.message)
        return []
      }
    }

    if (existsSync(legacyChefsFilePath)) {
      try {
        const rawData = JSON.parse(readFileSync(legacyChefsFilePath, 'utf8'))
        return normalizeIdentities(rawData.map(identity => ({ ...identity, role: ROLE_CHEF_PRIMEIRA })))
      } catch (error) {
        console.error('Error loading legacy chef identities:', error.message)
      }
    }

    return []
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
    const normalizedUsername = String(username || '').trim().toLowerCase()
    const identity = this.refresh().find(item => item.username.toLowerCase() === normalizedUsername)
    return identity ? enrichIdentity(identity) : null
  }

  getByPersonId(personId) {
    const normalizedPersonId = normalizePersonId(personId)

    if (!normalizedPersonId) {
      return null
    }

    const identity = this.refresh().find(item => item.personId === normalizedPersonId)
    return identity ? enrichIdentity(identity) : null
  }

  getNextId() {
    if (this.identities.length === 0) return 1
    return Math.max(...this.identities.map(identity => identity.id)) + 1
  }

  create(data, options = {}) {
    this.refresh()
    validateIdentityData(data, this.identities)

    const identity = new AccessIdentity({
      ...data,
      password: hashPasswordIfNeeded(data.password, options),
      id: this.getNextId(),
    })

    this.identities.push(identity)
    this.save()
    return enrichIdentity(identity)
  }

  update(id, data, options = {}) {
    this.refresh()

    const index = this.identities.findIndex(identity => identity.id === parseInt(id))
    if (index === -1) return null

    const currentIdentity = this.identities[index]
    validateIdentityData({ ...currentIdentity, ...data }, this.identities, currentIdentity.id)

    const updatedIdentity = new AccessIdentity({
      ...currentIdentity,
      ...data,
      password: data.password ? hashPasswordIfNeeded(data.password, options) : currentIdentity.password,
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

  deleteByPersonId(personId) {
    this.refresh()
    const normalizedPersonId = normalizePersonId(personId)

    if (!normalizedPersonId) {
      return false
    }

    const index = this.identities.findIndex(identity => identity.personId === normalizedPersonId)

    if (index === -1) {
      return false
    }

    this.identities.splice(index, 1)
    this.save()
    return true
  }

  pruneByValidPersonIds(validPersonIds) {
    this.refresh()
    const validIds = new Set(
      Array.from(validPersonIds || [])
        .map(personId => parseInt(personId))
        .filter(personId => Number.isInteger(personId) && personId > 0),
    )

    const nextIdentities = this.identities.filter(identity => !identity.personId || validIds.has(identity.personId))

    if (nextIdentities.length === this.identities.length) {
      return this.identities.map(enrichIdentity)
    }

    this.identities = nextIdentities
    this.save()
    return this.identities.map(enrichIdentity)
  }
}

function normalizePersonId(personId) {
  const parsedPersonId = parseInt(personId)
  return Number.isInteger(parsedPersonId) && parsedPersonId > 0 ? parsedPersonId : null
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
    .map((identity, index) => new AccessIdentity({
      ...identity,
      id: identity.id !== undefined ? parseInt(identity.id) : index + 1,
    }))
    .filter(identity => identity.username)
}

function validateIdentityData(data, existingIdentities, currentId = null) {
  const personId = normalizePersonId(data.personId)
  const role = String(data.role || '').trim().toLowerCase()
  const username = String(data.username || '').trim()
  const password = String(data.password || '').trim()

  if (!personId) {
    throw new Error('personId é obrigatório')
  }

  if (!role || !isSupportedRole(role)) {
    throw new Error('role é obrigatório')
  }

  if (!username) {
    throw new Error('username é obrigatório')
  }

  if (!password) {
    throw new Error('password é obrigatória')
  }

  const duplicatedUsername = existingIdentities.find(identity =>
    identity.id !== currentId && identity.username.toLowerCase() === username.toLowerCase(),
  )

  if (duplicatedUsername) {
    throw new Error('Já existe uma identidade com esse username')
  }

  if (getAdminByUsername(username)) {
    throw new Error('Já existe um acesso legacy com esse username')
  }

  const duplicatedPerson = existingIdentities.find(
    identity => identity.id !== currentId && identity.personId === personId,
  )

  if (duplicatedPerson) {
    throw new Error('Já existe uma identidade para essa pessoa')
  }

  const person = getPersonById(personId)

  if (!person) {
    throw new Error(`Pessoa ${personId} não encontrada`)
  }

  const normalizedRole = normalizeRole(role)

  if (person.role !== normalizedRole) {
    throw new Error(`A pessoa selecionada tem de ter role ${normalizedRole}`)
  }

  const works = normalizeWorksIds(data.works)
  for (const workId of works) {
    if (!getWorkById(workId)) {
      throw new Error(`Obra ${workId} não encontrada`)
    }
  }
}

function enrichIdentity(identity) {
  const person = identity.personId ? getPersonById(identity.personId) : null

  return {
    ...identity,
    roleLabel: getRoleLabel(identity.role),
    person: identity.personId
      ? person
        ? {
            id: person.id,
            name: person.name,
            role: person.role,
          }
        : {
            id: identity.personId,
            missing: true,
          }
      : null,
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

const accessIdentitiesService = new AccessIdentitiesService()

export function getAllAccessIdentities() {
  return accessIdentitiesService.getAll()
}

export function getAccessIdentityById(id) {
  return accessIdentitiesService.getById(id)
}

export function getAccessIdentityByUsername(username) {
  return accessIdentitiesService.getByUsername(username)
}

export function getAccessIdentityByPersonId(personId) {
  return accessIdentitiesService.getByPersonId(personId)
}

export function createAccessIdentity(data, options = {}) {
  return accessIdentitiesService.create(data, options)
}

export function updateAccessIdentity(id, data, options = {}) {
  return accessIdentitiesService.update(id, data, options)
}

export function syncAccessIdentityWorksForPerson(personId, works) {
  const identity = accessIdentitiesService.getByPersonId(personId)

  if (!identity) {
    return null
  }

  return accessIdentitiesService.update(identity.id, { works })
}

export function deleteAccessIdentity(id) {
  return accessIdentitiesService.delete(id)
}

export function deleteAccessIdentityByPersonId(personId) {
  return accessIdentitiesService.deleteByPersonId(personId)
}

export function pruneAccessIdentitiesByValidPersonIds(validPersonIds) {
  return accessIdentitiesService.pruneByValidPersonIds(validPersonIds)
}

export function getAccessIdentityWorkOptions() {
  return getAllWorks().map(work => ({
    id: work.id,
    number: work.number,
    name: work.name,
    clientId: work.clientId,
  }))
}
