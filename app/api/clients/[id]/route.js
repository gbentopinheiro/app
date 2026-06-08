import { NextResponse } from 'next/server'
import { deleteClientDb, getClientByIdDb, updateClientDb } from '../../../../lib/db/clients-db.js'
import { hasPermission } from '../../../../lib/permissions.js'
import { getServerSession } from '../../../../lib/server-session.js'
import { getAllWorksData } from '../../../../lib/works.js'

function getClientMutationErrorResponse(error, fallbackMessage) {
  const message =
    error?.code === 'P2002'
      ? 'Ja existe um cliente com esse nome'
      : error?.code === 'P2003'
        ? 'A empresa associada ao cliente nao existe'
        : String(error?.message || fallbackMessage).trim() || fallbackMessage
  const status = message === 'Ja existe um cliente com esse nome' ? 409 : 500
  return NextResponse.json({ error: message }, { status })
}

async function requireClientPermission(permissionKey) {
  const session = await getServerSession()

  if (!session) {
    return { error: NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 }) }
  }

  if (!hasPermission(session, permissionKey)) {
    return { error: NextResponse.json({ error: 'Sem permissao para gerir clientes.' }, { status: 403 }) }
  }

  return { session }
}

export async function GET(request, { params }) {
  try {
    const auth = await requireClientPermission('clients.read')
    if (auth.error) return auth.error

    const { id } = await params
    const client = await getClientByIdDb(id)

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
    const auth = await requireClientPermission('clients.update')
    if (auth.error) return auth.error

    const { id } = await params
    const body = await request.json()
    const { name, vatNumber, contactName, email, phone, notes } = body

    const client = await updateClientDb(id, { name, vatNumber, contactName, email, phone, notes })

    if (!client) {
      return NextResponse.json({ error: 'Cliente nao encontrado' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    return getClientMutationErrorResponse(error, 'Erro ao atualizar cliente')
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireClientPermission('clients.delete')
    if (auth.error) return auth.error

    const { id } = await params
    const linkedWorks = (await getAllWorksData()).filter(work => work.clientId === parseInt(id, 10))

    if (linkedWorks.length > 0) {
      return NextResponse.json(
        { error: 'Nao e possivel remover um cliente associado a obras existentes' },
        { status: 409 },
      )
    }

    const deleted = await deleteClientDb(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Cliente nao encontrado' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Cliente removido com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover cliente' }, { status: 500 })
  }
}
