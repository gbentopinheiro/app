import { NextResponse } from 'next/server'
import { deleteWork, getWorkById, updateWork } from '../../../../lib/works.js'
import { getClientById } from '../../../../lib/clients.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const work = getWorkById(id)

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
    const { name, clientId, location, status, budget, defaultHourlyCost, startDate, endDate, notes, number } = body

    if (clientId !== undefined && (!clientId || !getClientById(clientId))) {
      return NextResponse.json({ error: 'A obra tem de pertencer a um cliente valido' }, { status: 400 })
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

    const updatedWork = updateWork(id, {
      name,
      clientId,
      location,
      status,
      budget,
      defaultHourlyCost,
      startDate,
      endDate,
      notes,
      number,
    })

    if (!updatedWork) {
      return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })
    }

    return NextResponse.json(updatedWork)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar obra' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const deleted = deleteWork(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Obra removida com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover obra' }, { status: 500 })
  }
}
