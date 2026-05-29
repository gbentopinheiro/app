import { getAllAccessIdentities } from './access-identities.js'
import { getAllAdmins } from './admins.js'
import { getAllClients } from './clients.js'
import { getAllDailyWorkNotes } from './daily-work-notes.js'
import { getAllDevelopers } from './developers.js'
import { getAllLoginEvents } from './login-audit.js'
import { getAllPeople } from './people.js'
import { ROLE_RESPONSAVEL, getRoleLabel, isChefRole, isWorkerRole } from './roles.js'
import { getAllWorkAssignments } from './work-assignments.js'
import { getAllWorkPlans } from './work-plans.js'
import { WorkStatus, getAllWorks } from './works.js'

const STATUS_LABELS = {
  [WorkStatus.PLANNED]: 'Planeadas',
  [WorkStatus.IN_PROGRESS]: 'Em curso',
  [WorkStatus.PAUSED]: 'Pausadas',
  [WorkStatus.COMPLETED]: 'Concluídas',
}

const ISSUE_SEVERITY_ORDER = {
  high: 0,
  medium: 1,
  low: 2,
}

const ACCOUNT_TYPE_LABELS = {
  admin: 'Admin',
  developer: 'Programador',
  operational: 'Operacional',
}

function buildRecentEvents(assignments, notes) {
  const assignmentEvents = assignments
    .filter(assignment => assignment.submitted && assignment.submittedAt)
    .map(assignment => ({
      id: `assignment-${assignment.id}`,
      date: assignment.submittedAt,
      type: 'Submissão de horas',
      actor: assignment.submittedBy || 'Chef',
      text: `${assignment.person?.name || 'Pessoa'} - ${assignment.work?.name || `Obra ${assignment.workId}`} - ${assignment.hours}h`,
    }))

  const noteEvents = notes
    .filter(note => note.note)
    .map(note => ({
      id: `note-${note.id}`,
      date: note.updatedAt,
      type: 'Nota diária',
      actor: note.authorName || 'Chef',
      text: `${note.work?.name || `Obra ${note.workId}`} - ${note.note}`,
    }))

  return [...assignmentEvents, ...noteEvents]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 8)
}

function getCutoffDate(days) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return cutoff
}

function isSameOrAfter(value, cutoff) {
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() >= cutoff.getTime()
}

function buildLoginSummary(loginEvents) {
  const cutoff7Days = getCutoffDate(7)
  const cutoff30Days = getCutoffDate(30)
  const loginsLast7Days = loginEvents.filter(event => isSameOrAfter(event.loginAt, cutoff7Days))
  const loginsLast30Days = loginEvents.filter(event => isSameOrAfter(event.loginAt, cutoff30Days))
  const activeUsersLast30Days = new Set(loginsLast30Days.map(event => event.username.toLowerCase())).size
  const recentLogins = loginEvents.slice(0, 20).map(event => ({
    ...event,
    roleLabel: getRoleLabel(event.role),
    accountTypeLabel: ACCOUNT_TYPE_LABELS[event.accountType] || event.accountType || 'Conta',
  }))

  return {
    totalLogins: loginEvents.length,
    loginsLast7Days: loginsLast7Days.length,
    loginsLast30Days: loginsLast30Days.length,
    activeUsersLast30Days,
    latestLoginAt: recentLogins[0]?.loginAt || null,
    recentLogins,
  }
}

function collectDuplicateUsernames(admins, developers, identities) {
  const registry = new Map()

  for (const source of [
    { label: 'admin', items: admins },
    { label: 'developer', items: developers },
    { label: 'identity', items: identities },
  ]) {
    for (const item of source.items) {
      const username = String(item.username || '').trim().toLowerCase()

      if (!username) {
        continue
      }

      const bucket = registry.get(username) || []
      bucket.push(source.label)
      registry.set(username, bucket)
    }
  }

  return Array.from(registry.entries())
    .filter(([, sources]) => new Set(sources).size > 1)
    .map(([username, sources]) => ({
      username,
      sources: Array.from(new Set(sources)),
    }))
}

function buildPreview(values, pickLabel) {
  const sample = values.slice(0, 3).map(pickLabel).filter(Boolean)

  if (sample.length === 0) {
    return ''
  }

  const remaining = values.length - sample.length
  return remaining > 0 ? `${sample.join(', ')} +${remaining}` : sample.join(', ')
}

function buildIssues({ people, identities, assignments, notes, duplicates }) {
  const identityByPersonId = new Set(
    identities
      .map(identity => parseInt(identity.personId))
      .filter(personId => Number.isInteger(personId) && personId > 0),
  )

  const brokenIdentities = identities.filter(
    identity =>
      identity.person?.missing ||
      (identity.person?.role && identity.person.role !== identity.role) ||
      identity.works.some(work => work.missing),
  )

  const missingManagerCredentials = people.filter(
    person => (person.role === ROLE_RESPONSAVEL || isChefRole(person.role)) && !identityByPersonId.has(person.id),
  )

  const chefIdentitiesWithoutWorks = identities.filter(identity => isChefRole(identity.role) && identity.works.length === 0)
  const assignmentsWithoutCost = assignments.filter(
    assignment => Number(assignment.hours) > 0 && Number(assignment.hourlyCost) <= 0,
  )
  const notesWithoutWork = notes.filter(note => !note.work)

  const issues = []

  if (brokenIdentities.length > 0) {
    issues.push({
      severity: 'high',
      title: 'Acessos com ligações inválidas',
      description: `${brokenIdentities.length} acessos apontam para pessoas, roles ou obras inconsistentes. ${buildPreview(brokenIdentities, identity => identity.username)}`,
    })
  }

  if (duplicates.length > 0) {
    issues.push({
      severity: 'high',
      title: 'Usernames repetidos entre perfis',
      description: `${duplicates.length} usernames existem em mais do que um tipo de conta. ${buildPreview(duplicates, duplicate => duplicate.username)}`,
    })
  }

  if (missingManagerCredentials.length > 0) {
    issues.push({
      severity: 'medium',
      title: 'Chefes ou responsáveis sem login',
      description: `${missingManagerCredentials.length} pessoas com acesso à app ainda não têm credenciais operacionais. ${buildPreview(missingManagerCredentials, person => person.name)}`,
    })
  }

  if (chefIdentitiesWithoutWorks.length > 0) {
    issues.push({
      severity: 'medium',
      title: 'Chefes sem obras associadas',
      description: `${chefIdentitiesWithoutWorks.length} contas de chef não têm obras atribuídas. ${buildPreview(chefIdentitiesWithoutWorks, identity => identity.username)}`,
    })
  }

  if (assignmentsWithoutCost.length > 0) {
    issues.push({
      severity: 'medium',
      title: 'Afetações com custo horário a zero',
      description: `${assignmentsWithoutCost.length} afetações registam horas sem custo horário definido. ${buildPreview(assignmentsWithoutCost, assignment => assignment.person?.name)}`,
    })
  }

  if (notesWithoutWork.length > 0) {
    issues.push({
      severity: 'low',
      title: 'Notas ligadas a obras em falta',
      description: `${notesWithoutWork.length} notas diárias perderam a referência da obra.`,
    })
  }

  return issues.sort((left, right) => ISSUE_SEVERITY_ORDER[left.severity] - ISSUE_SEVERITY_ORDER[right.severity])
}

export function getDeveloperDashboardData() {
  const admins = getAllAdmins()
  const developers = getAllDevelopers()
  const clients = getAllClients()
  const works = getAllWorks()
  const people = getAllPeople()
  const workPlans = getAllWorkPlans()
  const assignments = getAllWorkAssignments()
  const notes = getAllDailyWorkNotes()
  const loginEvents = getAllLoginEvents()
  const identities = getAllAccessIdentities()
  const duplicates = collectDuplicateUsernames(admins, developers, identities)
  const issues = buildIssues({ people, identities, assignments, notes, duplicates })
  const recentEvents = buildRecentEvents(assignments, notes)
  const loginSummary = buildLoginSummary(loginEvents)

  const managerCount = people.filter(person => person.role === ROLE_RESPONSAVEL).length
  const chefCount = people.filter(person => isChefRole(person.role)).length
  const workerCount = people.filter(person => isWorkerRole(person.role)).length
  const peopleWithAppAccess = managerCount + chefCount
  const peopleWithCredentials = identities.filter(
    identity => identity.personId && (identity.role === ROLE_RESPONSAVEL || isChefRole(identity.role)),
  ).length
  const accessCoverage = peopleWithAppAccess > 0 ? Math.round((peopleWithCredentials / peopleWithAppAccess) * 100) : 100
  const latestPlanDate = workPlans.reduce((latest, workPlan) => {
    if (!latest) {
      return workPlan.date
    }

    return new Date(workPlan.date).getTime() > new Date(latest).getTime() ? workPlan.date : latest
  }, null)

  return {
    metrics: [
      { label: 'Obras', value: works.length, helper: `${works.filter(work => work.status === WorkStatus.IN_PROGRESS).length} em curso` },
      { label: 'Clientes', value: clients.length, helper: 'Base comercial ativa' },
      { label: 'Pessoas', value: people.length, helper: `${workerCount} perfis operacionais` },
      { label: 'Planos diários', value: workPlans.length, helper: 'Calendário de trabalho' },
      { label: 'Afetações', value: assignments.length, helper: `${assignments.filter(assignment => assignment.submitted).length} submetidas` },
      { label: 'Notas diárias', value: notes.length, helper: `${recentEvents.length} eventos recentes` },
      { label: 'Logins 7 dias', value: loginSummary.loginsLast7Days, helper: 'Entradas recentes na app' },
      { label: 'Logins 30 dias', value: loginSummary.loginsLast30Days, helper: `${loginSummary.activeUsersLast30Days} utilizadores ativos` },
      { label: 'Acessos operacionais', value: identities.length, helper: `${accessCoverage}% de cobertura` },
      { label: 'Contas técnicas', value: admins.length + developers.length, helper: `${developers.length} developer / ${admins.length} admin` },
    ],
    workStatus: Object.values(WorkStatus).map(status => ({
      key: status,
      label: STATUS_LABELS[status],
      value: works.filter(work => work.status === status).length,
    })),
    peopleSummary: [
      { label: 'Administradores', value: admins.length, helper: 'Contas legacy' },
      { label: 'Programadores', value: developers.length, helper: 'Gestão técnica' },
      { label: getRoleLabel(ROLE_RESPONSAVEL), value: managerCount, helper: 'Perfis de aprovação' },
      { label: 'Chefes', value: chefCount, helper: `${identities.filter(identity => isChefRole(identity.role)).length} com credenciais` },
      { label: 'Operacionais', value: workerCount, helper: 'Sem login de app' },
    ],
    accessSummary: [
      { label: 'Cobertura de acessos', value: `${accessCoverage}%`, helper: `${peopleWithCredentials}/${peopleWithAppAccess || 0} perfis com login` },
      { label: 'Alertas técnicos', value: issues.length, helper: issues.length > 0 ? 'Requer revisão' : 'Estado limpo' },
      { label: 'Usernames duplicados', value: duplicates.length, helper: 'Evitar colisão de login' },
      { label: 'Eventos recentes', value: recentEvents.length, helper: 'Última atividade visível' },
      { label: 'Histórico de logins', value: loginSummary.totalLogins, helper: 'Registos guardados no sistema' },
    ],
    issues,
    loginSummary,
    recentEvents,
    highlights: {
      latestPlanDate,
      lastActivityAt: recentEvents[0]?.date || null,
      latestLoginAt: loginSummary.latestLoginAt,
      submittedAssignments: assignments.filter(assignment => assignment.submitted).length,
    },
  }
}
