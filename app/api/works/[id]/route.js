import { NextResponse } from 'next/server'
import { deleteWorkData, getWorkByIdData, updateWorkData } from '../../../../lib/works.js'
import { getClientByIdData } from '../../../../lib/clients.js'
import { repriceWorkAssignmentsForWorkData } from '../../../../lib/work-assignments.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const work = await getWorkByIdData(id)

    if (!work) {
      return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })
    }

    return NextResponse.json(work)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter obra' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      clientId,
      location,
      status,
      budget,
      defaultHourlyCost,
      roleHourlyCosts,
      specialPersonHourlyCosts,
      startDate,
      endDate,
      workingDays,
      notes,
      number,
      pricingChangeApplication,
    } = body

    if (clientId !== undefined && (!clientId || !(await getClientByIdData(clientId)))) {
      return NextResponse.json({ error: 'A obra tem de pertencer a um cliente válido' }, { status: 400 })
    }

    if (defaultHourlyCost !== undefined && Number(defaultHourlyCost) < 0) {
      return NextResponse.json({ error: 'defaultHourlyCost não pode ser negativo' }, { status: 400 })
    }

    if (startDate && Number.isNaN(new Date(startDate).getTime())) {
      return NextResponse.json({ error: 'startDate tem de ser uma data válida' }, { status: 400 })
    }

    if (endDate && Number.isNaN(new Date(endDate).getTime())) {
      return NextResponse.json({ error: 'endDate tem de ser uma data válida' }, { status: 400 })
    }

    if (pricingChangeApplication?.startDate && Number.isNaN(new Date(`${pricingChangeApplication.startDate}T00:00:00`).getTime())) {
      return NextResponse.json({ error: 'A data de aplicacao da tarifa e invalida' }, { status: 400 })
    }

    const updatedWork = await updateWorkData(id, {
      name,
      clientId,
      location,
      status,
      budget,
      defaultHourlyCost,
      roleHourlyCosts,
      specialPersonHourlyCosts,
      startDate,
      endDate,
      workingDays,
      notes,
      number,
    })

    if (!updatedWork) {
      return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })
    }

    const repricedAssignmentsCount = pricingChangeApplication?.startDate
      ? await repriceWorkAssignmentsForWorkData(id, pricingChangeApplication.startDate)
      : 0

    return NextResponse.json({
      ...updatedWork,
      repricedAssignmentsCount,
      pricingAppliedFrom: pricingChangeApplication?.startDate || null,
      pricingApplicationMode: pricingChangeApplication?.mode || null,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar obra' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const deleted = await deleteWorkData(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Obra removida com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover obra' }, { status: 500 })
  }
}
