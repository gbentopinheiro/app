import { NextResponse } from 'next/server'
import { isDailyPlanLocked } from '../../../lib/daily-plan-lock.js'
import { hasPermission } from '../../../lib/permissions.js'
import { isChefRole } from '../../../lib/roles.js'
import { getServerSession } from '../../../lib/server-session.js'
import {
  canAccessWork,
  extendDefaultsForChef,
  filterAssignmentsForSession,
  filterDefaultsForSession,
  isChefPersonAllowedForWork,
  resolveDailyPlanDate,
  resolvePreviewScopedSession,
} from '../../../lib/work-assignment-policy.js'
import {
  createWorkAssignmentData,
  getAllWorkAssignmentsData,
  getAssignmentDefaultsData,
} from '../../../lib/work-assignments.js'

export async function GET(request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scopedSession = await resolvePreviewScopedSession(session, searchParams)

    if (!hasPermission(scopedSession, 'work_assignments.read')) {
      return NextResponse.json({ error: 'Sem permissao para consultar afetacoes.' }, { status: 403 })
    }

    const includeDefaults = searchParams.get('includeDefaults') === 'true'
    const filters = {
      workPlanId: searchParams.get('workPlanId'),
      workId: searchParams.get('workId'),
      personId: searchParams.get('personId'),
      date: searchParams.get('date'),
    }

    if (isChefRole(scopedSession.role) && filters.workId && !canAccessWork(scopedSession, filters.workId)) {
      return NextResponse.json({ error: 'Sem permissao para esta obra.' }, { status: 403 })
    }

    const assignments = filterAssignmentsForSession(await getAllWorkAssignmentsData(filters), scopedSession)

    if (includeDefaults) {
      const defaults = await getAssignmentDefaultsData()

      return NextResponse.json({
        items: assignments,
        defaults:
          isChefRole(scopedSession.role)
            ? await extendDefaultsForChef(defaults, scopedSession, filters)
            : filterDefaultsForSession(defaults, scopedSession),
      })
    }

    return NextResponse.json(assignments)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter afetacoes' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'work_assignments.create')) {
      return NextResponse.json({ error: 'Sem permissao para criar afetacoes.' }, { status: 403 })
    }

    const body = await request.json()
    const { workPlanId, workId, personId, date, hours, hourlyCost, manualHourlyCost, notes, hasWorkAccess } = body
    const targetDate = await resolveDailyPlanDate({ workPlanId, date })

    if (!workId || !personId || (!workPlanId && !date)) {
      return NextResponse.json({ error: 'workPlanId, workId e personId sao obrigatorios' }, { status: 400 })
    }

    if (isDailyPlanLocked(targetDate)) {
      return NextResponse.json(
        { error: 'Depois das 08:00 ja nao e possivel alterar o plano diario deste dia.' },
        { status: 403 },
      )
    }

    if (!canAccessWork(session, workId)) {
      return NextResponse.json({ error: 'Sem permissao para registar horas nesta obra.' }, { status: 403 })
    }

    if (!(await isChefPersonAllowedForWork(session, { workPlanId, date, workId, personId }))) {
      return NextResponse.json(
        { error: 'O chefe so pode registar pessoas colocadas pelo administrador no plano diario dessa obra.' },
        { status: 403 },
      )
    }

    if (date && Number.isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: 'date tem de ser uma data valida' }, { status: 400 })
    }

    if (hours === undefined || Number(hours) < 0) {
      return NextResponse.json({ error: 'hours tem de ser 0 ou maior' }, { status: 400 })
    }

    if (hourlyCost !== undefined && Number(hourlyCost) < 0) {
      return NextResponse.json({ error: 'hourlyCost nao pode ser negativo' }, { status: 400 })
    }

    const assignment = await createWorkAssignmentData({
      workPlanId,
      workId,
      personId,
      date,
      hours,
      hourlyCost,
      manualHourlyCost,
      notes,
      hasWorkAccess,
    })
    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    const status = String(error.message || '').includes('nao encontrado') ? 404 : 500
    return NextResponse.json({ error: error.message || 'Erro ao criar afetacao' }, { status })
  }
}
