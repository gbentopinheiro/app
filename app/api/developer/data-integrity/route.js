import { NextResponse } from 'next/server'
import { getAllAccessIdentitiesData } from '../../../../lib/access-identities.js'
import { getAllAdminsData } from '../../../../lib/admins.js'
import { getAllClientsData } from '../../../../lib/clients.js'
import { getAllDailyWorkNotesData } from '../../../../lib/daily-work-notes.js'
import { getAllDevelopersData } from '../../../../lib/developers.js'
import { getAllPeopleData } from '../../../../lib/people.js'
import { isDeveloperRole } from '../../../../lib/roles.js'
import { getServerSession } from '../../../../lib/server-session.js'
import { getAllWorkAssignmentsData } from '../../../../lib/work-assignments.js'
import { getAllWorkPlansData } from '../../../../lib/work-plans.js'
import { getAllWorksData } from '../../../../lib/works.js'

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!isDeveloperRole(session.role)) {
      return NextResponse.json({ error: 'Apenas o programador pode aceder a esta informacao.' }, { status: 403 })
    }

    const issues = []

    // Load all data
    const admins = await getAllAdminsData()
    const developers = await getAllDevelopersData()
    const identities = await getAllAccessIdentitiesData()
    const people = await getAllPeopleData()
    const works = await getAllWorksData()
    const clients = await getAllClientsData()
    const assignments = await getAllWorkAssignmentsData()
    const workPlans = await getAllWorkPlansData()
    const dailyNotes = await getAllDailyWorkNotesData()

    // Create lookup maps
    const personMap = new Map(people.map(p => [p.id, p]))
    const workMap = new Map(works.map(w => [w.id, w]))
    const clientMap = new Map(clients.map(c => [c.id, c]))

    // Issue 1: Check for duplicate usernames across all account types
    const usernameMap = new Map()
    const allUsers = [
      ...admins.map(a => ({ username: a.username, type: 'admin', id: a.id })),
      ...developers.map(d => ({ username: d.username, type: 'developer', id: d.id })),
      ...identities.map(i => ({ username: i.username, type: 'identity', id: i.id })),
    ]

    allUsers.forEach(user => {
      const key = user.username.toLowerCase()
      if (!usernameMap.has(key)) {
        usernameMap.set(key, [])
      }
      usernameMap.get(key).push(user)
    })

    usernameMap.forEach((users, username) => {
      if (users.length > 1) {
        issues.push({
          severity: 'high',
          category: 'duplicates',
          title: `Username duplicado: "${username}"`,
          description: `O username "${username}" esta utilizado por ${users.length} contas: ${users
            .map(u => `${u.type} (ID: ${u.id})`)
            .join(', ')}`,
          affectedCount: users.length,
        })
      }
    })

    // Issue 2: Check for orphaned work assignments (work or person missing)
    const orphanedAssignments = assignments.filter(
      assignment => !personMap.has(assignment.personId) || !workMap.has(assignment.workId),
    )

    if (orphanedAssignments.length > 0) {
      issues.push({
        severity: 'high',
        category: 'orphaned_data',
        title: `${orphanedAssignments.length} atribuicoes orfas`,
        description: `Foram encontradas ${orphanedAssignments.length} atribuicoes que referenciam pessoas ou obras que nao existem.`,
        affectedCount: orphanedAssignments.length,
      })
    }

    // Issue 3: Check for works without valid client
    const orphanedWorks = works.filter(work => !clientMap.has(work.clientId))

    if (orphanedWorks.length > 0) {
      issues.push({
        severity: 'medium',
        category: 'orphaned_data',
        title: `${orphanedWorks.length} obras sem cliente`,
        description: `${orphanedWorks.length} obra(s) nao tem cliente valido associado.`,
        affectedCount: orphanedWorks.length,
      })
    }

    // Issue 4: Check for people without access but with operational role
    const peopleWithoutAccess = people.filter(
      person =>
        person.role &&
        person.role !== 'carpinteiro' &&
        !identities.some(i => i.personId === person.id),
    )

    if (peopleWithoutAccess.length > 0) {
      issues.push({
        severity: 'medium',
        category: 'access_mismatch',
        title: `${peopleWithoutAccess.length} pessoas sem acesso configurado`,
        description: `${peopleWithoutAccess.length} pessoa(s) tem role operacional mas nenhuma identidade de acesso.`,
        affectedCount: peopleWithoutAccess.length,
      })
    }

    // Issue 5: Check for daily notes referencing non-existent works
    const orphanedNotes = dailyNotes.filter(note => !workMap.has(note.workId))

    if (orphanedNotes.length > 0) {
      issues.push({
        severity: 'low',
        category: 'orphaned_data',
        title: `${orphanedNotes.length} notas diarias com obra invalida`,
        description: `${orphanedNotes.length} nota(s) diaria(s) referenciam obras que ja nao existem.`,
        affectedCount: orphanedNotes.length,
      })
    }

    // Issue 6: Check for work plans referencing non-existent works
    const orphanedPlans = workPlans.filter(plan => !workMap.has(plan.workId))

    if (orphanedPlans.length > 0) {
      issues.push({
        severity: 'medium',
        category: 'orphaned_data',
        title: `${orphanedPlans.length} planos de trabalho orfos`,
        description: `${orphanedPlans.length} plano(s) de trabalho referenciam obras invalidas.`,
        affectedCount: orphanedPlans.length,
      })
    }

    // Issue 7: Check for identities with mismatched person role
    const mismatchedIdentities = identities.filter(
      identity => identity.personId && identity.person && identity.person.role !== identity.role,
    )

    if (mismatchedIdentities.length > 0) {
      issues.push({
        severity: 'high',
        category: 'access_mismatch',
        title: `${mismatchedIdentities.length} identidades com role inconsistente`,
        description: `${mismatchedIdentities.length} identidade(s) tem um role diferente do role da pessoa associada.`,
        affectedCount: mismatchedIdentities.length,
      })
    }

    // Calculate statistics
    const statistics = {
      totalPeople: people.length,
      totalWorks: works.length,
      totalClients: clients.length,
      totalAssignments: assignments.length,
      totalWorkPlans: workPlans.length,
      totalDailyNotes: dailyNotes.length,
      totalAccounts: admins.length + developers.length + identities.length,
    }

    // Sort issues by severity
    const severityOrder = { high: 0, medium: 1, low: 2 }
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    return NextResponse.json({
      issues,
      statistics,
      hasIssues: issues.length > 0,
      issueCounts: {
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        low: issues.filter(i => i.severity === 'low').length,
      },
    })
  } catch (error) {
    console.error('Error checking data integrity:', error.message)
    return NextResponse.json({ error: 'Erro ao verificar integridade dos dados.' }, { status: 500 })
  }
}
