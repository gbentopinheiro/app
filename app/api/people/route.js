import { NextResponse } from 'next/server'
import { getAllPeople, createPerson } from '../../../lib/people'

export async function GET() {
  try {
    const people = getAllPeople()
    return NextResponse.json(people)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter pessoas' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, price, monthlyPrice } = body

    if (!name || price === undefined || monthlyPrice === undefined) {
      return NextResponse.json({ error: 'Nome, preco e monthlyPrice sao obrigatorios' }, { status: 400 })
    }

    if (Number(price) < 0 || Number(monthlyPrice) < 0) {
      return NextResponse.json({ error: 'Preco e monthlyPrice nao podem ser negativos' }, { status: 400 })
    }

    const newPerson = createPerson({ name, price, monthlyPrice })
    return NextResponse.json(newPerson, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar pessoa' }, { status: 500 })
  }
}
