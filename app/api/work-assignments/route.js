import { NextResponse } from 'next/server'
import { createWorkAssignment, getAllWorkAssignments, getAssignmentDefaults } from '../../../lib/work-assignments.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDefaults = searchParams.get('includeDefaults') === 'true'
    const filters = {
      workPlanId: searchParams.get('workPlanId'),
      workId: searchParams.get('workId'),
      personId: searchParams.get('personId'),
      date: searchParams.get('date'),
    }

    const assignments = getAllWorkAssignments(filters)

    if (includeDefaults) {
      return NextResponse.json({
        items: assignments,
        defaults: getAssignmentDefaults(),
      })
    }

    return NextResponse.json(assignments)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter afetacoes' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { workPlanId, workId, personId, date, hours, hourlyCost, notes } = body

    if (!workId || !personId || (!workPlanId && !date)) {
      return NextResponse.json({ error: 'workPlanId, workId e personId sao obrigatorios' }, { status: 400 })
    }

    if (date && Number.isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: 'date tem de ser uma data valida' }, { status: 400 })
    }

    if (hours === undefined || Number(hours) <= 0) {
      return NextResponse.json({ error: 'hours tem de ser maior que 0' }, { status: 400 })
    }

    if (hourlyCost !== undefined && Number(hourlyCost) < 0) {
      return NextResponse.json({ error: 'hourlyCost nao pode ser negativo' }, { status: 400 })
    }

    const assignment = createWorkAssignment({ workPlanId, workId, personId, date, hours, hourlyCost, notes })
    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    const status = error.message.includes('nao encontrado') ? 404 : 500
    return NextResponse.json({ error: error.message || 'Erro ao criar afetacao' }, { status })
  }
}
