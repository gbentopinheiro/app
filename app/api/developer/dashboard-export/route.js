import { NextResponse } from 'next/server'
import { getDeveloperDashboardData } from '../../../../lib/developer-dashboard.js'
import { buildDeveloperDashboardPdf } from '../../../../lib/developer-dashboard-export.js'
import { hasPermission } from '../../../../lib/permissions.js'
import { getServerSession } from '../../../../lib/server-session.js'

function getSafeDateLabel() {
  return new Intl.DateTimeFormat('sv-SE').format(new Date())
}

export async function GET() {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
  }

  if (!hasPermission(session, 'developer.dashboard.export')) {
    return NextResponse.json({ error: 'Apenas o programador pode exportar este relatorio.' }, { status: 403 })
  }

  const dashboard = await getDeveloperDashboardData()
  const pdf = buildDeveloperDashboardPdf({
    dashboard,
    developerName: session.name,
    exportedAt: new Date().toISOString(),
  })

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="developer-recente-${getSafeDateLabel()}.pdf"`,
    },
  })
}
