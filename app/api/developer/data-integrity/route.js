import { NextResponse } from 'next/server'
import { applyDeveloperDataIntegrityFix, getDeveloperDataIntegrityReport } from '../../../../lib/developer-management.js'
import { hasPermission } from '../../../../lib/permissions.js'
import { getServerSession } from '../../../../lib/server-session.js'

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'developer.data_integrity.read')) {
      return NextResponse.json({ error: 'Apenas o programador pode aceder a esta informacao.' }, { status: 403 })
    }

    return NextResponse.json(await getDeveloperDataIntegrityReport())
  } catch (error) {
    console.error('Error checking data integrity:', error.message)
    return NextResponse.json({ error: 'Erro ao verificar integridade dos dados.' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'developer.data_integrity.read') || !hasPermission(session, 'developer.audit.write')) {
      return NextResponse.json({ error: 'Sem permissao para corrigir integridade.' }, { status: 403 })
    }

    const body = await request.json()
    const result = await applyDeveloperDataIntegrityFix(body.issueId, session.username)

    return NextResponse.json(result)
  } catch (error) {
    const message = String(error?.message || 'Erro ao aplicar a correcao de integridade.').trim()
    const status = message.includes('ainda nao esta disponivel') ? 409 : message.includes('invalida') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
