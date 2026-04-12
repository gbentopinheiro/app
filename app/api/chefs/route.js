import { NextResponse } from 'next/server'
import { createChef, getAllChefs, getChefWorkOptions } from '../../../lib/chefs.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeWorks = searchParams.get('includeWorks') === 'true'

    if (includeWorks) {
      return NextResponse.json({
        items: getAllChefs(),
        works: getChefWorkOptions(),
      })
    }

    return NextResponse.json(getAllChefs())
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter identidades' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { username, password, works } = body

    const identity = createChef({ username, password, works })
    return NextResponse.json(identity, { status: 201 })
  } catch (error) {
    const status =
      error.message?.includes('obrigatorio') || error.message?.includes('Ja existe')
        ? 400
        : error.message?.includes('nao encontrada')
          ? 404
          : 500

    return NextResponse.json({ error: error.message || 'Erro ao criar identidade' }, { status })
  }
}
