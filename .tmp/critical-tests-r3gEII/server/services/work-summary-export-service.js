import { normalizeClientSummaryLanguage } from '../../lib/client-summary-language.js'
import { getClientByIdData } from '../../lib/clients.js'
import { hasPermission } from '../../lib/permissions.js'
import {
  buildSingleWorkSummaryPrintDocument,
  buildSingleWorkSummaryWorkbook,
  buildSummaryExportFilename,
  buildWorkbookBytes,
  buildWorkSummaryPrintDocument,
  buildWorkSummaryWorkbook,
} from '../../lib/work-summary-export.js'
import { canAccessWork, filterAssignmentsForSession } from '../../lib/work-assignment-policy.js'
import { getAllWorkAssignmentsData } from '../../lib/work-assignments.js'
import { getAllWorksData } from '../../lib/works.js'
import { HttpError } from '../errors/http-error.js'

const MAX_WORKS_PER_EXPORT = 100
const MAX_SUMMARY_NAME_LENGTH = 120
const MAX_PERIOD_DAYS = 366
const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const HTML_CONTENT_TYPE = 'text/html;charset=utf-8'

function ensureExportPermission(session) {
  if (!hasPermission(session, 'works.annual_summary.export')) {
    throw new HttpError(403, 'Sem permissao para exportar resumos de obras.')
  }
}

function normalizeDateOnly(value) {
  const normalizedValue = String(value || '').trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue) ? normalizedValue : ''
}

function normalizeMonthValue(value) {
  const normalizedValue = String(value || '').trim().slice(0, 7)
  return /^\d{4}-\d{2}$/.test(normalizedValue) ? normalizedValue : ''
}

function getLastDateOfMonth(monthValue) {
  const normalizedMonth = normalizeMonthValue(monthValue)

  if (!normalizedMonth) {
    return ''
  }

  const [year, month] = normalizedMonth.split('-').map(Number)
  return new Intl.DateTimeFormat('sv-SE').format(new Date(year, month, 0))
}

function normalizeMonthPeriod(body = {}) {
  const startMonth = normalizeMonthValue(body.startMonth)
  const endMonth = normalizeMonthValue(body.endMonth)

  if (!startMonth || !endMonth) {
    throw new HttpError(400, 'Seleciona os meses inicial e final.')
  }

  if (startMonth > endMonth) {
    throw new HttpError(400, 'O mês final não pode ser anterior ao mês inicial.')
  }

  const startDate = `${startMonth}-01`
  const endDate = getLastDateOfMonth(endMonth)
  const startDateTime = new Date(`${startDate}T00:00:00`)
  const endDateTime = new Date(`${endDate}T00:00:00`)
  const diffInDays = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 86400000)

  if (!Number.isFinite(diffInDays) || diffInDays < 0 || diffInDays > MAX_PERIOD_DAYS) {
    throw new HttpError(400, 'O período selecionado excede o limite permitido para exportação.')
  }

  return { startMonth, endMonth, startDate, endDate }
}

function normalizeWorkIds(values) {
  const uniqueValues = Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map(candidate => Number.parseInt(candidate, 10))
        .filter(Number.isInteger)
        .filter(candidate => candidate > 0),
    ),
  )

  if (uniqueValues.length === 0) {
    throw new HttpError(400, 'Seleciona pelo menos uma obra.')
  }

  if (uniqueValues.length > MAX_WORKS_PER_EXPORT) {
    throw new HttpError(400, `Não é possível exportar mais de ${MAX_WORKS_PER_EXPORT} obras de uma vez.`)
  }

  return uniqueValues
}

function normalizeSummaryName(value) {
  const normalizedValue = String(value || '').trim()

  if (!normalizedValue) {
    throw new HttpError(400, 'Indica o nome do resumo.')
  }

  if (normalizedValue.length > MAX_SUMMARY_NAME_LENGTH) {
    throw new HttpError(
      400,
      `O nome do resumo não pode ter mais de ${MAX_SUMMARY_NAME_LENGTH} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeExportFormat(value) {
  const normalizedValue = String(value || 'xlsx').trim().toLowerCase()

  if (normalizedValue === 'xlsx' || normalizedValue === 'pdf') {
    return normalizedValue
  }

  throw new HttpError(400, 'Formato de exportacao invalido.')
}

function buildContentDisposition(filename) {
  const safeFilename = String(filename || 'resumo.xlsx').replace(/"/g, '')
  return `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
}

async function loadExportReferenceData(session, workIds, period) {
  const [works, assignments] = await Promise.all([
    getAllWorksData(),
    getAllWorkAssignmentsData({
      workIds,
      dateFrom: period.startDate,
      dateTo: period.endDate,
    }),
  ])

  return {
    workMap: new Map(works.map(work => [Number(work.id), work])),
    assignments: filterAssignmentsForSession(assignments, session),
  }
}

function resolveSelectedWorks({ clientId, workIds, workMap, session }) {
  return workIds.map(workId => {
    const work = workMap.get(Number(workId))

    if (!work) {
      throw new HttpError(400, 'Existe uma obra selecionada que não existe.')
    }

    if (Number(work.clientId) !== Number(clientId)) {
      throw new HttpError(400, 'Existe uma obra selecionada que não pertence ao cliente.')
    }

    if (!canAccessWork(session, work.id)) {
      throw new HttpError(403, 'Existe uma obra sem permissao de exportacao para o utilizador atual.')
    }

    return work
  })
}

function filterAssignmentsForSelectedWorks(assignments, workIds) {
  const workIdSet = new Set(workIds.map(workId => Number(workId)))

  return (Array.isArray(assignments) ? assignments : []).filter(assignment =>
    workIdSet.has(Number(assignment.workId)),
  )
}

function buildWorkbookForSelection({ selectedWorks, assignments, period, summaryName, language }) {
  if (selectedWorks.length === 1) {
    const selectedWork = selectedWorks[0]

    return buildSingleWorkSummaryWorkbook({
      work: selectedWork,
      workId: selectedWork.id,
      assignments,
      startDate: period.startDate,
      endDate: period.endDate,
      language,
      summaryName,
    })
  }

  return buildWorkSummaryWorkbook({
    title: summaryName,
    assignments,
    startDate: period.startDate,
    endDate: period.endDate,
    language,
  })
}

function buildPrintDocumentForSelection({ selectedWorks, assignments, period, summaryName, language }) {
  if (selectedWorks.length === 1) {
    const selectedWork = selectedWorks[0]

    return buildSingleWorkSummaryPrintDocument({
      work: selectedWork,
      workId: selectedWork.id,
      assignments,
      startDate: period.startDate,
      endDate: period.endDate,
      language,
      summaryName,
    })
  }

  return buildWorkSummaryPrintDocument({
    title: summaryName,
    assignments,
    startDate: period.startDate,
    endDate: period.endDate,
    language,
    branding: selectedWorks[0] || null,
  })
}

export async function exportClientWorkSummaryService(session, clientId, body) {
  ensureExportPermission(session)

  const normalizedClientId = Number.parseInt(clientId, 10)

  if (!Number.isInteger(normalizedClientId) || normalizedClientId <= 0) {
    throw new HttpError(400, 'Cliente inválido.')
  }

  const client = await getClientByIdData(normalizedClientId)

  if (!client) {
    throw new HttpError(404, 'Cliente não encontrado.')
  }

  const workIds = normalizeWorkIds(body?.workIds)
  const period = normalizeMonthPeriod(body)
  const summaryName = normalizeSummaryName(body?.summaryName)
  const exportFormat = normalizeExportFormat(body?.format)
  const { workMap, assignments } = await loadExportReferenceData(session, workIds, period)
  const selectedWorks = resolveSelectedWorks({
    clientId: normalizedClientId,
    workIds,
    workMap,
    session,
  })
  const language = normalizeClientSummaryLanguage(client.summaryLanguage)
  const selectedAssignments = filterAssignmentsForSelectedWorks(assignments, workIds)

  try {
    if (exportFormat === 'pdf') {
      const filename = buildSummaryExportFilename({
        summaryName,
        startDate: period.startDate,
        endDate: period.endDate,
        extension: 'pdf',
      })

      return {
        body: buildPrintDocumentForSelection({
          selectedWorks,
          assignments: selectedAssignments,
          period,
          summaryName,
          language,
        }),
        status: 200,
        headers: {
          'Content-Type': HTML_CONTENT_TYPE,
          'Content-Disposition': buildContentDisposition(filename),
        },
      }
    }

    const workbook = buildWorkbookForSelection({
      selectedWorks,
      assignments: selectedAssignments,
      period,
      summaryName,
      language,
    })
    const filename = buildSummaryExportFilename({
      summaryName,
      startDate: period.startDate,
      endDate: period.endDate,
      extension: 'xlsx',
    })

    return {
      body: buildWorkbookBytes(workbook),
      status: 200,
      headers: {
        'Content-Type': XLSX_CONTENT_TYPE,
        'Content-Disposition': buildContentDisposition(filename),
      },
    }
  } catch (error) {
    console.error('Client work summary export generation failed:', error)
    throw new HttpError(500, 'Não foi possível gerar o resumo selecionado.')
  }
}

export function getClientExportPeriodFromMonths(startMonth, endMonth) {
  return normalizeMonthPeriod({ startMonth, endMonth })
}

export function sanitizeWorkSummaryRequest(body = {}) {
  return {
    workIds: normalizeWorkIds(body.workIds),
    summaryName: normalizeSummaryName(body.summaryName),
    ...normalizeMonthPeriod(body),
  }
}

export function filterExportAssignmentsByWorkIds(assignments, workIds) {
  return filterAssignmentsForSelectedWorks(assignments, workIds)
}

export function buildWorkbookResponseFilename(summaryName, startDate, endDate) {
  return buildSummaryExportFilename({ summaryName, startDate, endDate })
}

export function isDateOnlyString(value) {
  return Boolean(normalizeDateOnly(value))
}
