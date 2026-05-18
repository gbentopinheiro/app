import { NextResponse } from 'next/server'
import { deleteChef, getChefById, updateChef } from '../../../../lib/chefs.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const identity = getChefById(id)

    if (!identity) {
      return NextResponse.json({ error: 'Identidade não encontrada' }, { status: 404 })
    }

    return NextResponse.json(identity)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter identidade' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { personId, username, password, works } = body

    const identity = updateChef(id, { personId, username, password, works })

    if (!identity) {
      return NextResponse.json({ error: 'Identidade não encontrada' }, { status: 404 })
    }

    return NextResponse.json(identity)
  } catch (error) {
    const status =
      error.message?.includes('obrigatório') || error.message?.includes('Já existe') || error.message?.includes('role')
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
    const deleted = deleteChef(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Identidade não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Identidade removida com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover identidade' }, { status: 500 })
  }
}
