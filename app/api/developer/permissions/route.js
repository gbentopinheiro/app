import { NextResponse } from 'next/server'
import { getDeveloperPermissionsCatalog } from '../../../../lib/developer-management.js'
import { hasPermission } from '../../../../lib/permissions.js'
import { getServerSession } from '../../../../lib/server-session.js'

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'developer.users.read')) {
      return NextResponse.json({ error: 'Sem permissao para consultar permissoes.' }, { status: 403 })
    }

    return NextResponse.json({
      permissions: await getDeveloperPermissionsCatalog(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter permissoes.' }, { status: 500 })
  }
}
