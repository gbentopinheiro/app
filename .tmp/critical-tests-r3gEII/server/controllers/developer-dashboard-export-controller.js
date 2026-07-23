import { NextResponse } from 'next/server'
import { hasPermission } from '../../lib/permissions.js'
import { getCurrentSessionService } from '../services/session-service.js'
import { getDeveloperDashboardExportService } from '../services/developer-dashboard-export-service.js'

export async function getDeveloperDashboardExportController() {
  const session = await getCurrentSessionService()

  if (!session) {
    return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
  }

  if (!hasPermission(session, 'developer.dashboard.export')) {
    return NextResponse.json({ error: 'Apenas o programador pode exportar este relatorio.' }, { status: 403 })
  }

  const { pdf, filename } = await getDeveloperDashboardExportService(session.name)

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
