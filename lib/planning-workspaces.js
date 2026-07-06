import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { normalizeAssignmentPurpose } from './assignment-purpose.js'
import { resolveCompanyId } from './companies.js'
import { isMysqlDataSourceEnabled } from './data-source.js'
import { getPersonById, getPersonByIdData } from './people.js'
import { isChefRole } from './roles.js'
import { getWorkById, getWorkByIdData } from './works.js'
import {
  createPlanningWorkspaceAssignmentDb,
  createPlanningWorkspaceDb,
  getAllPlanningWorkspacesDb,
  deletePlanningWorkspaceAssignmentDb,
  deletePlanningWorkspaceAssignmentsByWorkspaceIdDb,
  getPlanningWorkspaceAssignmentByIdDb,
  getPlanningWorkspaceAssignmentsDb,
  getPlanningWorkspaceByDateDb,
  getPlanningWorkspaceByIdDb,
  updatePlanningWorkspaceAssignmentDb,
  updatePlanningWorkspaceDb,
} from './db/planning-workspaces-db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const planningWorkspacesFilePath = join(dataDir, 'planning-workspaces.json')
const planningWorkspaceAssignmentsFilePath = join(dataDir, 'planning-workspace-assignments.json')

export const PLANNING_WORKSPACE_STATE_DRAFT = 'draft'
export const PLANNING_WORKSPACE_STATE_PUBLISHED = 'published'

function normalizeDate(date) {
  const value = String(date || '').trim()

  if (!value || Number.isNaN(new Date(value).getTime())) {
    throw new Error('date tem de ser uma data valida')
  }

  return value.slice(0, 10)
}

function normalizePositiveInt(value, fallback = null) {
  const parsedValue = Number.parseInt(value, 10)
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback
}

function normalizeNonNegativeNumber(value, fallback = 0) {
  const parsedValue = Number.parseFloat(value)
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : fallback
}

function normalizePublicationState(value, fallback = PLANNING_WORKSPACE_STATE_DRAFT) {
  const normalizedValue = String(value || '').trim().toLowerCase()

  if (normalizedValue === PLANNING_WORKSPACE_STATE_PUBLISHED) {
    return PLANNING_WORKSPACE_STATE_PUBLISHED
  }

  if (normalizedValue === PLANNING_WORKSPACE_STATE_DRAFT) {
    return PLANNING_WORKSPACE_STATE_DRAFT
  }

  return fallback
}

function normalizeDateTime(value, fallback = new Date().toISOString()) {
  if (!value) {
    return fallback
  }

  const candidate = new Date(value)
  return Number.isNaN(candidate.getTime()) ? fallback : candidate.toISOString()
}

export class PlanningWorkspace {
  constructor(data) {
    this.id = normalizePositiveInt(data.id)
    this.companyId = resolveCompanyId(data.companyId)
    this.date = normalizeDate(data.date)
    this.state = normalizePublicationState(
      data.state,
      data.publishedWorkPlanId ? PLANNING_WORKSPACE_STATE_PUBLISHED : PLANNING_WORKSPACE_STATE_DRAFT,
    )
    this.publishedWorkPlanId = normalizePositiveInt(data.publishedWorkPlanId, null)
    this.publishedAt = data.publishedAt ? normalizeDateTime(data.publishedAt) : null
    this.createdAt = normalizeDateTime(data.createdAt)
    this.updatedAt = normalizeDateTime(data.updatedAt, this.createdAt)
  }
}

export class PlanningWorkspaceAssignment {
  constructor(data) {
    this.id = normalizePositiveInt(data.id)
    this.workspaceId = normalizePositiveInt(data.workspaceId)
    this.workId = normalizePositiveInt(data.workId)
    this.personId = normalizePositiveInt(data.personId)
    this.hourlyCost = normalizeNonNegativeNumber(data.hourlyCost)
    this.manualHourlyCost = data.manualHourlyCost === true
    this.notes = String(data.notes || '').trim()
    this.hasWorkAccess = data.hasWorkAccess === true
    this.assignmentPurpose = normalizeAssignmentPurpose(data.assignmentPurpose)
    this.createdAt = normalizeDateTime(data.createdAt)
    this.updatedAt = normalizeDateTime(data.updatedAt, this.createdAt)
  }
}

function normalizePlanningWorkspaces(list) {
  if (!Array.isArray(list)) {
    return []
  }

  const seenKeys = new Set()

  return list
    .map(item => {
      try {
        return new PlanningWorkspace(item)
      } catch {
        return null
      }
    })
    .filter(item => {
      if (!item) {
        return false
      }

      const key = `${item.companyId}:${item.date}`

      if (seenKeys.has(key)) {
        return false
      }

      seenKeys.add(key)
      return true
    })
}

function normalizePlanningWorkspaceAssignments(list) {
  if (!Array.isArray(list)) {
    return []
  }

  return list
    .map(item => {
      try {
        return new PlanningWorkspaceAssignment(item)
      } catch {
        return null
      }
    })
    .filter(item => item && item.workspaceId && item.workId && item.personId)
}

function enrichPlanningWorkspaceAssignment(assignment, personResolver, workResolver) {
  const person = personResolver(assignment.personId)
  const work = workResolver(assignment.workId)

  return {
    ...assignment,
    person: person
      ? {
          id: person.id,
          name: person.name,
          defaultHourlyPrice: person.price,
          role: person.role,
          chefCategory: person.chefCategory || null,
        }
      : null,
    work: work
      ? {
          id: work.id,
          number: work.number,
          name: work.name,
          defaultHourlyCost: work.defaultHourlyCost,
          roleHourlyCosts: work.roleHourlyCosts,
          specialPersonHourlyCosts: work.specialPersonHourlyCosts,
          status: work.status,
        }
      : null,
  }
}

export class PlanningWorkspacesService {
  constructor(
    workspacesPath = planningWorkspacesFilePath,
    assignmentsPath = planningWorkspaceAssignmentsFilePath,
  ) {
    this.workspacesPath = workspacesPath
    this.assignmentsPath = assignmentsPath
    this.workspaces = this.loadWorkspaces()
    this.assignments = this.loadAssignments()
  }

  ensureDataDir() {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  }

  loadWorkspaces() {
    this.ensureDataDir()

    if (!existsSync(this.workspacesPath)) {
      return []
    }

    try {
      return normalizePlanningWorkspaces(JSON.parse(readFileSync(this.workspacesPath, 'utf8')))
    } catch {
      return []
    }
  }

  loadAssignments() {
    this.ensureDataDir()

    if (!existsSync(this.assignmentsPath)) {
      return []
    }

    try {
      return normalizePlanningWorkspaceAssignments(
        JSON.parse(readFileSync(this.assignmentsPath, 'utf8')),
      )
    } catch {
      return []
    }
  }

  save() {
    if (isMysqlDataSourceEnabled()) {
      return
    }

    this.ensureDataDir()
    writeFileSync(this.workspacesPath, JSON.stringify(this.workspaces, null, 2), 'utf8')
    writeFileSync(this.assignmentsPath, JSON.stringify(this.assignments, null, 2), 'utf8')
  }

  refresh() {
    this.workspaces = this.loadWorkspaces()
    this.assignments = this.loadAssignments()
  }

  getWorkspaces() {
    this.refresh()
    return this.workspaces
  }

  getNextWorkspaceId() {
    if (this.workspaces.length === 0) {
      return 1
    }

    return Math.max(...this.workspaces.map(item => item.id || 0)) + 1
  }

  getNextAssignmentId() {
    if (this.assignments.length === 0) {
      return 1
    }

    return Math.max(...this.assignments.map(item => item.id || 0)) + 1
  }

  getWorkspaceById(id) {
    this.refresh()
    return this.workspaces.find(item => item.id === normalizePositiveInt(id)) || null
  }

  getWorkspaceByDate(date, companyId) {
    this.refresh()
    const normalizedDate = normalizeDate(date)
    const normalizedCompanyId = resolveCompanyId(companyId)

    return (
      this.workspaces.find(
        item => item.date === normalizedDate && Number(item.companyId) === Number(normalizedCompanyId),
      ) || null
    )
  }

  createWorkspace(data) {
    this.refresh()

    const normalizedCompanyId = resolveCompanyId(data?.companyId)
    const normalizedDate = normalizeDate(data?.date)

    if (this.getWorkspaceByDate(normalizedDate, normalizedCompanyId)) {
      throw new Error('Ja existe um draft de planeamento para essa data')
    }

    const workspace = new PlanningWorkspace({
      id: this.getNextWorkspaceId(),
      companyId: normalizedCompanyId,
      date: normalizedDate,
      state: data?.state,
      publishedWorkPlanId: data?.publishedWorkPlanId,
      publishedAt: data?.publishedAt || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    this.workspaces.push(workspace)
    this.save()
    return workspace
  }

  updateWorkspace(id, data) {
    this.refresh()

    const index = this.workspaces.findIndex(item => item.id === normalizePositiveInt(id))

    if (index === -1) {
      return null
    }

    const currentWorkspace = this.workspaces[index]
    const nextCompanyId =
      data?.companyId !== undefined
        ? resolveCompanyId(data.companyId)
        : currentWorkspace.companyId
    const nextDate = data?.date !== undefined ? normalizeDate(data.date) : currentWorkspace.date
    const duplicate = this.workspaces.find(
      item =>
        item.id !== currentWorkspace.id &&
        Number(item.companyId) === Number(nextCompanyId) &&
        item.date === nextDate,
    )

    if (duplicate) {
      throw new Error('Ja existe um draft de planeamento para essa data')
    }

    const updatedWorkspace = new PlanningWorkspace({
      ...currentWorkspace,
      ...data,
      id: currentWorkspace.id,
      companyId: nextCompanyId,
      date: nextDate,
      updatedAt: new Date().toISOString(),
    })

    this.workspaces[index] = updatedWorkspace
    this.save()
    return updatedWorkspace
  }

  getAssignments(filters = {}) {
    this.refresh()

    return this.assignments
      .filter(item => !filters.workspaceId || item.workspaceId === normalizePositiveInt(filters.workspaceId))
      .filter(item => !filters.workId || item.workId === normalizePositiveInt(filters.workId))
      .filter(item => !filters.personId || item.personId === normalizePositiveInt(filters.personId))
      .map(item => enrichPlanningWorkspaceAssignment(item, getPersonById, getWorkById))
  }

  getAssignmentById(id) {
    this.refresh()
    const assignment = this.assignments.find(item => item.id === normalizePositiveInt(id)) || null
    return assignment ? enrichPlanningWorkspaceAssignment(assignment, getPersonById, getWorkById) : null
  }

  createAssignment(data) {
    this.refresh()

    const workspaceId = normalizePositiveInt(data?.workspaceId)
    const workId = normalizePositiveInt(data?.workId)
    const personId = normalizePositiveInt(data?.personId)

    if (!workspaceId || !this.workspaces.some(item => item.id === workspaceId)) {
      throw new Error('Draft de planeamento nao encontrado')
    }

    if (!workId || !personId) {
      throw new Error('workId e personId sao obrigatorios')
    }

    const duplicate = this.assignments.find(
      item =>
        item.workspaceId === workspaceId &&
        item.workId === workId &&
        item.personId === personId,
    )

    if (duplicate) {
      throw new Error('Ja existe uma afetacao de draft para essa pessoa e obra')
    }

    const assignment = new PlanningWorkspaceAssignment({
      id: this.getNextAssignmentId(),
      workspaceId,
      workId,
      personId,
      hourlyCost: data?.hourlyCost,
      manualHourlyCost: data?.manualHourlyCost === true,
      notes: data?.notes,
      hasWorkAccess: data?.hasWorkAccess === true,
      assignmentPurpose: data?.assignmentPurpose,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    this.assignments.push(assignment)
    this.save()
    return enrichPlanningWorkspaceAssignment(assignment, getPersonById, getWorkById)
  }

  updateAssignment(id, data) {
    this.refresh()

    const index = this.assignments.findIndex(item => item.id === normalizePositiveInt(id))

    if (index === -1) {
      return null
    }

    const currentAssignment = this.assignments[index]
    const workspaceId =
      data?.workspaceId !== undefined
        ? normalizePositiveInt(data.workspaceId)
        : currentAssignment.workspaceId
    const workId = data?.workId !== undefined ? normalizePositiveInt(data.workId) : currentAssignment.workId
    const personId =
      data?.personId !== undefined ? normalizePositiveInt(data.personId) : currentAssignment.personId

    const duplicate = this.assignments.find(
      item =>
        item.id !== currentAssignment.id &&
        item.workspaceId === workspaceId &&
        item.workId === workId &&
        item.personId === personId,
    )

    if (duplicate) {
      throw new Error('Ja existe uma afetacao de draft para essa pessoa e obra')
    }

    const updatedAssignment = new PlanningWorkspaceAssignment({
      ...currentAssignment,
      ...data,
      id: currentAssignment.id,
      workspaceId,
      workId,
      personId,
      updatedAt: new Date().toISOString(),
    })

    this.assignments[index] = updatedAssignment
    this.save()
    return enrichPlanningWorkspaceAssignment(updatedAssignment, getPersonById, getWorkById)
  }

  deleteAssignment(id) {
    this.refresh()

    const index = this.assignments.findIndex(item => item.id === normalizePositiveInt(id))

    if (index === -1) {
      return false
    }

    this.assignments.splice(index, 1)
    this.save()
    return true
  }

  replaceAssignments(workspaceId, nextAssignments = []) {
    this.refresh()

    const normalizedWorkspaceId = normalizePositiveInt(workspaceId)

    this.assignments = this.assignments.filter(item => item.workspaceId !== normalizedWorkspaceId)

    nextAssignments.forEach(item => {
      this.assignments.push(
        new PlanningWorkspaceAssignment({
          id: this.getNextAssignmentId(),
          workspaceId: normalizedWorkspaceId,
          workId: item.workId,
          personId: item.personId,
          hourlyCost: item.hourlyCost,
          manualHourlyCost: item.manualHourlyCost === true,
          notes: item.notes,
          hasWorkAccess: item.hasWorkAccess === true,
          assignmentPurpose: item.assignmentPurpose,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      )
    })

    this.save()
    return this.getAssignments({ workspaceId: normalizedWorkspaceId })
  }
}

let planningWorkspacesService = null

function getLegacyPlanningWorkspacesService() {
  if (isMysqlDataSourceEnabled()) {
    return null
  }

  if (!planningWorkspacesService) {
    planningWorkspacesService = new PlanningWorkspacesService()
  }

  return planningWorkspacesService
}

async function enrichPlanningWorkspaceAssignmentsData(assignments) {
  const people = await Promise.all(assignments.map(item => getPersonByIdData(item.personId)))
  const works = await Promise.all(assignments.map(item => getWorkByIdData(item.workId)))

  return assignments.map((item, index) =>
    enrichPlanningWorkspaceAssignment(
      item,
      () => people[index],
      () => works[index],
    ),
  )
}

export function getPlanningWorkspaceById(id) {
  return getLegacyPlanningWorkspacesService()?.getWorkspaceById(id) || null
}

export function getAllPlanningWorkspaces() {
  return getLegacyPlanningWorkspacesService()?.getWorkspaces() || []
}

export function getPlanningWorkspaceByDate(date, companyId) {
  return getLegacyPlanningWorkspacesService()?.getWorkspaceByDate(date, companyId) || null
}

export function createPlanningWorkspace(data) {
  return getLegacyPlanningWorkspacesService()?.createWorkspace(data) || null
}

export function updatePlanningWorkspace(id, data) {
  return getLegacyPlanningWorkspacesService()?.updateWorkspace(id, data) || null
}

export function getPlanningWorkspaceAssignments(filters = {}) {
  return getLegacyPlanningWorkspacesService()?.getAssignments(filters) || []
}

export function getPlanningWorkspaceAssignmentById(id) {
  return getLegacyPlanningWorkspacesService()?.getAssignmentById(id) || null
}

export function createPlanningWorkspaceAssignment(data) {
  return getLegacyPlanningWorkspacesService()?.createAssignment(data) || null
}

export function updatePlanningWorkspaceAssignment(id, data) {
  return getLegacyPlanningWorkspacesService()?.updateAssignment(id, data) || null
}

export function deletePlanningWorkspaceAssignment(id) {
  return getLegacyPlanningWorkspacesService()?.deleteAssignment(id) || false
}

export function replacePlanningWorkspaceAssignments(workspaceId, nextAssignments = []) {
  return getLegacyPlanningWorkspacesService()?.replaceAssignments(workspaceId, nextAssignments) || []
}

export async function getPlanningWorkspaceByIdData(id) {
  if (!isMysqlDataSourceEnabled()) {
    return getPlanningWorkspaceById(id)
  }

  return getPlanningWorkspaceByIdDb(id)
}

export async function getAllPlanningWorkspacesData(filters = {}) {
  if (!isMysqlDataSourceEnabled()) {
    return getAllPlanningWorkspaces()
  }

  return getAllPlanningWorkspacesDb(filters)
}

export async function getPlanningWorkspaceByDateData(date, companyId) {
  if (!isMysqlDataSourceEnabled()) {
    return getPlanningWorkspaceByDate(date, companyId)
  }

  return getPlanningWorkspaceByDateDb(date, companyId)
}

export async function createPlanningWorkspaceData(data) {
  if (!isMysqlDataSourceEnabled()) {
    return createPlanningWorkspace(data)
  }

  return createPlanningWorkspaceDb(data)
}

export async function updatePlanningWorkspaceData(id, data) {
  if (!isMysqlDataSourceEnabled()) {
    return updatePlanningWorkspace(id, data)
  }

  return updatePlanningWorkspaceDb(id, data)
}

export async function getPlanningWorkspaceAssignmentsData(filters = {}) {
  if (!isMysqlDataSourceEnabled()) {
    return getPlanningWorkspaceAssignments(filters)
  }

  return enrichPlanningWorkspaceAssignmentsData(await getPlanningWorkspaceAssignmentsDb(filters))
}

export async function getPlanningWorkspaceAssignmentByIdData(id) {
  if (!isMysqlDataSourceEnabled()) {
    return getPlanningWorkspaceAssignmentById(id)
  }

  const assignment = await getPlanningWorkspaceAssignmentByIdDb(id)

  if (!assignment) {
    return null
  }

  return enrichPlanningWorkspaceAssignmentsData([assignment]).then(items => items[0] || null)
}

export async function createPlanningWorkspaceAssignmentData(data) {
  if (!isMysqlDataSourceEnabled()) {
    return createPlanningWorkspaceAssignment(data)
  }

  const assignment = await createPlanningWorkspaceAssignmentDb(data)
  return (await enrichPlanningWorkspaceAssignmentsData([assignment]))[0] || null
}

export async function updatePlanningWorkspaceAssignmentData(id, data) {
  if (!isMysqlDataSourceEnabled()) {
    return updatePlanningWorkspaceAssignment(id, data)
  }

  const assignment = await updatePlanningWorkspaceAssignmentDb(id, data)

  if (!assignment) {
    return null
  }

  return (await enrichPlanningWorkspaceAssignmentsData([assignment]))[0] || null
}

export async function deletePlanningWorkspaceAssignmentData(id) {
  if (!isMysqlDataSourceEnabled()) {
    return deletePlanningWorkspaceAssignment(id)
  }

  return deletePlanningWorkspaceAssignmentDb(id)
}

export async function replacePlanningWorkspaceAssignmentsData(workspaceId, nextAssignments = []) {
  if (!isMysqlDataSourceEnabled()) {
    return replacePlanningWorkspaceAssignments(workspaceId, nextAssignments)
  }

  await deletePlanningWorkspaceAssignmentsByWorkspaceIdDb(workspaceId)

  const createdAssignments = []

  for (const assignment of nextAssignments) {
    createdAssignments.push(
      await createPlanningWorkspaceAssignmentDb({
        workspaceId,
        workId: assignment.workId,
        personId: assignment.personId,
        hourlyCost: assignment.hourlyCost,
        manualHourlyCost: assignment.manualHourlyCost === true,
        notes: assignment.notes,
        hasWorkAccess: assignment.hasWorkAccess === true,
        assignmentPurpose: assignment.assignmentPurpose,
      }),
    )
  }

  return enrichPlanningWorkspaceAssignmentsData(createdAssignments)
}

export function resolveDraftChefAccessAssignments(assignments, workId, excludeAssignmentId = null) {
  return assignments
    .filter(
      assignment =>
        Number(assignment.workId) === Number(workId) &&
        Number(assignment.id) !== Number(excludeAssignmentId) &&
        isChefRole(assignment.person?.role),
    )
    .sort((left, right) => Number(left.id) - Number(right.id))
}
