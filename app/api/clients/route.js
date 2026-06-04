import { NextResponse } from 'next/server'
import { createClientData, getAllClientsData } from '../../../lib/clients.js'

export async function GET() {
  try {
    return NextResponse.json(await getAllClientsData())
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter clientes' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, vatNumber, contactName, email, phone, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome do cliente é obrigatório' }, { status: 400 })
    }

    const client = await createClientData({ name, vatNumber, contactName, email, phone, notes })
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
  }
}
