import { NextResponse } from 'next/server'
import { deleteClient, getClientById, updateClient } from '../../../../lib/clients.js'
import { getAllWorks } from '../../../../lib/works.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const client = getClientById(id)

    if (!client) {
      return NextResponse.json({ error: 'Cliente nao encontrado' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter cliente' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, vatNumber, contactName, email, phone, notes } = body

    const client = updateClient(id, { name, vatNumber, contactName, email, phone, notes })

    if (!client) {
      return NextResponse.json({ error: 'Cliente nao encontrado' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const linkedWorks = getAllWorks().filter(work => work.clientId === parseInt(id))

    if (linkedWorks.length > 0) {
      return NextResponse.json(
        { error: 'Nao e possivel remover um cliente associado a obras existentes' },
        { status: 409 }
      )
    }

    const deleted = deleteClient(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Cliente nao encontrado' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Cliente removido com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover cliente' }, { status: 500 })
  }
}
