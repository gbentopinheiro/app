import { NextResponse } from 'next/server'
import { getDeveloperAccessProfileDetail } from '../../../../../lib/developer-management.js'
import { hasPermission } from '../../../../../lib/permissions.js'
import { getServerSession } from '../../../../../lib/server-session.js'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'developer.users.read')) {
      return NextResponse.json({ error: 'Sem permissao para consultar o perfil.' }, { status: 403 })
    }

    const { id } = await params
    const profile = await getDeveloperAccessProfileDetail(id)

    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado.' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter o perfil.' }, { status: 500 })
  }
}
