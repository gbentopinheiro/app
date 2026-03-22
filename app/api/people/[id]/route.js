import { NextResponse } from 'next/server'
import { getPersonById, updatePerson, deletePerson } from '../../../../lib/people'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const person = getPersonById(id)

    if (!person) {
      return NextResponse.json({ error: 'Pessoa nao encontrada' }, { status: 404 })
    }

    return NextResponse.json(person)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter pessoa' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, price, monthlyPrice } = body

    if (price !== undefined && Number(price) < 0) {
      return NextResponse.json({ error: 'Preco nao pode ser negativo' }, { status: 400 })
    }

    if (monthlyPrice !== undefined && Number(monthlyPrice) < 0) {
      return NextResponse.json({ error: 'monthlyPrice nao pode ser negativo' }, { status: 400 })
    }

    const updatedPerson = updatePerson(id, { name, price, monthlyPrice })

    if (!updatedPerson) {
      return NextResponse.json({ error: 'Pessoa nao encontrada' }, { status: 404 })
    }

    return NextResponse.json(updatedPerson)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar pessoa' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const deleted = deletePerson(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Pessoa nao encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Pessoa removida com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover pessoa' }, { status: 500 })
  }
}
