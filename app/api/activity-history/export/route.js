import { NextResponse } from 'next/server'
import {
  buildGlobalActivityHistoryCsv,
  getGlobalActivityHistoryData,
  normalizeActivityHistoryFilters,
} from '../../../../lib/activity-history.js'
import { isFeatureEnabled } from '../../../../lib/feature-flags.js'
import { hasPermission } from '../../../../lib/permissions.js'
import { getServerSession } from '../../../../lib/server-session.js'

function getSafeDateLabel() {
  return new Date().toISOString().slice(0, 10)
}

export async function GET(request) {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
  }

  if (!hasPermission(session, 'activity_history.read_global')) {
    return NextResponse.json({ error: 'Sem permissao.' }, { status: 403 })
  }

  if (!isFeatureEnabled('activityHistory')) {
    return NextResponse.json({ error: 'Historico desativado.' }, { status: 403 })
  }

  const filters = normalizeActivityHistoryFilters(Object.fromEntries(new URL(request.url).searchParams.entries()))
  const history = await getGlobalActivityHistoryData(filters)
  const csv = buildGlobalActivityHistoryCsv(history.allEvents)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="historico-global-${getSafeDateLabel()}.csv"`,
    },
  })
}
