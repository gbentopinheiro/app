import { NextResponse } from 'next/server'
import { deleteChefData, getChefByIdData, updateChefData } from '../../../../lib/chefs.js'
import { readProtectedRequestJson } from '../../../../lib/login-transport.js'

function hidePassword(identity) {
  const { password, ...safeIdentity } = identity
  return safeIdentity
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const identity = await getChefByIdData(id)

    if (!identity) {
      return NextResponse.json({ error: 'Identidade não encontrada' }, { status: 404 })
    }

    return NextResponse.json(hidePassword(identity))
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter identidade' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await readProtectedRequestJson(request)
    const { personId, username, password, works } = body

    const identity = await updateChefData(id, { personId, username, password, works })

    if (!identity) {
      return NextResponse.json({ error: 'Identidade não encontrada' }, { status: 404 })
    }

    return NextResponse.json(hidePassword(identity))
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

    return NextResponse.json({ error: error.message || 'Erro ao atualizar identidade' }, { status })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const deleted = await deleteChefData(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Identidade não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Identidade removida com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover identidade' }, { status: 500 })
  }
}
