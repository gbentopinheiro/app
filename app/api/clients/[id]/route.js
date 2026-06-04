import { NextResponse } from 'next/server'
import { deleteClientData, getClientByIdData, updateClientData } from '../../../../lib/clients.js'
import { getAllWorksData } from '../../../../lib/works.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const client = await getClientByIdData(id)

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
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

    const client = await updateClientData(id, { name, vatNumber, contactName, email, phone, notes })

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const linkedWorks = (await getAllWorksData()).filter(work => work.clientId === parseInt(id))

    if (linkedWorks.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível remover um cliente associado a obras existentes' },
        { status: 409 }
      )
    }

    const deleted = await deleteClientData(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Cliente removido com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover cliente' }, { status: 500 })
  }
}
