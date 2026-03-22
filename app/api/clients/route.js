import { NextResponse } from 'next/server'
import { createClient, getAllClients } from '../../../lib/clients.js'

export async function GET() {
  try {
    return NextResponse.json(getAllClients())
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter clientes' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, vatNumber, contactName, email, phone, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome do cliente e obrigatorio' }, { status: 400 })
    }

    const client = createClient({ name, vatNumber, contactName, email, phone, notes })
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
  }
}
