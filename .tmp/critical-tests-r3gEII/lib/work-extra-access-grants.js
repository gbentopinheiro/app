import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { isMysqlDataSourceEnabled } from './data-source.js'
import {
  getAllWorkExtraAccessGrantsDb,
  replaceWorkExtraAccessSelectionsDb,
} from './db/work-extra-access-grants-db.js'
import { getPersonById, getPersonByIdData } from './people.js'
import { getWorkById, getWorkByIdData } from './works.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const workExtraAccessGrantsFilePath = join(dataDir, 'work-extra-access-grants.json')
let workExtraAccessGrantsService = null

function normalizePositiveInt(value) {
  const parsedValue = Number.parseInt(value, 10)
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
}

function normalizePositiveIntList(values = []) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [values])
        .map(value => normalizePositiveInt(value))
        .filter(value => Number.isInteger(value) && value > 0),
    ),
  )
}

function toDateTimeString(value, fallback = null) {
  if (!value) {
    return fallback
  }

  const candidate = value instanceof Date ? value : new Date(value)
  return Number.isNaN(candidate.getTime()) ? fallback : candidate.toISOString()
}

export class WorkExtraAccessGrant {
  constructor(data) {
    this.id = normalizePositiveInt(data?.id)
    this.personId = normalizePositiveInt(data?.personId)
    this.workId = normalizePositiveInt(data?.workId)
    this.createdAt = toDateTimeString(data?.createdAt, new Date().toISOString())
    this.updatedAt = toDateTimeString(data?.updatedAt, this.createdAt)
  }
}

export class WorkExtraAccessGrantsService {
  constructor(filePath = workExtraAccessGrantsFilePath) {
    this.filePath = filePath
    this.grants = this.load()
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
      const rawValue = JSON.parse(readFileSync(this.filePath, 'utf8'))
      return Array.isArray(rawValue)
        ? rawValue
            .map(item => new WorkExtraAccessGrant(item))
            .filter(item => item.id && item.personId && item.workId)
        : []
    } catch (error) {
      console.error('Error loading work extra access grants:', error.message)
      return []
    }
  }

  save() {
    if (isMysqlDataSourceEnabled()) {
      return
    }

    this.ensureDataDir()
    writeFileSync(this.filePath, JSON.stringify(this.grants, null, 2), 'utf8')
  }

  refresh() {
    this.grants = this.load()
    return this.grants
  }

  getNextId() {
    if (this.grants.length === 0) {
      return 1
    }

    return Math.max(...this.grants.map(grant => grant.id)) + 1
  }

  getAll(filters = {}) {
    return this.refresh()
      .filter(grant => !filters.personId || grant.personId === normalizePositiveInt(filters.personId))
      .filter(grant => !filters.workId || grant.workId === normalizePositiveInt(filters.workId))
      .filter(grant =>
        !Array.isArray(filters.personIds) ||
        filters.personIds.length === 0 ||
        normalizePositiveIntList(filters.personIds).includes(grant.personId),
      )
      .filter(grant =>
        !Array.isArray(filters.workIds) ||
        filters.workIds.length === 0 ||
        normalizePositiveIntList(filters.workIds).includes(grant.workId),
      )
      .map(grant => enrichWorkExtraAccessGrant(grant))
  }

  replaceSelectionsByPerson(selectionsByPersonId = {}) {
    this.refresh()

    const normalizedSelections = Object.fromEntries(
      Object.entries(selectionsByPersonId || {})
        .map(([personId, workIds]) => [
          normalizePositiveInt(personId),
          normalizePositiveIntList(workIds),
        ])
        .filter(([personId]) => Number.isInteger(personId) && personId > 0),
    )
    const personIds = Object.keys(normalizedSelections).map(value => Number(value))
    const nextGrants = this.grants.filter(
      grant => !personIds.includes(Number(grant.personId)),
    )
    let nextGrantId =
      nextGrants.length > 0
        ? Math.max(...nextGrants.map(grant => Number(grant.id) || 0)) + 1
        : 1

    personIds.forEach(personId => {
      normalizedSelections[personId].forEach(workId => {
        nextGrants.push(
          new WorkExtraAccessGrant({
            id: nextGrantId++,
            personId,
            workId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        )
      })
    })

    this.grants = nextGrants
    this.save()
    return this.getAll({ personIds })
  }
}

function getLegacyWorkExtraAccessGrantsService() {
  if (isMysqlDataSourceEnabled()) {
    return null
  }

  if (!workExtraAccessGrantsService) {
    workExtraAccessGrantsService = new WorkExtraAccessGrantsService()
  }

  return workExtraAccessGrantsService
}

function enrichWorkExtraAccessGrant(grant, options = {}) {
  const person = options.person !== undefined ? options.person : getPersonById(grant.personId)
  const work = options.work !== undefined ? options.work : getWorkById(grant.workId)

  return {
    ...grant,
    person: person
      ? {
          id: person.id,
          name: person.name,
          role: person.role,
          chefCategory: person.chefCategory || null,
          companyId: person.companyId,
        }
      : null,
    work: work
      ? {
          id: work.id,
          number: work.number,
          name: work.name,
          clientId: work.clientId,
          companyId: work.companyId,
          status: work.status,
        }
      : null,
  }
}

export function buildWorkExtraAccessSelectionsByPerson(grants = []) {
  return Object.fromEntries(
    Array.from(
      (Array.isArray(grants) ? grants : []).reduce((selectionMap, grant) => {
        const personId = normalizePositiveInt(grant?.personId)
        const workId = normalizePositiveInt(grant?.workId)

        if (!personId || !workId) {
          return selectionMap
        }

        const currentSelection = selectionMap.get(personId) || new Set()
        currentSelection.add(workId)
        selectionMap.set(personId, currentSelection)
        return selectionMap
      }, new Map()).entries(),
    ).map(([personId, workIds]) => [String(personId), Array.from(workIds).sort((left, right) => left - right)]),
  )
}

export function getAllWorkExtraAccessGrants(filters = {}) {
  return getLegacyWorkExtraAccessGrantsService()?.getAll(filters) || []
}

export function getWorkExtraAccessWorkIdsByPerson(personId) {
  return getAllWorkExtraAccessGrants({ personId }).map(grant => Number(grant.workId))
}

export async function getAllWorkExtraAccessGrantsData(filters = {}) {
  if (!isMysqlDataSourceEnabled()) {
    return getAllWorkExtraAccessGrants(filters)
  }

  return getAllWorkExtraAccessGrantsDb(filters)
}

export async function getWorkExtraAccessWorkIdsByPersonData(personId) {
  return (await getAllWorkExtraAccessGrantsData({ personId })).map(grant => Number(grant.workId))
}

export async function getWorkExtraAccessSelectionsByPersonData(filters = {}) {
  return buildWorkExtraAccessSelectionsByPerson(
    await getAllWorkExtraAccessGrantsData(filters),
  )
}

export async function replaceWorkExtraAccessSelectionsData(selectionsByPersonId = {}) {
  if (!isMysqlDataSourceEnabled()) {
    return getLegacyWorkExtraAccessGrantsService()?.replaceSelectionsByPerson(selectionsByPersonId) || []
  }

  return replaceWorkExtraAccessSelectionsDb(selectionsByPersonId)
}

export async function enrichWorkExtraAccessGrantData(grant) {
  if (!grant) {
    return null
  }

  const [person, work] = await Promise.all([
    getPersonByIdData(grant.personId),
    getWorkByIdData(grant.workId),
  ])

  return enrichWorkExtraAccessGrant(grant, { person, work })
}
