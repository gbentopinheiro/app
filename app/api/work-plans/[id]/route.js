import { NextResponse } from 'next/server'
import { deleteWorkPlanData, getWorkPlanByIdData, updateWorkPlanData } from '../../../../lib/work-plans.js'
import { getAllWorkAssignmentsData } from '../../../../lib/work-assignments.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const workPlan = await getWorkPlanByIdData(id)

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

    const workPlan = await updateWorkPlanData(id, { date })

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
    const linkedAssignments = await getAllWorkAssignmentsData({ workPlanId: id })

    if (linkedAssignments.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível remover um work plan com work assignments associados' },
        { status: 409 }
      )
    }

    const deleted = await deleteWorkPlanData(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Work plan não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Work plan removido com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover work plan' }, { status: 500 })
  }
}
