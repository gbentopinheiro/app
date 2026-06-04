import { NextResponse } from 'next/server'
import { createWorkData, getAllWorksData } from '../../../lib/works.js'
import { getClientByIdData } from '../../../lib/clients.js'

export async function GET() {
  try {
    const works = await getAllWorksData()
    return NextResponse.json(works)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter obras' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, clientId, location, status, budget, defaultHourlyCost, roleHourlyCosts, specialPersonHourlyCosts, startDate, endDate, workingDays, notes, number } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome da obra é obrigatório' }, { status: 400 })
    }

    if (!clientId || !(await getClientByIdData(clientId))) {
      return NextResponse.json({ error: 'A obra tem de pertencer a um cliente' }, { status: 400 })
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

    const newWork = await createWorkData({
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

    return NextResponse.json(newWork, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar obra' }, { status: 500 })
  }
}
