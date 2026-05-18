import { NextResponse } from 'next/server'
import { deleteWorkPlan, getWorkPlanById, updateWorkPlan } from '../../../../lib/work-plans.js'
import { getAllWorkAssignments } from '../../../../lib/work-assignments.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const workPlan = getWorkPlanById(id)

    if (!workPlan) {
      return NextResponse.json({ error: 'Work plan não encontrado' }, { status: 404 })
    }

    return NextResponse.json(workPlan)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter work plan' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { date } = body

    const workPlan = updateWorkPlan(id, { date })

    if (!workPlan) {
      return NextResponse.json({ error: 'Work plan não encontrado' }, { status: 404 })
    }

    return NextResponse.json(workPlan)
  } catch (error) {
    const status = error.message?.includes('Já existe') || error.message?.includes('data válida') ? 400 : 500
    return NextResponse.json({ error: error.message || 'Erro ao atualizar work plan' }, { status })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const linkedAssignments = getAllWorkAssignments({ workPlanId: id })

    if (linkedAssignments.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível remover um work plan com work assignments associados' },
        { status: 409 }
      )
    }

    const deleted = deleteWorkPlan(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Work plan não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Work plan removido com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover work plan' }, { status: 500 })
  }
}
