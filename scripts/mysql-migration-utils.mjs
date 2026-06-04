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

export async function buildMysqlMigrationSnapshot() {
  const companies = await readJsonArray('companies.json')
  const clients = await readJsonArray('clients.json')
  const works = await readJsonArray('works.json')
  const people = await readJsonArray('people.json')
  const workPlans = await readJsonArray('work-plans.json')
  const workAssignments = await readJsonArray('work-assignments.json')
  const dailyWorkNotes = await readJsonArray('daily-work-notes.json')
  const accessIdentities = await readJsonArray('access-identities.json')
  const admins = await readJsonArray('admins.json')
  const developers = await readJsonArray('developers.json')
  const loginEvents = await readJsonArray('login-events.json')

  const peopleById = new Map(
    people
      .map(person => normalizePerson(person))
      .filter(Boolean)
      .map(person => [person.id, person]),
  )

  const users = buildUsers({ accessIdentities, admins, developers, peopleById, loginEvents })
  const usersByUsername = new Map(users.map(user => [user.username.toLowerCase(), user]))
  const usersByPersonId = new Map(users.filter(user => user.personId).map(user => [user.personId, user]))

  const target = {
    companies: companies.map(normalizeCompany).filter(Boolean),
    clients: clients.map(normalizeClient).filter(Boolean),
    people: Array.from(peopleById.values()),
    works: works.map(normalizeWork).filter(Boolean),
    workWorkingDays: buildWorkWorkingDays(works),
    workRoleHourlyCosts: buildWorkRoleHourlyCosts(works),
    workPersonHourlyCosts: buildWorkPersonHourlyCosts(works, peopleById),
    workPlans: workPlans.map(normalizeWorkPlan).filter(Boolean),
    users,
    workAssignments: buildWorkAssignments(workAssignments, usersByUsername, usersByPersonId, peopleById),
    dailyWorkNotes: dailyWorkNotes.map(note => normalizeDailyWorkNote(note, peopleById)).filter(Boolean),
    loginEvents: buildLoginEvents(loginEvents, usersByUsername, usersByPersonId, peopleById),
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
      dailyWorkNotes: dailyWorkNotes.length,
      accessIdentities: accessIdentities.length,
      admins: admins.length,
      developers: developers.length,
      loginEvents: loginEvents.length,
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
