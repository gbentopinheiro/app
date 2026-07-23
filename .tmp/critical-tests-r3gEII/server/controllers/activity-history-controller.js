import { NextResponse } from 'next/server'
import { hasPermission } from '../../lib/permissions.js'
import { getServerSession } from '../../lib/server-session.js'
import {
  buildPersonActivityHistoryCsvService,
  buildPersonActivityHistoryPdfService,
  getGlobalActivityHistoryDateLabelService,
  getGlobalActivityHistoryExportCsvService,
  getPersonActivityHistoryDataService,
  getPersonActivityHistorySafeNameService,
  isActivityHistoryFeatureEnabledService,
} from '../services/activity-history-service.js'

const PERSON_ACTIVITY_HISTORY_SESSION_ERROR = 'Sess\u00c3\u00a3o obrigat\u00c3\u00b3ria.'
const PERSON_ACTIVITY_HISTORY_PERMISSION_ERROR = 'Sem permiss\u00c3\u00a3o.'
const PERSON_ACTIVITY_HISTORY_NOT_FOUND_ERROR = 'Pessoa n\u00c3\u00a3o encontrada.'

export async function getPersonActivityHistoryController(request, id) {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: PERSON_ACTIVITY_HISTORY_SESSION_ERROR }, { status: 401 })
  }

  if (!hasPermission(session, 'people.activity_history.read')) {
    return NextResponse.json({ error: PERSON_ACTIVITY_HISTORY_PERMISSION_ERROR }, { status: 403 })
  }

  const activityHistory = await getPersonActivityHistoryDataService(id)

  if (!activityHistory) {
    return NextResponse.json({ error: PERSON_ACTIVITY_HISTORY_NOT_FOUND_ERROR }, { status: 404 })
  }

  const format = String(new URL(request.url).searchParams.get('format') || 'pdf').toLowerCase()
  const safeName = getPersonActivityHistorySafeNameService(activityHistory.person, id)

  if (format === 'csv') {
    const csv = buildPersonActivityHistoryCsvService(activityHistory.person, activityHistory.rows)

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="historico-atividades-${safeName || id}.csv"`,
      },
    })
  }

  const pdf = buildPersonActivityHistoryPdfService(activityHistory.person, activityHistory.rows)

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="historico-atividades-${safeName || id}.pdf"`,
    },
  })
}

export async function exportGlobalActivityHistoryController(request) {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
  }

  if (!hasPermission(session, 'activity_history.read_global')) {
    return NextResponse.json({ error: 'Sem permissao.' }, { status: 403 })
  }

  if (!(await isActivityHistoryFeatureEnabledService())) {
    return NextResponse.json({ error: 'Historico desativado.' }, { status: 403 })
  }

  const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries())
  const csv = await getGlobalActivityHistoryExportCsvService(searchParams)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="historico-global-${getGlobalActivityHistoryDateLabelService()}.csv"`,
    },
  })
}
