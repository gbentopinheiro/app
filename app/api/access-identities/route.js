import { NextResponse } from 'next/server'
import { getAllAccessIdentitiesData, getAccessIdentityWorkOptionsData } from '../../../lib/access-identities.js'
import { canManageEntireApp } from '../../../lib/auth.js'
import { getServerSession } from '../../../lib/server-session.js'

function hidePassword(identity) {
  const { password, ...safeIdentity } = identity
  return safeIdentity
}

export async function GET(request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!canManageEntireApp(session.role)) {
      return NextResponse.json({ error: 'Sem permissao para consultar acessos.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeWorks = searchParams.get('includeWorks') === 'true'
    const items = await getAllAccessIdentitiesData()

    if (includeWorks) {
      return NextResponse.json({
        items: items.map(hidePassword),
        works: await getAccessIdentityWorkOptionsData(),
      })
    }

    return NextResponse.json(items.map(hidePassword))
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter acessos' }, { status: 500 })
  }
}
