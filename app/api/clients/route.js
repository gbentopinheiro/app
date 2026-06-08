import { NextResponse } from 'next/server'
import { createClientDb, getAllClientsDb } from '../../../lib/db/clients-db.js'
import { hasPermission } from '../../../lib/permissions.js'
import { getServerSession } from '../../../lib/server-session.js'

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

export async function GET() {
  try {
    const auth = await requireClientPermission('clients.read')
    if (auth.error) return auth.error

    return NextResponse.json(await getAllClientsDb())
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter clientes' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const auth = await requireClientPermission('clients.create')
    if (auth.error) return auth.error

    const body = await request.json()
    const { name, vatNumber, contactName, email, phone, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome do cliente e obrigatorio' }, { status: 400 })
    }

    const client = await createClientDb({ name, vatNumber, contactName, email, phone, notes })
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    return getClientMutationErrorResponse(error, 'Erro ao criar cliente')
  }
}
