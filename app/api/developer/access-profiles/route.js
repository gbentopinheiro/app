import { NextResponse } from 'next/server'
import { getDeveloperAccessProfilesOverview } from '../../../../lib/developer-management.js'
import { hasPermission } from '../../../../lib/permissions.js'
import { getServerSession } from '../../../../lib/server-session.js'

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'developer.users.read')) {
      return NextResponse.json({ error: 'Sem permissao para consultar perfis.' }, { status: 403 })
    }

    return NextResponse.json({
      profiles: await getDeveloperAccessProfilesOverview(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter perfis de acesso.' }, { status: 500 })
  }
}
