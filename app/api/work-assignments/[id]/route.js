import { NextResponse } from 'next/server'
import { deleteWorkAssignment, getWorkAssignmentById, updateWorkAssignment } from '../../../../lib/work-assignments.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const assignment = getWorkAssignmentById(id)

    if (!assignment) {
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter afetacao' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { workPlanId, workId, personId, date, hours, hourlyCost, notes } = body

    if (date && Number.isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: 'date tem de ser uma data valida' }, { status: 400 })
    }

    if (hours !== undefined && Number(hours) <= 0) {
      return NextResponse.json({ error: 'hours tem de ser maior que 0' }, { status: 400 })
    }

    if (hourlyCost !== undefined && Number(hourlyCost) < 0) {
      return NextResponse.json({ error: 'hourlyCost nao pode ser negativo' }, { status: 400 })
    }

    const assignment = updateWorkAssignment(id, { workPlanId, workId, personId, date, hours, hourlyCost, notes })

    if (!assignment) {
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    const status = error.message.includes('nao encontrado') ? 404 : 500
    return NextResponse.json({ error: error.message || 'Erro ao atualizar afetacao' }, { status })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const deleted = deleteWorkAssignment(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Afetacao removida com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover afetacao' }, { status: 500 })
  }
}
