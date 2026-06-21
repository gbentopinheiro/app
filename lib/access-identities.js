import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { getAdminByUsername } from './admins.js'
import { isMysqlDataSourceEnabled } from './data-source.js'
import { getAllWorkAssignmentsDb } from './db/work-assignments-db.js'
import {
  createAccessIdentityDb,
  deleteAccessIdentityByPersonIdDb,
  deleteAccessIdentityDb,
  getAllAccessIdentitiesDb,
  getAccessIdentityByIdDb,
  getAccessIdentityByPersonIdDb,
  getAccessIdentityByUsernameDb,
  updateAccessIdentityDb,
} from './db/access-identities-db.js'
import { hashPasswordIfNeeded } from './passwords.js'
import { getPersonById, getPersonByIdData } from './people.js'
import { ROLE_CHEF_PRIMEIRA, getRoleLabel, isChefRole, isSupportedRole, normalizeRole, roleUsesWorkScope } from './roles.js'
import { getAllWorks, getAllWorksData, getWorkById, getWorkByIdData } from './works.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const accessIdentitiesFilePath = join(dataDir, 'access-identities.json')
const legacyChefsFilePath = join(dataDir, 'chefs.json')
let accessIdentitiesService = null

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
    if (isMysqlDataSourceEnabled()) {
      return
    }

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

function enrichIdentity(identity, options = {}) {
  const person = options.person !== undefined
    ? options.person
    : identity.personId
      ? getPersonById(identity.personId)
      : null
  const works = options.works !== undefined
    ? options.works
    : identity.works.map(workId => {
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
    })

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
    works,
  }
}

function buildLegacyIdentityIndex(identities = null) {
  const legacyIdentities = Array.isArray(identities)
    ? identities
    : getLegacyAccessIdentitiesService()?.getAll() || []

  return {
    byId: new Map(
      legacyIdentities
        .map(identity => [Number(identity.id), identity])
        .filter(([id]) => Number.isInteger(id) && id > 0),
    ),
    byPersonId: new Map(
      legacyIdentities
        .map(identity => [Number(identity.personId), identity])
        .filter(([personId]) => Number.isInteger(personId) && personId > 0),
    ),
    byUsername: new Map(
      legacyIdentities
        .map(identity => [String(identity.username || '').trim().toLowerCase(), identity])
        .filter(([username]) => username),
    ),
  }
}

function getIndexedLegacyIdentity(index, user) {
  if (!index || !user) {
    return null
  }

  const normalizedLegacySourceId = parseInt(user.legacySourceId)
  const normalizedPersonId = parseInt(user.personId)
  const normalizedUsername = String(user.username || '').trim().toLowerCase()

  return (
    (normalizedLegacySourceId ? index.byId.get(normalizedLegacySourceId) : null) ||
    (normalizedPersonId ? index.byPersonId.get(normalizedPersonId) : null) ||
    (normalizedUsername ? index.byUsername.get(normalizedUsername) : null) ||
    null
  )
}

function getLegacyIdentityForDbUser(user, index = null) {
  if (!user) {
    return null
  }

  if (index) {
    return getIndexedLegacyIdentity(index, user)
  }

  const normalizedLegacySourceId = parseInt(user.legacySourceId)
  const normalizedPersonId = parseInt(user.personId)
  const normalizedUsername = String(user.username || '').trim()
  const legacyService = getLegacyAccessIdentitiesService()

  if (!legacyService) {
    return null
  }

  return (
    (normalizedLegacySourceId ? legacyService.getById(normalizedLegacySourceId) : null) ||
    (normalizedPersonId ? legacyService.getByPersonId(normalizedPersonId) : null) ||
    (normalizedUsername ? legacyService.getByUsername(normalizedUsername) : null) ||
    null
  )
}

async function resolveDbIdentityWorks(user, legacyIdentity = null) {
  const resolvedRole = user?.person?.role || user?.role || legacyIdentity?.role || ''

  if (!user?.personId || !roleUsesWorkScope(resolvedRole)) {
    return []
  }

  const assignments = await getAllWorkAssignmentsDb()

  if (assignments.length === 0) {
    return []
  }

  const chefAssignmentsByPlanWork = new Map()

  assignments.forEach(assignment => {
    if (!isChefRole(assignment?.person?.role)) {
      return
    }

    const key = `${Number(assignment.workPlanId)}:${Number(assignment.workId)}`
    const currentAssignments = chefAssignmentsByPlanWork.get(key) || []
    currentAssignments.push(assignment)
    chefAssignmentsByPlanWork.set(key, currentAssignments)
  })

  const sortedKeys = Array.from(chefAssignmentsByPlanWork.keys()).sort((left, right) => {
    const leftAssignments = chefAssignmentsByPlanWork.get(left) || []
    const rightAssignments = chefAssignmentsByPlanWork.get(right) || []
    const leftDate = String(leftAssignments[0]?.date || leftAssignments[0]?.workPlan?.date || '')
    const rightDate = String(rightAssignments[0]?.date || rightAssignments[0]?.workPlan?.date || '')
    const [leftWorkPlanId, leftWorkId] = left.split(':').map(Number)
    const [rightWorkPlanId, rightWorkId] = right.split(':').map(Number)

    return (
      leftDate.localeCompare(rightDate, 'pt-PT') ||
      leftWorkPlanId - rightWorkPlanId ||
      leftWorkId - rightWorkId
    )
  })

  const resolvedSelectedAssignments = []
  const previousChefByWorkId = new Map()

  sortedKeys.forEach(key => {
    const [, workId] = key.split(':').map(Number)
    const chefAssignments = (chefAssignmentsByPlanWork.get(key) || []).sort(
      (left, right) => Number(left.id) - Number(right.id),
    )

    if (chefAssignments.length === 0) {
      return
    }

    const explicitAssignment = chefAssignments.find(assignment => assignment.hasWorkAccess === true)
    const previousChefPersonId = previousChefByWorkId.get(String(workId))
    const previousChefAssignment = previousChefPersonId
      ? chefAssignments.find(assignment => Number(assignment.personId) === Number(previousChefPersonId))
      : null
    const selectedAssignment = explicitAssignment || previousChefAssignment || chefAssignments[0]

    resolvedSelectedAssignments.push(selectedAssignment)
    previousChefByWorkId.set(String(workId), Number(selectedAssignment.personId))
  })

  const scopedAssignments = resolvedSelectedAssignments.filter(
    assignment =>
      Number(assignment.personId) === Number(user.personId) &&
      assignment.work,
  )

  if (scopedAssignments.length === 0) {
    return []
  }

  const assignmentsWithDate = scopedAssignments.filter(assignment => assignment.date || assignment.workPlan?.date)
  const latestDate = assignmentsWithDate
    .map(assignment => String(assignment.date || assignment.workPlan?.date || ''))
    .sort((left, right) => right.localeCompare(left))[0]
  const latestAssignments = latestDate
    ? scopedAssignments.filter(
        assignment => String(assignment.date || assignment.workPlan?.date || '') === latestDate,
      )
    : scopedAssignments

  return Array.from(
    new Map(
      latestAssignments.map(assignment => [
        Number(assignment.work.id),
        {
          id: assignment.work.id,
          number: assignment.work.number,
          name: assignment.work.name,
          clientId: assignment.work.clientId,
        },
      ]),
    ).values(),
  ).sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'pt-PT'))
}

async function mapDbUserToAccessIdentity(user, index = null) {
  if (!user) {
    return null
  }

  const legacyIdentity = index ? getLegacyIdentityForDbUser(user, index) : null
  const works = await resolveDbIdentityWorks(user)

  return enrichIdentity(
    new AccessIdentity({
      id: user.id,
      personId: user.personId || null,
      role: user.person?.role || user.role || '',
      username: user.username,
      password: user.passwordHash || user.password,
      works: works.map(work => work.id ?? work),
    }),
    {
      person: user.person || null,
      works,
    },
  )
}

function getLegacyIdentityRollbackPayload(identity) {
  if (!identity) {
    return null
  }

  return {
    personId: identity.personId,
    role: identity.role,
    username: identity.username,
    password: identity.password,
    works: Array.isArray(identity.works) ? identity.works.map(work => work.id ?? work) : [],
  }
}

function rollbackLegacyIdentity(identityId, snapshot, options = {}) {
  if (!identityId) {
    return
  }

  const legacyService = getLegacyAccessIdentitiesService()

  if (!legacyService) {
    return
  }

  if (!snapshot) {
    legacyService.delete(identityId)
    return
  }

  legacyService.update(identityId, snapshot, {
    ...options,
    enforcePolicy: false,
  })
}

function getDbErrorMessage(error) {
  if (error?.code === 'P2002') {
    return 'Já existe uma conta com esse username ou pessoa associada.'
  }

  return error?.message || 'Erro ao guardar identidade de acesso.'
}

function validateIdentityDbPayload(data, options = {}) {
  const currentIdentity = options.currentIdentity || null
  const personId = normalizePersonId(data?.personId ?? currentIdentity?.personId)
  const role = normalizeRole(data?.role || currentIdentity?.person?.role || currentIdentity?.role || '')
  const username = String(data?.username ?? currentIdentity?.username ?? '').trim()
  const passwordHash = String(data?.passwordHash ?? currentIdentity?.passwordHash ?? currentIdentity?.password ?? '').trim()

  if (!personId) {
    throw new Error('personId Ã© obrigatÃ³rio')
  }

  if (!role || !isSupportedRole(role)) {
    throw new Error('role Ã© obrigatÃ³rio')
  }

  if (!username) {
    throw new Error('username Ã© obrigatÃ³rio')
  }

  if (!passwordHash) {
    throw new Error('password Ã© obrigatÃ³ria')
  }

  const person = getPersonById(personId)

  if (!person) {
    throw new Error(`Pessoa ${personId} nÃ£o encontrada`)
  }

  if (person.role !== role) {
    throw new Error(`A pessoa selecionada tem de ter role ${role}`)
  }

  const works = normalizeWorksIds(data?.works)
  for (const workId of works) {
    if (!getWorkById(workId)) {
      throw new Error(`Obra ${workId} nÃ£o encontrada`)
    }
  }

  return {
    personId,
    role,
    username,
    passwordHash,
    name: person.name || username,
  }
}

function getLegacyAccessIdentitiesService() {
  if (isMysqlDataSourceEnabled()) {
    return null
  }

  if (!accessIdentitiesService) {
    accessIdentitiesService = new AccessIdentitiesService()
  }

  return accessIdentitiesService
}

async function validateIdentityDbPayloadData(data, options = {}) {
  const currentIdentity = options.currentIdentity || null
  const personId = normalizePersonId(data?.personId ?? currentIdentity?.personId)
  const role = normalizeRole(data?.role || currentIdentity?.person?.role || currentIdentity?.role || '')
  const username = String(data?.username ?? currentIdentity?.username ?? '').trim()
  const passwordHash = String(data?.passwordHash ?? currentIdentity?.passwordHash ?? currentIdentity?.password ?? '').trim()

  if (!personId) {
    throw new Error('personId e obrigatorio')
  }

  if (!role || !isSupportedRole(role)) {
    throw new Error('role e obrigatorio')
  }

  if (!username) {
    throw new Error('username e obrigatorio')
  }

  if (!passwordHash) {
    throw new Error('password e obrigatoria')
  }

  const person = await getPersonByIdData(personId)

  if (!person) {
    throw new Error(`Pessoa ${personId} nao encontrada`)
  }

  if (person.role !== role) {
    throw new Error(`A pessoa selecionada tem de ter role ${role}`)
  }

  const works = normalizeWorksIds(data?.works)
  for (const workId of works) {
    // Keep work-scope validation aligned with the active data source.
    if (!(await getWorkByIdData(workId))) {
      throw new Error(`Obra ${workId} nao encontrada`)
    }
  }

  return {
    personId,
    role,
    username,
    passwordHash,
    name: person.name || username,
  }
}

export function getAllAccessIdentities() {
  return getLegacyAccessIdentitiesService()?.getAll() || []
}

export function getAccessIdentityById(id) {
  return getLegacyAccessIdentitiesService()?.getById(id) || null
}

export function getAccessIdentityByUsername(username) {
  return getLegacyAccessIdentitiesService()?.getByUsername(username) || null
}

export function getAccessIdentityByPersonId(personId) {
  return getLegacyAccessIdentitiesService()?.getByPersonId(personId) || null
}

export function createAccessIdentity(data, options = {}) {
  return getLegacyAccessIdentitiesService()?.create(data, options) || null
}

export function updateAccessIdentity(id, data, options = {}) {
  return getLegacyAccessIdentitiesService()?.update(id, data, options) || null
}

export function syncAccessIdentityWorksForPerson(personId, works) {
  if (isMysqlDataSourceEnabled()) {
    return null
  }

  const legacyService = getLegacyAccessIdentitiesService()
  const identity = legacyService?.getByPersonId(personId)

  if (!identity) {
    return null
  }

  return legacyService.update(identity.id, { works })
}

export function deleteAccessIdentity(id) {
  return getLegacyAccessIdentitiesService()?.delete(id) || false
}

export function deleteAccessIdentityByPersonId(personId) {
  return getLegacyAccessIdentitiesService()?.deleteByPersonId(personId) || false
}

export function pruneAccessIdentitiesByValidPersonIds(validPersonIds) {
  return getLegacyAccessIdentitiesService()?.pruneByValidPersonIds(validPersonIds) || []
}

export function getAccessIdentityWorkOptions() {
  return getAllWorks().map(work => ({
    id: work.id,
    number: work.number,
    name: work.name,
    clientId: work.clientId,
  }))
}

export async function getAllAccessIdentitiesData() {
  if (!isMysqlDataSourceEnabled()) {
    return getAllAccessIdentities()
  }

  const users = await getAllAccessIdentitiesDb()
  const mappedDbUsers = await Promise.all(users.map(user => mapDbUserToAccessIdentity(user)))

  return mappedDbUsers.sort((left, right) =>
    String(left.username || '').localeCompare(String(right.username || ''), 'pt-PT'),
  )
}

export async function getAccessIdentityByIdData(id) {
  if (isMysqlDataSourceEnabled()) {
    const dbIdentity = await getAccessIdentityByIdDb(id)

    return dbIdentity ? mapDbUserToAccessIdentity(dbIdentity) : null
  }

  return getAccessIdentityById(id)
}

export async function getAccessIdentityByUsernameData(username) {
  if (isMysqlDataSourceEnabled()) {
    const dbIdentity = await getAccessIdentityByUsernameDb(username)

    return dbIdentity ? mapDbUserToAccessIdentity(dbIdentity) : null
  }

  return getAccessIdentityByUsername(username)
}

export async function getAccessIdentityByPersonIdData(personId) {
  if (isMysqlDataSourceEnabled()) {
    const dbIdentity = await getAccessIdentityByPersonIdDb(personId)

    return dbIdentity ? mapDbUserToAccessIdentity(dbIdentity) : null
  }

  return getAccessIdentityByPersonId(personId)
}

export async function createAccessIdentityData(data, options = {}) {
  if (!isMysqlDataSourceEnabled()) {
    return createAccessIdentity(data, options)
  }

  try {
    const passwordHash = hashPasswordIfNeeded(data?.password, options)
    const payload = await validateIdentityDbPayloadData(
      {
        ...data,
        passwordHash,
      },
      { currentIdentity: null },
    )
    const dbIdentity = await createAccessIdentityDb({
      personId: payload.personId,
      role: payload.role,
      username: payload.username,
      passwordHash: payload.passwordHash,
      name: payload.name,
      legacySource: 'access_identity',
      active: true,
    })

    return mapDbUserToAccessIdentity(dbIdentity)
  } catch (error) {
    throw new Error(getDbErrorMessage(error))
  }
}

export async function updateAccessIdentityData(id, data, options = {}) {
  if (!isMysqlDataSourceEnabled()) {
    return updateAccessIdentity(id, data, options)
  }

  const currentDbIdentity = await getAccessIdentityByIdDb(id)

  if (!currentDbIdentity) {
    return null
  }

  try {
    const passwordHash = data?.password
      ? hashPasswordIfNeeded(data.password, options)
      : currentDbIdentity.passwordHash || currentDbIdentity.password
    const payload = await validateIdentityDbPayloadData(
      {
        ...data,
        passwordHash,
      },
      { currentIdentity: currentDbIdentity },
    )
    const dbIdentity = await updateAccessIdentityDb(currentDbIdentity.id, {
      personId: payload.personId,
      role: payload.role,
      username: payload.username,
      passwordHash: payload.passwordHash,
      name: payload.name,
    })

    return mapDbUserToAccessIdentity(dbIdentity)
  } catch (error) {
    throw new Error(getDbErrorMessage(error))
  }
}

export async function deleteAccessIdentityData(id) {
  if (!isMysqlDataSourceEnabled()) {
    return deleteAccessIdentity(id)
  }

  const currentDbIdentity = await getAccessIdentityByIdDb(id)

  if (!currentDbIdentity) {
    return false
  }

  const deleted = await deleteAccessIdentityDb(currentDbIdentity.id)

  return deleted
}

export async function deleteAccessIdentityByPersonIdData(personId) {
  if (!isMysqlDataSourceEnabled()) {
    return deleteAccessIdentityByPersonId(personId)
  }

  const currentDbIdentity = await getAccessIdentityByPersonIdDb(personId)

  if (!currentDbIdentity) {
    return false
  }

  const deleted = await deleteAccessIdentityByPersonIdDb(personId)

  return deleted
}

export async function pruneAccessIdentitiesByValidPersonIdsData(validPersonIds) {
  if (!isMysqlDataSourceEnabled()) {
    return pruneAccessIdentitiesByValidPersonIds(validPersonIds)
  }

  const validIds = new Set(
    Array.from(validPersonIds || [])
      .map(personId => parseInt(personId))
      .filter(personId => Number.isInteger(personId) && personId > 0),
  )

  const identities = await getAllAccessIdentitiesDb()

  await Promise.all(
    identities
      .filter(identity => identity.personId && !validIds.has(identity.personId))
      .map(identity => deleteAccessIdentityDb(identity.id)),
  )

  return getAllAccessIdentitiesData()
}

export async function getAccessIdentityWorkOptionsData() {
  if (!isMysqlDataSourceEnabled()) {
    return getAccessIdentityWorkOptions()
  }

  const works = await getAllWorksData()

  return works.map(work => ({
    id: work.id,
    number: work.number,
    name: work.name,
    clientId: work.clientId,
  }))
}
