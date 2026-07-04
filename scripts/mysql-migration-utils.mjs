import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectRoot = join(__dirname, '..')
const dataDir = join(projectRoot, 'data')
const exportsDir = join(dataDir, 'exports')
export const snapshotFilePath = join(exportsDir, 'mysql-migration-snapshot.json')

const ROLE_VALUES = new Set([
  'admin',
  'developer',
  'responsavel',
  'chef_primeira',
  'chef_segunda',
  'carpinteiro',
  'ferrajeiro',
  'trolha',
  'gruista',
])

const ACCOUNT_TYPE_VALUES = new Set(['operational', 'admin', 'developer'])
const WORK_STATUS_VALUES = new Set(['planned', 'in_progress', 'paused', 'completed'])
const WORKING_DAY_VALUES = new Set([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])
const MATERIAL_UNIT_VALUES = new Set(['un', 'cx', 'kg', 'l', 'm', 'm2', 'm3'])
const DOCUMENT_WARNING_DAY_VALUES = new Set([30, 15, 7, 1, 0])
const CALENDAR_EVENT_COLOR_VALUES = new Set(['#16a34a', '#2563eb', '#dc2626', '#111111'])
const CALENDAR_EVENT_TYPE_VALUES = new Set(['viagem'])
const CALENDAR_TRAVEL_TRANSPORT_VALUES = new Set(['comboio', 'aviao'])
const CALENDAR_TRAVEL_AIRPORT_VALUES = new Set(['zaventem', 'charleroi', 'bruxelles-midi', 'outro'])
const PLANNING_PUBLICATION_STATE_VALUES = new Set(['draft', 'published'])

export async function buildMysqlMigrationSnapshot() {
  const companies = await readJsonArray('companies.json')
  const clients = await readJsonArray('clients.json')
  const works = await readJsonArray('works.json')
  const people = await readJsonArray('people.json')
  const workPlans = await readJsonArray('work-plans.json')
  const workAssignments = await readJsonArray('work-assignments.json')
  const planningWorkspaces = await readJsonArray('planning-workspaces.json')
  const planningWorkspaceAssignments = await readJsonArray('planning-workspace-assignments.json')
  const dailyWorkNotes = await readJsonArray('daily-work-notes.json')
  const accessIdentities = await readJsonArray('access-identities.json')
  const admins = await readJsonArray('admins.json')
  const developers = await readJsonArray('developers.json')
  const loginEvents = await readJsonArray('login-events.json')
  const loginAttempts = await readJsonArray('login-attempts.json')
  const auditTrailEvents = await readJsonArray('.audit-trail.json')
  const materials = await readJsonArray('materials.json')
  const personDocumentReminders = await readJsonArray('person-document-reminders.json')
  const calendarEvents = await readJsonArray('calendar-events.json')
  const calendarNotificationStates = await readJsonArray('calendar-notification-state.json')
  const featureFlags = await readJsonObject('feature-flags.json')

  const peopleById = new Map(
    people
      .map(person => normalizePerson(person))
      .filter(Boolean)
      .map(person => [person.id, person]),
  )

  const users = buildUsers({ accessIdentities, admins, developers, peopleById, loginEvents })
  const usersByUsername = new Map(users.map(user => [user.username.toLowerCase(), user]))
  const usersByPersonId = new Map(users.filter(user => user.personId).map(user => [user.personId, user]))
  const worksById = new Map(
    works
      .map(normalizeWork)
      .filter(Boolean)
      .map(work => [work.id, work]),
  )
  const workPlansById = new Map(
    workPlans
      .map(normalizeWorkPlan)
      .filter(Boolean)
      .map(workPlan => [workPlan.id, workPlan]),
  )
  const planningWorkspacesTarget = planningWorkspaces
    .map(workspace => normalizePlanningWorkspace(workspace, workPlansById))
    .filter(Boolean)
  const planningWorkspacesById = new Map(planningWorkspacesTarget.map(workspace => [workspace.id, workspace]))

  const target = {
    companies: companies.map(normalizeCompany).filter(Boolean),
    clients: clients.map(normalizeClient).filter(Boolean),
    people: Array.from(peopleById.values()),
    works: Array.from(worksById.values()),
    workWorkingDays: buildWorkWorkingDays(works),
    workRoleHourlyCosts: buildWorkRoleHourlyCosts(works),
    workPersonHourlyCosts: buildWorkPersonHourlyCosts(works, peopleById),
    workPlans: Array.from(workPlansById.values()),
    planningWorkspaces: planningWorkspacesTarget,
    users,
    workAssignments: buildWorkAssignments(workAssignments, usersByUsername, usersByPersonId, peopleById),
    planningWorkspaceAssignments: buildPlanningWorkspaceAssignments(
      planningWorkspaceAssignments,
      planningWorkspacesById,
      worksById,
      peopleById,
    ),
    dailyWorkNotes: dailyWorkNotes.map(note => normalizeDailyWorkNote(note, peopleById)).filter(Boolean),
    loginEvents: buildLoginEvents(loginEvents, usersByUsername, usersByPersonId, peopleById),
    loginAttempts: loginAttempts.map(normalizeLoginAttempt).filter(Boolean),
    auditTrailEvents: auditTrailEvents
      .map((event, index) => normalizeAuditTrailEvent(event, index))
      .filter(Boolean),
    materials: materials.map((material, index) => normalizeMaterial(material, index + 1)).filter(Boolean),
    personDocumentReminders: personDocumentReminders
      .map((reminder, index) => normalizePersonDocumentReminder(reminder, index + 1))
      .filter(Boolean),
    calendarEvents: calendarEvents
      .map((event, index) => normalizeCalendarEvent(event, index + 1))
      .filter(Boolean),
    calendarNotificationStates: calendarNotificationStates
      .map(item => normalizeCalendarNotificationState(item))
      .filter(Boolean),
    featureFlags: normalizeFeatureFlags(featureFlags),
  }

  return {
    generatedAt: new Date().toISOString(),
    sourceCounts: {
      companies: companies.length,
      clients: clients.length,
      works: works.length,
      people: people.length,
      workPlans: workPlans.length,
      workAssignments: workAssignments.length,
      planningWorkspaces: planningWorkspaces.length,
      planningWorkspaceAssignments: planningWorkspaceAssignments.length,
      dailyWorkNotes: dailyWorkNotes.length,
      accessIdentities: accessIdentities.length,
      admins: admins.length,
      developers: developers.length,
      loginEvents: loginEvents.length,
      loginAttempts: loginAttempts.length,
      auditTrailEvents: auditTrailEvents.length,
      materials: materials.length,
      personDocumentReminders: personDocumentReminders.length,
      calendarEvents: calendarEvents.length,
      calendarNotificationStates: calendarNotificationStates.length,
      featureFlags: Object.keys(featureFlags).length,
    },
    targetCounts: Object.fromEntries(
      Object.entries(target).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0]),
    ),
    target,
  }
}

export async function writeMysqlMigrationSnapshot(snapshot) {
  await mkdir(exportsDir, { recursive: true })
  await writeFile(snapshotFilePath, JSON.stringify(snapshot, null, 2), 'utf8')
  return snapshotFilePath
}

export async function readMysqlMigrationSnapshot() {
  const rawValue = await readFile(snapshotFilePath, 'utf8')
  return JSON.parse(rawValue)
}

async function readJsonArray(fileName) {
  const filePath = join(dataDir, fileName)

  try {
    const rawValue = await readFile(filePath, 'utf8')
    const parsedValue = JSON.parse(rawValue)
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch (error) {
    return []
  }
}

function normalizePositiveInt(value) {
  const parsedValue = Number.parseInt(value, 10)
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
}

function normalizeDecimal(value, fallback = 0) {
  const parsedValue = Number.parseFloat(value)
  return Number.isFinite(parsedValue) ? Number(parsedValue.toFixed(2)) : fallback
}

function normalizeOptionalDecimal(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const parsedValue = Number.parseFloat(value)
  return Number.isFinite(parsedValue) ? Number(parsedValue.toFixed(2)) : null
}

function normalizeDate(value) {
  if (!value) {
    return null
  }

  const candidate = String(value).trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null
}

function normalizeDateTime(value, fallback = null) {
  if (!value) {
    return fallback
  }

  const candidate = new Date(value)
  return Number.isNaN(candidate.getTime()) ? fallback : candidate.toISOString()
}

function normalizeOptionalText(value) {
  const normalizedValue = String(value || '').trim()
  return normalizedValue || null
}

function normalizeMaterialUnit(value) {
  const normalizedValue = String(value || '').trim().toLowerCase() || 'un'
  return MATERIAL_UNIT_VALUES.has(normalizedValue) ? normalizedValue : 'un'
}

function normalizeDocumentWarningDays(value) {
  const normalizedValue = Number.parseInt(value, 10)
  return DOCUMENT_WARNING_DAY_VALUES.has(normalizedValue) ? normalizedValue : 30
}

function normalizeCalendarEventColor(value) {
  const normalizedValue = String(value || '#2563eb').trim().toLowerCase()
  return CALENDAR_EVENT_COLOR_VALUES.has(normalizedValue) ? normalizedValue : '#2563eb'
}

function normalizeCalendarEventType(value) {
  const normalizedValue = String(value || 'viagem').trim().toLowerCase()
  return CALENDAR_EVENT_TYPE_VALUES.has(normalizedValue) ? normalizedValue : 'viagem'
}

function normalizeCalendarTravelTransport(value) {
  const normalizedValue = String(value || 'aviao').trim().toLowerCase()
  return CALENDAR_TRAVEL_TRANSPORT_VALUES.has(normalizedValue) ? normalizedValue : 'aviao'
}

function normalizeCalendarTravelAirport(value) {
  const normalizedValue = String(value || 'charleroi').trim().toLowerCase()
  return CALENDAR_TRAVEL_AIRPORT_VALUES.has(normalizedValue) ? normalizedValue : 'charleroi'
}

function normalizeOptionalTime(value) {
  const normalizedValue = String(value || '').trim()
  return normalizedValue ? normalizedValue.slice(0, 8) : null
}

function normalizeRole(value, fallback = null) {
  const normalizedValue = String(value || '').trim().toLowerCase()
  return ROLE_VALUES.has(normalizedValue) ? normalizedValue : fallback
}

function normalizeAccountType(value, fallback = 'operational') {
  const normalizedValue = String(value || '').trim().toLowerCase()
  return ACCOUNT_TYPE_VALUES.has(normalizedValue) ? normalizedValue : fallback
}

function normalizeCompany(company) {
  const id = normalizePositiveInt(company?.id)
  const name = String(company?.name || '').trim()
  const slug = String(company?.slug || '').trim()

  if (!id || !name || !slug) {
    return null
  }

  return {
    id,
    holdingId: normalizePositiveInt(company?.holdingId) || 1,
    name,
    slug,
    countryCode: String(company?.countryCode || 'PT').trim().toUpperCase().slice(0, 2) || 'PT',
    documentMark: String(company?.documentMark || '').trim() || null,
    documentLabel: String(company?.documentLabel || '').trim() || name,
    documentLogoUrl: String(company?.documentLogoUrl || '').trim() || null,
    active: company?.active !== false,
  }
}

function normalizeClient(client) {
  const id = normalizePositiveInt(client?.id)
  const companyId = normalizePositiveInt(client?.companyId)
  const name = String(client?.name || '').trim()

  if (!id || !companyId || !name) {
    return null
  }

  return {
    id,
    companyId,
    name,
    vatNumber: String(client?.vatNumber || '').trim() || null,
    contactName: String(client?.contactName || '').trim() || null,
    email: String(client?.email || '').trim() || null,
    phone: String(client?.phone || '').trim() || null,
    notes: String(client?.notes || '').trim() || null,
  }
}

function normalizePerson(person) {
  const id = normalizePositiveInt(person?.id)
  const companyId = normalizePositiveInt(person?.companyId)
  const name = String(person?.name || '').trim()
  const role = normalizeRole(person?.role)

  if (!id || !companyId || !name || !role) {
    return null
  }

  return {
    id,
    companyId,
    name,
    price: normalizeDecimal(person?.price),
    monthlyPrice: normalizeDecimal(person?.monthlyPrice),
    isMonthlyBilling: person?.isMonthlyBilling === true,
    role,
  }
}

function normalizeWork(work) {
  const id = normalizePositiveInt(work?.id)
  const companyId = normalizePositiveInt(work?.companyId)
  const clientId = normalizePositiveInt(work?.clientId)
  const number = normalizePositiveInt(work?.number)
  const name = String(work?.name || '').trim()
  const status = WORK_STATUS_VALUES.has(String(work?.status || '').trim()) ? String(work.status).trim() : 'planned'

  if (!id || !companyId || !clientId || !number || !name) {
    return null
  }

  return {
    id,
    companyId,
    clientId,
    number,
    name,
    location: String(work?.location || '').trim() || null,
    status,
    budget: normalizeDecimal(work?.budget),
    defaultHourlyCost: normalizeDecimal(work?.defaultHourlyCost),
    startDate: normalizeDate(work?.startDate),
    endDate: normalizeDate(work?.endDate),
    notes: String(work?.notes || '').trim() || null,
  }
}

function normalizeWorkPlan(workPlan) {
  const id = normalizePositiveInt(workPlan?.id)
  const companyId = normalizePositiveInt(workPlan?.companyId)
  const date = normalizeDate(workPlan?.date)

  if (!id || !companyId || !date) {
    return null
  }

  return {
    id,
    companyId,
    date,
  }
}

function normalizePlanningPublicationState(value) {
  const normalizedValue = String(value || '').trim().toLowerCase()
  return PLANNING_PUBLICATION_STATE_VALUES.has(normalizedValue) ? normalizedValue : 'draft'
}

function normalizePlanningWorkspace(workspace, workPlansById) {
  const id = normalizePositiveInt(workspace?.id)
  const companyId = normalizePositiveInt(workspace?.companyId)
  const date = normalizeDate(workspace?.date)
  const publishedWorkPlanId = normalizePositiveInt(workspace?.publishedWorkPlanId)

  if (!id || !companyId || !date) {
    return null
  }

  if (publishedWorkPlanId && !workPlansById.has(publishedWorkPlanId)) {
    return null
  }

  return {
    id,
    companyId,
    date,
    state: normalizePlanningPublicationState(workspace?.state),
    publishedWorkPlanId: publishedWorkPlanId || null,
    publishedAt: normalizeDateTime(workspace?.publishedAt),
    createdAt: normalizeDateTime(workspace?.createdAt, new Date().toISOString()),
    updatedAt: normalizeDateTime(workspace?.updatedAt, workspace?.createdAt || new Date().toISOString()),
  }
}

function normalizeDailyWorkNote(note, peopleById) {
  const id = normalizePositiveInt(note?.id)
  const date = normalizeDate(note?.date)
  const workId = normalizePositiveInt(note?.workId)

  if (!id || !date || !workId) {
    return null
  }

  const authorId = normalizePositiveInt(note?.authorId)
  const author = authorId ? peopleById.get(authorId) : null

  return {
    id,
    date,
    workId,
    authorId,
    authorName: String(note?.authorName || author?.name || '').trim() || null,
    note: String(note?.note || '').trim(),
    updatedAt: normalizeDateTime(note?.updatedAt, new Date().toISOString()),
  }
}

async function readJsonObject(fileName) {
  const filePath = join(dataDir, fileName)

  try {
    const rawValue = await readFile(filePath, 'utf8')
    const parsedValue = JSON.parse(rawValue)
    return parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue) ? parsedValue : {}
  } catch (error) {
    return {}
  }
}

function normalizeMaterial(material, fallbackId = null) {
  const id = normalizePositiveInt(material?.id) || fallbackId
  const name = String(material?.name || '').trim()

  if (!id || !name) {
    return null
  }

  return {
    id,
    name,
    reference: normalizeOptionalText(material?.reference),
    category: normalizeOptionalText(material?.category),
    unit: normalizeMaterialUnit(material?.unit),
    quantity: normalizeDecimal(material?.quantity),
    minimumQuantity: normalizeDecimal(material?.minimumQuantity),
    location: normalizeOptionalText(material?.location),
    supplier: normalizeOptionalText(material?.supplier),
    notes: normalizeOptionalText(material?.notes),
    createdAt: normalizeDateTime(material?.createdAt, new Date().toISOString()),
    updatedAt: normalizeDateTime(material?.updatedAt, material?.createdAt || new Date().toISOString()),
  }
}

function normalizePersonDocumentReminder(reminder, fallbackId = null) {
  const id = normalizePositiveInt(reminder?.id) || fallbackId
  const personId = normalizePositiveInt(reminder?.personId)
  const name = String(reminder?.name || '').trim()
  const expirationDate = normalizeDate(reminder?.expirationDate)

  if (!id || !personId || !name || !expirationDate) {
    return null
  }

  return {
    id,
    personId,
    name,
    expirationDate,
    warningDays: normalizeDocumentWarningDays(reminder?.warningDays),
    notes: normalizeOptionalText(reminder?.notes),
    createdAt: normalizeDateTime(reminder?.createdAt, new Date().toISOString()),
    updatedAt: normalizeDateTime(reminder?.updatedAt, reminder?.createdAt || new Date().toISOString()),
  }
}

function normalizeCalendarEvent(event, fallbackId = null) {
  const id = normalizePositiveInt(event?.id) || fallbackId
  const date = normalizeDate(event?.date)
  const title = String(event?.title || '').trim()

  if (!id || !date || !title) {
    return null
  }

  const createdAtFallback = new Date().toISOString()

  return {
    id,
    date,
    title,
    type: normalizeCalendarEventType(event?.type),
    transport: normalizeCalendarTravelTransport(event?.transport),
    airport: normalizeCalendarTravelAirport(event?.airport),
    destination: normalizeOptionalText(event?.destination),
    departureDate: normalizeDate(event?.departureDate || event?.date),
    arrivalDate: normalizeDate(event?.arrivalDate),
    departureTime: normalizeOptionalTime(event?.departureTime),
    arrivalTime: normalizeOptionalTime(event?.arrivalTime),
    outboundFlightReference: normalizeOptionalText(event?.outboundFlightReference),
    returnFlightReference: normalizeOptionalText(event?.returnFlightReference),
    color: normalizeCalendarEventColor(event?.color),
    createdBy: normalizeOptionalText(event?.createdBy),
    createdAt: normalizeDateTime(event?.createdAt, createdAtFallback),
    updatedAt: normalizeDateTime(event?.updatedAt, event?.createdAt || createdAtFallback),
  }
}

function normalizeCalendarNotificationState(item) {
  const username = String(item?.username || '').trim().toLowerCase()

  if (!username) {
    return null
  }

  return {
    username,
    seenAt: normalizeDateTime(item?.seenAt, new Date().toISOString()),
  }
}

function normalizeFeatureFlags(flags) {
  if (!flags || typeof flags !== 'object' || Array.isArray(flags)) {
    return []
  }

  return Object.entries(flags)
    .map(([key, enabled]) => ({
      key: String(key || '').trim(),
      enabled: enabled === true,
    }))
    .filter(flag => flag.key)
    .sort((left, right) => left.key.localeCompare(right.key))
}

function normalizeLoginAttempt(record) {
  const username = String(record?.username || '').trim().toLowerCase()

  if (!username) {
    return null
  }

  return {
    username,
    failedAt: Array.isArray(record?.failedAt)
      ? record.failedAt.map(value => normalizeDateTime(value)).filter(Boolean)
      : [],
    blockedUntil: normalizeDateTime(record?.blockedUntil),
  }
}

function normalizeAuditTrailEvent(event, fallbackIndex = 0) {
  const timestamp = normalizeDateTime(event?.timestamp)
  const action = String(event?.action || '').trim()
  const entity = String(event?.entity || '').trim()

  if (!timestamp || !action || !entity) {
    return null
  }

  return {
    id: String(event?.id || `${Date.now()}-${fallbackIndex}`).trim(),
    timestamp,
    username: String(event?.username || 'system').trim() || 'system',
    action,
    entity,
    entityId: normalizePositiveInt(event?.entityId),
    details:
      event?.details && typeof event.details === 'object' && !Array.isArray(event.details)
        ? JSON.parse(JSON.stringify(event.details))
        : {},
    result: String(event?.result || 'success').trim() || 'success',
    errorMessage: normalizeOptionalText(event?.errorMessage),
  }
}

function buildWorkWorkingDays(works) {
  const entries = []

  works.forEach(work => {
    const workId = normalizePositiveInt(work?.id)
    const workingDays = Array.isArray(work?.workingDays) ? work.workingDays : []

    Array.from(
      new Set(
        workingDays
          .map(day => String(day || '').trim().toLowerCase())
          .filter(day => WORKING_DAY_VALUES.has(day)),
      ),
    ).forEach(day => {
      entries.push({
        workId,
        day,
      })
    })
  })

  return entries.filter(entry => entry.workId && entry.day)
}

function buildWorkRoleHourlyCosts(works) {
  const entries = []

  works.forEach(work => {
    const workId = normalizePositiveInt(work?.id)
    const roleHourlyCosts = work?.roleHourlyCosts && typeof work.roleHourlyCosts === 'object'
      ? Object.entries(work.roleHourlyCosts)
      : []

    roleHourlyCosts.forEach(([role, hourlyCost]) => {
      const normalizedRole = normalizeRole(role)

      if (!workId || !normalizedRole) {
        return
      }

      entries.push({
        workId,
        role: normalizedRole,
        hourlyCost: normalizeDecimal(hourlyCost),
      })
    })
  })

  return entries
}

function buildWorkPersonHourlyCosts(works, peopleById) {
  const entries = []

  works.forEach(work => {
    const workId = normalizePositiveInt(work?.id)
    const companyId = normalizePositiveInt(work?.companyId)
    const personCosts = work?.specialPersonHourlyCosts && typeof work.specialPersonHourlyCosts === 'object'
      ? Object.entries(work.specialPersonHourlyCosts)
      : []

    personCosts.forEach(([personId, hourlyCost]) => {
      const normalizedPersonId = normalizePositiveInt(personId)
      const person = normalizedPersonId ? peopleById.get(normalizedPersonId) : null

      if (!workId || !person || Number(person.companyId) !== Number(companyId)) {
        return
      }

      entries.push({
        workId,
        personId: normalizedPersonId,
        hourlyCost: normalizeDecimal(hourlyCost),
      })
    })
  })

  return entries
}

function buildUsers({ accessIdentities, admins, developers, peopleById, loginEvents }) {
  let nextUserId = 1
  const users = []
  const usernames = new Set()
  const lastLoginByUsername = new Map()

  loginEvents.forEach(event => {
    const username = String(event?.username || '').trim().toLowerCase()
    const loginAt = normalizeDateTime(event?.loginAt)

    if (!username || !loginAt) {
      return
    }

    const currentValue = lastLoginByUsername.get(username)
    if (!currentValue || currentValue < loginAt) {
      lastLoginByUsername.set(username, loginAt)
    }
  })

  const addUser = (record) => {
    const username = String(record?.username || '').trim()
    const normalizedUsername = username.toLowerCase()

    if (!username || usernames.has(normalizedUsername)) {
      return null
    }

    const user = {
      id: nextUserId++,
      personId: normalizePositiveInt(record?.personId),
      username,
      passwordHash: String(record?.passwordHash || '').trim(),
      role: normalizeRole(record?.role),
      accountType: normalizeAccountType(record?.accountType),
      name: String(record?.name || '').trim() || null,
      active: record?.active !== false,
      deactivatedAt: normalizeDateTime(record?.deactivatedAt),
      deletedAt: normalizeDateTime(record?.deletedAt),
      lastLoginAt: lastLoginByUsername.get(normalizedUsername) || null,
      legacySource: String(record?.legacySource || '').trim() || null,
      legacySourceId: normalizePositiveInt(record?.legacySourceId),
    }

    users.push(user)
    usernames.add(normalizedUsername)
    return user
  }

  accessIdentities.forEach(identity => {
    const personId = normalizePositiveInt(identity?.personId)
    const person = personId ? peopleById.get(personId) : null
    const role = normalizeRole(person?.role || identity?.role)
    const accountType = role === 'developer' ? 'developer' : role === 'admin' ? 'admin' : 'operational'

    addUser({
      personId,
      username: identity?.username,
      passwordHash: identity?.password,
      role,
      accountType,
      name: person?.name || identity?.username,
      legacySource: 'access_identity',
      legacySourceId: identity?.id,
    })
  })

  admins.forEach(admin => {
    addUser({
      personId: null,
      username: admin?.username,
      passwordHash: admin?.password,
      role: 'admin',
      accountType: 'admin',
      name: admin?.name || admin?.username,
      legacySource: 'admin',
      legacySourceId: admin?.id,
    })
  })

  developers.forEach(developer => {
    addUser({
      personId: null,
      username: developer?.username,
      passwordHash: developer?.password,
      role: 'developer',
      accountType: 'developer',
      name: developer?.name || developer?.username,
      legacySource: 'developer',
      legacySourceId: developer?.id,
    })
  })

  return users
}

function buildWorkAssignments(assignments, usersByUsername, usersByPersonId, peopleById) {
  return assignments
    .map(assignment => {
      const id = normalizePositiveInt(assignment?.id)
      const workPlanId = normalizePositiveInt(assignment?.workPlanId)
      const workId = normalizePositiveInt(assignment?.workId)
      const personId = normalizePositiveInt(assignment?.personId)

      if (!id || !workPlanId || !workId || !personId) {
        return null
      }

      const submittedAudit = resolveAuditIdentity(assignment?.submittedBy, usersByUsername, usersByPersonId, peopleById)
      const approvedAudit = resolveAuditIdentity(assignment?.adminApprovedBy, usersByUsername, usersByPersonId, peopleById)

      return {
        id,
        workPlanId,
        workId,
        personId,
        hours: normalizeDecimal(assignment?.hours),
        dailyHours: normalizeDecimal(
          assignment?.dailyHours !== undefined ? assignment.dailyHours : assignment?.hours,
        ),
        approvedHours: normalizeOptionalDecimal(assignment?.approvedHours),
        adminApprovedAt: normalizeDateTime(assignment?.adminApprovedAt),
        adminApprovedByUserId: approvedAudit.userId,
        adminApprovedByName: approvedAudit.name,
        submitted: assignment?.submitted === true,
        submittedAt: normalizeDateTime(assignment?.submittedAt),
        submittedByUserId: submittedAudit.userId,
        submittedByName: submittedAudit.name,
        hourlyCost: normalizeDecimal(assignment?.hourlyCost),
        manualHourlyCost: assignment?.manualHourlyCost === true,
        notes: String(assignment?.notes || '').trim() || null,
        hasWorkAccess: assignment?.hasWorkAccess === true,
        planningVisible: assignment?.planningVisible !== false,
      }
    })
    .filter(Boolean)
}

function buildPlanningWorkspaceAssignments(assignments, planningWorkspacesById, worksById, peopleById) {
  return assignments
    .map(assignment => {
      const id = normalizePositiveInt(assignment?.id)
      const workspaceId = normalizePositiveInt(assignment?.workspaceId)
      const workId = normalizePositiveInt(assignment?.workId)
      const personId = normalizePositiveInt(assignment?.personId)
      const workspace = workspaceId ? planningWorkspacesById.get(workspaceId) : null
      const work = workId ? worksById.get(workId) : null
      const person = personId ? peopleById.get(personId) : null

      if (!id || !workspace || !work || !person) {
        return null
      }

      return {
        id,
        workspaceId,
        workId,
        personId,
        hourlyCost: normalizeDecimal(assignment?.hourlyCost),
        manualHourlyCost: assignment?.manualHourlyCost === true,
        notes: normalizeOptionalText(assignment?.notes),
        hasWorkAccess: assignment?.hasWorkAccess === true,
        createdAt: normalizeDateTime(assignment?.createdAt, new Date().toISOString()),
        updatedAt: normalizeDateTime(assignment?.updatedAt, assignment?.createdAt || new Date().toISOString()),
      }
    })
    .filter(Boolean)
}

function buildLoginEvents(events, usersByUsername, usersByPersonId, peopleById) {
  return events
    .map(event => {
      const id = normalizePositiveInt(event?.id)
      const username = String(event?.username || '').trim()
      const loginAt = normalizeDateTime(event?.loginAt)

      if (!id || !username || !loginAt) {
        return null
      }

      const user = usersByUsername.get(username.toLowerCase()) || null
      const person = user?.personId ? peopleById.get(user.personId) : null
      const fallbackRole = normalizeRole(event?.role)

      return {
        id,
        userId: user?.id || null,
        personId: user?.personId || null,
        username,
        name: String(event?.name || user?.name || person?.name || '').trim() || null,
        role: normalizeRole(person?.role || user?.role || fallbackRole),
        accountType: normalizeAccountType(event?.accountType, user?.accountType || 'operational'),
        loginAt,
        userAgent: String(event?.userAgent || '').trim() || null,
      }
    })
    .filter(Boolean)
}

function resolveAuditIdentity(value, usersByUsername, usersByPersonId, peopleById) {
  if (value === undefined || value === null || value === '') {
    return {
      userId: null,
      name: null,
    }
  }

  const numericValue = normalizePositiveInt(value)

  if (numericValue) {
    const user = usersByPersonId.get(numericValue)

    if (user) {
      return {
        userId: user.id,
        name: user.name || user.username,
      }
    }

    const person = peopleById.get(numericValue)

    if (person) {
      return {
        userId: null,
        name: person.name,
      }
    }
  }

  const textValue = String(value).trim()
  const user = usersByUsername.get(textValue.toLowerCase())

  if (user) {
    return {
      userId: user.id,
      name: user.name || user.username,
    }
  }

  return {
    userId: null,
    name: textValue || null,
  }
}
