import { NextResponse } from 'next/server'
import { hasPermission } from '../../lib/permissions.js'
import { getCurrentSessionService } from '../services/session-service.js'
import {
  applyDeveloperDataIntegrityFixService,
  getDeveloperDataIntegrityFixErrorStatusService,
  getDeveloperDataIntegrityReportService,
} from '../services/developer-data-integrity-service.js'

export async function getDeveloperDataIntegrityController() {
  try {
    const session = await getCurrentSessionService()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'developer.data_integrity.read')) {
      return NextResponse.json({ error: 'Apenas o programador pode aceder a esta informacao.' }, { status: 403 })
    }

    return NextResponse.json(await getDeveloperDataIntegrityReportService())
  } catch (error) {
    console.error('Error checking data integrity:', error.message)
    return NextResponse.json({ error: 'Erro ao verificar integridade dos dados.' }, { status: 500 })
  }
}

export async function postDeveloperDataIntegrityController(request) {
  try {
    const session = await getCurrentSessionService()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (
      !hasPermission(session, 'developer.data_integrity.read') ||
      !hasPermission(session, 'developer.audit.write')
    ) {
      return NextResponse.json({ error: 'Sem permissao para corrigir integridade.' }, { status: 403 })
    }

    const body = await request.json()
    return NextResponse.json(await applyDeveloperDataIntegrityFixService(body.issueId, session.username))
  } catch (error) {
    const message = String(error?.message || 'Erro ao aplicar a correcao de integridade.').trim()
    return NextResponse.json(
      { error: message },
      { status: getDeveloperDataIntegrityFixErrorStatusService(error) },
    )
  }
}
