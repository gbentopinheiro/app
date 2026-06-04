import { NextResponse } from 'next/server'
import { createChefData, getAllChefsData, getChefWorkOptionsData } from '../../../lib/chefs.js'
import { readProtectedRequestJson } from '../../../lib/login-transport.js'

function hidePassword(identity) {
  const { password, ...safeIdentity } = identity
  return safeIdentity
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeWorks = searchParams.get('includeWorks') === 'true'
    const chefs = await getAllChefsData()

    if (includeWorks) {
      return NextResponse.json({
        items: chefs.map(hidePassword),
        works: await getChefWorkOptionsData(),
      })
    }

    return NextResponse.json(chefs.map(hidePassword))
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter identidades' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await readProtectedRequestJson(request)
    const { personId, username, password, works } = body

    const identity = await createChefData({ personId, username, password, works })
    return NextResponse.json(hidePassword(identity), { status: 201 })
  } catch (error) {
    if (error.message?.includes('protecao') || error.message?.includes('protegido')) {
      return NextResponse.json({ error: 'Pedido sensível não protegido.' }, { status: 400 })
    }

    const status =
      error.message?.includes('obrigatório') ||
      error.message?.includes('palavra-passe') ||
      error.message?.includes('carácter') ||
      error.message?.includes('bytes') ||
      error.message?.includes('Já existe') ||
      error.message?.includes('role')
        ? 400
        : error.message?.includes('não encontrada')
          ? 404
          : 500

    return NextResponse.json({ error: error.message || 'Erro ao criar identidade' }, { status })
  }
}
