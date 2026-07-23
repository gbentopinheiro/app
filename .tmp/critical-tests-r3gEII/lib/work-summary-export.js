import * as XLSX from 'xlsx'
import { getApprovedAssignmentHours, getApprovedAssignmentTotalCost } from './work-assignment-approval.js'

const EXCEL_BORDER_RGB = '738178'
const EXCEL_HEADER_FILL_RGB = 'E4E7E2'
const EXCEL_WEEKEND_FILL_RGB = 'D7B8A6'
const EXCEL_TOTAL_FILL_RGB = 'F3DCCF'
const MAX_SHEET_NAME_LENGTH = 31
const MAX_FILENAME_SEGMENT_LENGTH = 120

const SUMMARY_TRANSLATIONS = {
  pt: {
    locale: 'pt-PT',
    reportTitle: 'Resumo',
    monthHeadingPrefix: 'Mês',
    employeeHeader: 'Trabalhador',
    hoursHeader: 'Horas',
    totalLabel: 'TOTAL',
    noDataInPeriod: 'Sem dados no periodo.',
    periodUndefined: 'Periodo não definido',
  },
  fr: {
    locale: 'fr-FR',
    reportTitle: 'Résumé',
    monthHeadingPrefix: 'Mois',
    employeeHeader: 'Travailleur',
    hoursHeader: 'Heures',
    totalLabel: 'TOTAL',
    noDataInPeriod: 'Aucune donnée sur la période.',
    periodUndefined: 'Période non définie',
  },
  en: {
    locale: 'en-GB',
    reportTitle: 'Summary',
    monthHeadingPrefix: 'Month',
    employeeHeader: 'Worker',
    hoursHeader: 'Hours',
    totalLabel: 'TOTAL',
    noDataInPeriod: 'No data in the selected period.',
    periodUndefined: 'Period not defined',
  },
  es: {
    locale: 'es-ES',
    reportTitle: 'Resumen',
    monthHeadingPrefix: 'Mes',
    employeeHeader: 'Trabajador',
    hoursHeader: 'Horas',
    totalLabel: 'TOTAL',
    noDataInPeriod: 'Sin datos en el periodo.',
    periodUndefined: 'Periodo no definido',
  },
}

function normalizeDateOnly(value) {
  const normalizedValue = String(value || '').trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue) ? normalizedValue : ''
}

function normalizeMonthValue(value) {
  const normalizedValue = String(value || '').trim().slice(0, 7)
  return /^\d{4}-\d{2}$/.test(normalizedValue) ? normalizedValue : ''
}

export function getWorkSummaryTranslations(language) {
  const normalizedLanguage = String(language || '').trim().toLowerCase()
  return SUMMARY_TRANSLATIONS[normalizedLanguage] || SUMMARY_TRANSLATIONS.pt
}

export function formatSummaryMonthLabel(monthKey, language = 'pt') {
  const [year, month] = String(monthKey || '').split('-').map(Number)

  if (!year || !month) {
    return String(monthKey || '').trim()
  }

  return new Intl.DateTimeFormat(getWorkSummaryTranslations(language).locale, {
    month: 'long',
    year: 'numeric',
  })
    .format(new Date(year, month - 1, 1))
    .replace(/\s+de\s+/gi, ' ')
}

export function formatSummaryDateLabel(dateString, language = 'pt') {
  const candidate = new Date(`${normalizeDateOnly(dateString)}T00:00:00`)

  if (Number.isNaN(candidate.getTime())) {
    return String(dateString || '').trim()
  }

  return new Intl.DateTimeFormat(getWorkSummaryTranslations(language).locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(candidate)
}

export function formatSummaryPeriodLabel(startDate, endDate, language = 'pt') {
  const normalizedStartDate = normalizeDateOnly(startDate)
  const normalizedEndDate = normalizeDateOnly(endDate)
  const translations = getWorkSummaryTranslations(language)

  if (!normalizedStartDate || !normalizedEndDate) {
    return translations.periodUndefined
  }

  if (normalizedStartDate === normalizedEndDate) {
    return formatSummaryDateLabel(normalizedStartDate, language)
  }

  return `${formatSummaryDateLabel(normalizedStartDate, language)} a ${formatSummaryDateLabel(normalizedEndDate, language)}`
}

export function getWorkSummaryDisplayName(work, fallback = 'Obra') {
  const workName = String(work?.name || '').trim()

  if (workName) {
    return workName
  }

  const clientName = String(work?.client?.name || '').trim()

  if (clientName) {
    return clientName
  }

  return fallback
}

function listMonthKeysInPeriod(startDate, endDate) {
  const normalizedStartDate = normalizeDateOnly(startDate)
  const normalizedEndDate = normalizeDateOnly(endDate)

  if (!normalizedStartDate || !normalizedEndDate) {
    return []
  }

  const [startYear, startMonth] = normalizedStartDate.slice(0, 7).split('-').map(Number)
  const [endYear, endMonth] = normalizedEndDate.slice(0, 7).split('-').map(Number)

  if (!startYear || !startMonth || !endYear || !endMonth) {
    return []
  }

  const cursor = new Date(startYear, startMonth - 1, 1)
  const limit = new Date(endYear, endMonth - 1, 1)
  const months = []

  while (cursor <= limit) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return months
}

function formatExportMonthHeader(monthKey, language = 'pt', fallbackLabel = '') {
  if (!monthKey || monthKey === 'Sem data') {
    return fallbackLabel || monthKey || ''
  }

  const normalizedMonth = normalizeMonthValue(monthKey)

  if (!normalizedMonth) {
    return fallbackLabel || String(monthKey || '')
  }

  const translations = getWorkSummaryTranslations(language)
  const monthLabel = formatSummaryMonthLabel(normalizedMonth, language)
  const capitalizedMonthLabel = monthLabel ? monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) : monthLabel

  return `${translations.monthHeadingPrefix}: ${capitalizedMonthLabel}`
}

function formatSheetTitle(title, monthKey, fallback = 'resumo') {
  const normalizedTitle =
    String(title || '')
      .replace(/[:\\/?*\[\]]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || fallback
  return `${normalizedTitle}-${monthKey}`.slice(0, MAX_SHEET_NAME_LENGTH)
}

function isWeekendDay(monthKey, dayNumber) {
  const [year, month] = String(monthKey || '').split('-').map(Number)

  if (!year || !month || !dayNumber) {
    return false
  }

  const date = new Date(year, month - 1, dayNumber)
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6
}

function formatGridNumber(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  return Number.isInteger(value) ? String(value) : String(Number(Number(value).toFixed(2)))
}

function buildMonthlyGrid(month, language = 'pt') {
  const peopleMap = new Map()
  const dayColumns = Array.from({ length: 31 }, (_, index) => index + 1)
  const translations = getWorkSummaryTranslations(language)

  month.days.forEach(day => {
    const dayNumber = Number.parseInt(String(day.date).slice(8, 10), 10)

    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31) {
      return
    }

    day.people.forEach(assignment => {
      const personKey = assignment.person?.id || assignment.personId
      const personName = assignment.person?.name || `Pessoa ${assignment.personId}`
      const currentPerson = peopleMap.get(personKey) || {
        name: personName,
        values: Array(31).fill(null),
        totalHours: 0,
        totalValue: 0,
      }

      const assignmentHours = getApprovedAssignmentHours(assignment)
      const assignmentTotalCost = getApprovedAssignmentTotalCost(assignment)
      const nextValue = (currentPerson.values[dayNumber - 1] ?? 0) + assignmentHours

      currentPerson.values[dayNumber - 1] = Number(nextValue.toFixed(2))
      currentPerson.totalHours = Number((currentPerson.totalHours + assignmentHours).toFixed(2))
      currentPerson.totalValue = Number((currentPerson.totalValue + assignmentTotalCost).toFixed(2))
      peopleMap.set(personKey, currentPerson)
    })
  })

  const peopleRows = Array.from(peopleMap.values())
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(person => ({
      name: person.name,
      values: person.values.map(value => value ?? ''),
      totalHours: person.totalHours,
      totalValue: person.totalValue,
    }))
    .filter(person => person.totalHours > 0 || person.totalValue > 0)

  return {
    headers: [translations.employeeHeader, ...dayColumns, translations.hoursHeader],
    rows: peopleRows,
  }
}

function buildRoleCalculationRows(month) {
  const priceMap = new Map()

  month.days.forEach(day => {
    day.people.forEach(assignment => {
      const approvedHours = getApprovedAssignmentHours(assignment)
      const hourlyPrice = Number(assignment.hourlyCost) || 0

      if (approvedHours <= 0 || !Number.isFinite(hourlyPrice)) {
        return
      }

      const key = String(hourlyPrice)
      const currentPrice = priceMap.get(key) || {
        totalHours: 0,
        hourlyPrice,
        totalValue: 0,
      }

      currentPrice.totalHours = Number((currentPrice.totalHours + approvedHours).toFixed(2))
      currentPrice.totalValue = Number(
        (currentPrice.totalValue + getApprovedAssignmentTotalCost(assignment)).toFixed(2),
      )
      priceMap.set(key, currentPrice)
    })
  })

  return Array.from(priceMap.values())
    .sort((left, right) => left.hourlyPrice - right.hourlyPrice)
    .map(priceRow => ({
      ...priceRow,
      calculationDisplay: `${formatGridNumber(priceRow.totalHours)}h x ${formatGridNumber(priceRow.hourlyPrice)}`,
    }))
}

function buildMonthlySummary(month) {
  return {
    totalHours: Number(month.totalHours) || 0,
    totalValue: Number(month.totalCost) || 0,
    roleRows: buildRoleCalculationRows(month),
  }
}

function buildExcelBorder(style = 'medium') {
  return {
    top: { style, color: { rgb: EXCEL_BORDER_RGB } },
    right: { style, color: { rgb: EXCEL_BORDER_RGB } },
    bottom: { style, color: { rgb: EXCEL_BORDER_RGB } },
    left: { style, color: { rgb: EXCEL_BORDER_RGB } },
  }
}

function buildExcelFill(rgb) {
  return {
    patternType: 'solid',
    fgColor: { rgb },
  }
}

function ensureWorksheetCell(worksheet, row, col) {
  const address = XLSX.utils.encode_cell({ r: row, c: col })

  if (!worksheet[address]) {
    worksheet[address] = { t: 's', v: '' }
  }

  return address
}

function applyWorksheetCellStyle(worksheet, row, col, style) {
  const address = ensureWorksheetCell(worksheet, row, col)
  const cell = worksheet[address]

  cell.s = {
    ...(cell.s || {}),
    ...style,
    font: {
      ...(cell.s?.font || {}),
      ...(style.font || {}),
    },
    fill: style.fill || cell.s?.fill,
    alignment: {
      ...(cell.s?.alignment || {}),
      ...(style.alignment || {}),
    },
    border: style.border || cell.s?.border,
  }
}

function createUniqueSheetName(baseName, usedSheetNames) {
  const normalizedBaseName =
    String(baseName || 'resumo').trim().slice(0, MAX_SHEET_NAME_LENGTH) || 'resumo'

  if (!usedSheetNames.has(normalizedBaseName)) {
    usedSheetNames.add(normalizedBaseName)
    return normalizedBaseName
  }

  let suffix = 2

  while (suffix < 1000) {
    const suffixLabel = `-${suffix}`
    const candidate = `${normalizedBaseName.slice(0, MAX_SHEET_NAME_LENGTH - suffixLabel.length)}${suffixLabel}`

    if (!usedSheetNames.has(candidate)) {
      usedSheetNames.add(candidate)
      return candidate
    }

    suffix += 1
  }

  const fallbackName = `resumo-${Date.now()}`.slice(0, MAX_SHEET_NAME_LENGTH)
  usedSheetNames.add(fallbackName)
  return fallbackName
}

function appendSummaryMonthSheet({
  workbook,
  title,
  month,
  language = 'pt',
  usedSheetNames,
}) {
  const translations = getWorkSummaryTranslations(language)
  const grid = buildMonthlyGrid(month, language)
  const summary = buildMonthlySummary(month)
  const printHeaders = grid.headers
  const totalColumnCount = printHeaders.length
  const calculationStartColumn = 25
  const monthHeaderLabel = formatExportMonthHeader(month.monthKey, language, month.label)
  const emptyMessage = translations.noDataInPeriod
  const emptyRow = Array.from({ length: totalColumnCount }, () => '')
  const dataRows = grid.rows.length > 0
    ? grid.rows.map(row => [
        row.name,
        ...row.values.map(value => formatGridNumber(value)),
        formatGridNumber(row.totalHours),
      ])
    : [[emptyMessage, ...emptyRow.slice(1)]]
  const calculationSheetRows = summary.roleRows.length > 0
    ? summary.roleRows.map(roleRow => {
        const row = [...emptyRow]
        row[calculationStartColumn] = roleRow.calculationDisplay
        row[totalColumnCount - 1] = formatGridNumber(roleRow.totalValue)
        return row
      })
    : (() => {
        const row = [...emptyRow]
        row[calculationStartColumn] = emptyMessage
        return [row]
      })()
  const totalRow = [...emptyRow]
  totalRow[calculationStartColumn] = translations.totalLabel
  totalRow[totalColumnCount - 1] = formatGridNumber(summary.totalValue)

  const monthHeaderRowIndex = 0
  const titleRowIndex = 1
  const spacerRowIndex = 2
  const headerRowIndex = 3
  const dataRowStart = 4
  const separatorRowIndex = dataRowStart + dataRows.length
  const calculationStartRow = separatorRowIndex + 1
  const calculationEndRow = calculationStartRow + calculationSheetRows.length - 1
  const totalRowIndex = calculationEndRow + 1

  const aoa = [
    [monthHeaderLabel],
    [String(title || '').trim() || translations.reportTitle],
    emptyRow,
    printHeaders,
    ...dataRows,
    emptyRow,
    ...calculationSheetRows,
    totalRow,
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(aoa)

  worksheet['!merges'] = [
    { s: { r: monthHeaderRowIndex, c: 0 }, e: { r: monthHeaderRowIndex, c: totalColumnCount - 1 } },
    { s: { r: titleRowIndex, c: 0 }, e: { r: titleRowIndex, c: totalColumnCount - 1 } },
    ...calculationSheetRows.map((_, index) => ({
      s: { r: calculationStartRow + index, c: calculationStartColumn },
      e: { r: calculationStartRow + index, c: totalColumnCount - 2 },
    })),
    {
      s: { r: totalRowIndex, c: calculationStartColumn },
      e: { r: totalRowIndex, c: totalColumnCount - 2 },
    },
  ]
  worksheet['!cols'] = [
    { wch: 34 },
    ...Array.from({ length: 31 }, () => ({ wch: 5 })),
    { wch: 10 },
  ]
  worksheet['!rows'] = Array.from({ length: totalRowIndex + 1 }, (_, index) => {
    if (index === monthHeaderRowIndex) return { hpt: 22 }
    if (index === titleRowIndex) return { hpt: 28 }
    if (index === spacerRowIndex) return { hpt: 8 }
    return undefined
  })

  const mediumBorder = buildExcelBorder('medium')

  applyWorksheetCellStyle(worksheet, monthHeaderRowIndex, 0, {
    font: { bold: true, sz: 11 },
    alignment: { horizontal: 'left', vertical: 'center' },
  })

  applyWorksheetCellStyle(worksheet, titleRowIndex, 0, {
    font: { bold: true, sz: 16 },
    alignment: { horizontal: 'center', vertical: 'center' },
  })

  for (let col = 0; col < totalColumnCount; col += 1) {
    const isWeekendHeader = col > 0 && col <= 31 && isWeekendDay(month.monthKey, Number(printHeaders[col]))

    applyWorksheetCellStyle(worksheet, headerRowIndex, col, {
      font: { bold: true, sz: 10 },
      alignment: {
        horizontal: col === 0 ? 'left' : 'center',
        vertical: 'center',
      },
      fill: buildExcelFill(isWeekendHeader ? EXCEL_WEEKEND_FILL_RGB : EXCEL_HEADER_FILL_RGB),
      border: mediumBorder,
    })
  }

  for (let row = dataRowStart; row < dataRowStart + dataRows.length; row += 1) {
    for (let col = 0; col < totalColumnCount; col += 1) {
      applyWorksheetCellStyle(worksheet, row, col, {
        font: { sz: 10 },
        alignment: {
          horizontal: col === 0 ? 'left' : 'center',
          vertical: 'center',
        },
        border: mediumBorder,
      })
    }
  }

  for (let row = calculationStartRow; row <= calculationEndRow; row += 1) {
    for (let col = calculationStartColumn; col < totalColumnCount; col += 1) {
      applyWorksheetCellStyle(worksheet, row, col, {
        font: { sz: 10, bold: col === totalColumnCount - 1 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: mediumBorder,
      })
    }
  }

  for (let col = calculationStartColumn; col < totalColumnCount; col += 1) {
    applyWorksheetCellStyle(worksheet, totalRowIndex, col, {
      font: { sz: 10, bold: true },
      alignment: {
        horizontal: col === calculationStartColumn ? 'left' : 'center',
        vertical: 'center',
      },
      fill: buildExcelFill(EXCEL_TOTAL_FILL_RGB),
      border: mediumBorder,
    })
  }

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    createUniqueSheetName(formatSheetTitle(title, month.monthKey, translations.reportTitle), usedSheetNames),
  )
}

function sortMonthsDescending(months) {
  return months.sort((left, right) => String(right.monthKey).localeCompare(String(left.monthKey)))
}

export function buildAssignmentsByMonth(
  assignments,
  { startDate, endDate, includeEmptyMonths = false, language = 'pt' } = {},
) {
  const normalizedStartDate = normalizeDateOnly(startDate)
  const normalizedEndDate = normalizeDateOnly(endDate)
  const monthMap = new Map()

  ;(Array.isArray(assignments) ? assignments : []).forEach(assignment => {
    const assignmentDate = normalizeDateOnly(assignment?.date)

    if (!assignmentDate) {
      return
    }

    if (normalizedStartDate && assignmentDate < normalizedStartDate) {
      return
    }

    if (normalizedEndDate && assignmentDate > normalizedEndDate) {
      return
    }

    const monthKey = assignmentDate.slice(0, 7)
    const currentMonth = monthMap.get(monthKey) || {
      monthKey,
      label: formatSummaryMonthLabel(monthKey, language),
      totalHours: 0,
      totalCost: 0,
      days: new Map(),
    }
    const currentDay = currentMonth.days.get(assignmentDate) || {
      date: assignmentDate,
      totalHours: 0,
      totalCost: 0,
      people: [],
    }

    const approvedHours = getApprovedAssignmentHours(assignment)
    const approvedTotalCost = getApprovedAssignmentTotalCost(assignment)

    currentMonth.totalHours += approvedHours
    currentMonth.totalCost += approvedTotalCost
    currentDay.totalHours += approvedHours
    currentDay.totalCost += approvedTotalCost
    currentDay.people.push(assignment)
    currentMonth.days.set(assignmentDate, currentDay)
    monthMap.set(monthKey, currentMonth)
  })

  if (includeEmptyMonths) {
    listMonthKeysInPeriod(normalizedStartDate, normalizedEndDate).forEach(monthKey => {
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          monthKey,
          label: formatSummaryMonthLabel(monthKey, language),
          totalHours: 0,
          totalCost: 0,
          days: new Map(),
        })
      }
    })
  }

  return sortMonthsDescending(Array.from(monthMap.values())).map(month => ({
    ...month,
    totalHours: Number(month.totalHours.toFixed(2)),
    totalCost: Number(month.totalCost.toFixed(2)),
    days: Array.from(month.days.values())
      .sort((left, right) => String(right.date).localeCompare(String(left.date)))
      .map(day => ({
        ...day,
        totalHours: Number(day.totalHours.toFixed(2)),
        totalCost: Number(day.totalCost.toFixed(2)),
        people: day.people.sort((left, right) => {
          const personLeft = left.person?.name || `Pessoa ${left.personId}`
          const personRight = right.person?.name || `Pessoa ${right.personId}`
          return personLeft.localeCompare(personRight)
        }),
      })),
  }))
}

export function buildWorkSummaryWorkbook({
  title = '',
  assignments,
  startDate,
  endDate,
  language = 'pt',
}) {
  const workbook = XLSX.utils.book_new()
  const usedSheetNames = new Set()
  const normalizedTitle = String(title || '').trim() || getWorkSummaryTranslations(language).reportTitle
  const months = buildAssignmentsByMonth(assignments, {
    startDate,
    endDate,
    includeEmptyMonths: true,
    language,
  })
  const monthsToRender =
    months.length > 0
      ? months
      : [{
          monthKey: normalizeDateOnly(startDate).slice(0, 7) || 'sem-dados',
          label: formatSummaryPeriodLabel(startDate, endDate, language),
          totalHours: 0,
          totalCost: 0,
          days: [],
        }]

  monthsToRender.forEach(month => {
    appendSummaryMonthSheet({
      workbook,
      title: normalizedTitle,
      month,
      language,
      usedSheetNames,
    })
  })

  return workbook
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getWorkSummaryDocumentBranding(source) {
  const company = source?.company || source?.work?.company || null

  return {
    mark: String(company?.documentMark || '').trim(),
    label: String(company?.documentLabel || company?.name || '').trim(),
    logoUrl: String(company?.documentLogoUrl || '').trim(),
  }
}

function formatSummaryPrintMonthHeader(monthKey, fallbackLabel = '', language = 'pt') {
  if (!monthKey || monthKey === 'Sem data') {
    return fallbackLabel || monthKey || ''
  }

  const normalizedMonth = normalizeMonthValue(monthKey)

  if (!normalizedMonth) {
    return fallbackLabel || String(monthKey || '')
  }

  const monthLabel = formatSummaryMonthLabel(normalizedMonth, language)
  return monthLabel ? monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) : monthLabel
}

export function buildWorkSummaryPrintDocument({
  title = '',
  assignments,
  startDate,
  endDate,
  language = 'pt',
  branding = null,
}) {
  const translations = getWorkSummaryTranslations(language)
  const normalizedTitle = String(title || '').trim() || translations.reportTitle
  const normalizedBranding = getWorkSummaryDocumentBranding(branding)
  const months = buildAssignmentsByMonth(assignments, {
    startDate,
    endDate,
    includeEmptyMonths: true,
    language,
  })
  const monthsToRender =
    months.length > 0
      ? months
      : [{
          monthKey: normalizeDateOnly(startDate).slice(0, 7) || 'sem-dados',
          label: formatSummaryPeriodLabel(startDate, endDate, language),
          totalHours: 0,
          totalCost: 0,
          days: [],
        }]

  const sections = monthsToRender.map(month => {
    const grid = buildMonthlyGrid(month, language)
    const summary = buildMonthlySummary(month)
    const printHeaders = ['', ...grid.headers.slice(1, 32), translations.hoursHeader]
    const monthHeaderLabel = formatSummaryPrintMonthHeader(month.monthKey, month.label, language)
    const headHtml = printHeaders
      .map((header, index) => {
        const isDayColumn = index > 0 && index <= 31
        const className = isDayColumn && isWeekendDay(month.monthKey, Number(header)) ? 'weekend' : ''
        return `<th class="${className}">${escapeHtml(header)}</th>`
      })
      .join('')

    const bodyHtml = grid.rows.length > 0
      ? grid.rows
        .map(row => {
          const rowCells = [
            row.name,
            ...row.values.map(value => formatGridNumber(value)),
            formatGridNumber(row.totalHours),
          ]

          return `<tr>${rowCells.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
        })
        .join('')
      : `<tr><td colspan="${printHeaders.length}">${escapeHtml(translations.noDataInPeriod)}</td></tr>`

    const roleCalculationRowsHtml = summary.roleRows.length > 0
      ? summary.roleRows
        .map(roleRow => `
          <div class="role-calc-row">
            <span>${escapeHtml(roleRow.calculationDisplay)}</span>
            <strong>${escapeHtml(formatGridNumber(roleRow.totalValue))}</strong>
          </div>
        `)
        .join('')
      : `<p class="role-calc-empty">${escapeHtml(translations.noDataInPeriod)}</p>`

    const brandingHtml = normalizedBranding.logoUrl
      ? `
          <div class="sheet-brand">
            <img class="sheet-brand-logo" src="${escapeHtml(normalizedBranding.logoUrl)}" alt="${escapeHtml(normalizedBranding.label || 'Marca da empresa')}" />
          </div>
        `
      : '<div class="sheet-brand-spacer"></div>'

    return `
      <section class="sheet">
        <div class="sheet-header">
          <div class="sheet-date">${escapeHtml(monthHeaderLabel)}</div>
          <h1>${escapeHtml(normalizedTitle)}</h1>
          ${brandingHtml}
        </div>
        <table>
          <thead>
            <tr>${headHtml}</tr>
          </thead>
          <tbody>
            ${bodyHtml}
          </tbody>
        </table>
        <div class="role-calc-box">
          ${roleCalculationRowsHtml}
          <div class="role-calc-total">
            <span>${escapeHtml(translations.totalLabel)}</span>
            <strong>${escapeHtml(formatGridNumber(summary.totalValue))}</strong>
          </div>
        </div>
      </section>
    `
  }).join('')

  return `
    <!doctype html>
    <html lang="pt">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(normalizedTitle)}</title>
        <style>
          @page {
            margin: 9mm 8mm 10mm;
          }
          body {
            font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            margin: 0;
            color: #17211c;
            background: #fff;
            font-size: 9.5px;
          }
          .sheet {
            padding: 14px 16px 16px;
            page-break-after: always;
          }
          .sheet:last-child {
            page-break-after: auto;
          }
          .sheet-header {
            margin-bottom: 10px;
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 10px;
          }
          .sheet-date {
            font-size: 12px;
            font-weight: 700;
            text-align: left;
            line-height: 1.2;
          }
          .sheet-brand {
            justify-self: end;
            display: flex;
            align-items: center;
            justify-content: flex-end;
          }
          .sheet-brand-logo {
            max-width: 140px;
            max-height: 42px;
            object-fit: contain;
          }
          .sheet-brand-spacer {
            min-height: 1px;
          }
          h1 {
            margin: 0;
            font-size: 20px;
            text-align: center;
            line-height: 1.15;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            page-break-inside: auto;
          }
          th, td {
            border: 2px solid #738178;
            padding: 5px 3px;
            font-size: 9.5px;
            text-align: center;
            word-break: break-word;
            line-height: 1.2;
          }
          th:first-child, td:first-child {
            text-align: left;
            width: 180px;
          }
          th:last-child,
          td:last-child {
            width: 58px;
          }
          thead th {
            background: #e4e7e2;
          }
          thead {
            display: table-header-group;
          }
          tr,
          td,
          th {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          thead th.weekend {
            background: #d7b8a6;
          }
          .role-calc-box {
            margin-top: 12px;
            margin-left: auto;
            width: calc((((100% - 238px) / 31) * 5) + 58px);
            max-width: 100%;
            border: 2px solid #738178;
            border-radius: 14px;
            overflow: hidden;
            box-sizing: border-box;
            break-inside: avoid;
            page-break-inside: avoid;
            break-before: avoid-page;
            page-break-before: avoid;
          }
          .role-calc-row,
          .role-calc-total {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 72px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .role-calc-row span,
          .role-calc-row strong,
          .role-calc-total span,
          .role-calc-total strong {
            padding: 5px 6px;
            font-size: 9.5px;
            text-align: center;
            word-break: break-word;
            line-height: 1.2;
          }
          .role-calc-row span,
          .role-calc-row strong,
          .role-calc-total span,
          .role-calc-total strong {
            border-top: 2px solid #738178;
          }
          .role-calc-row:first-child span,
          .role-calc-row:first-child strong {
            border-top: none;
          }
          .role-calc-total span:first-child {
            text-align: left;
          }
          .role-calc-total span,
          .role-calc-total strong {
            background: #f3dccf;
            font-weight: 700;
          }
          .role-calc-empty {
            margin: 0;
            padding: 10px 12px;
            font-size: 10.5px;
            line-height: 1.25;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>${sections}</body>
    </html>
  `
}

export function buildSingleWorkSummaryPrintDocument({
  work,
  workId,
  assignments,
  startDate,
  endDate,
  language = 'pt',
  summaryName = '',
}) {
  return buildWorkSummaryPrintDocument({
    title: String(summaryName || '').trim() || getWorkSummaryDisplayName({ ...work, id: work?.id ?? workId }),
    assignments: Array.isArray(assignments) ? assignments : [],
    startDate,
    endDate,
    language,
    branding: work,
  })
}

export function buildSingleWorkSummaryWorkbook({
  work,
  workId,
  assignments,
  startDate,
  endDate,
  language = 'pt',
  summaryName = '',
}) {
  return buildWorkSummaryWorkbook({
    title: String(summaryName || '').trim() || getWorkSummaryDisplayName({ ...work, id: work?.id ?? workId }),
    assignments: Array.isArray(assignments) ? assignments : [],
    startDate,
    endDate,
    language,
  })
}

export function buildWorkbookBytes(workbook) {
  return XLSX.write(workbook, {
    bookType: 'xlsx',
    cellStyles: true,
    type: 'buffer',
  })
}

export function sanitizeSummaryExportFilenameSegment(value, fallback = 'resumo') {
  const sanitized = String(value || '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\.\.+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_FILENAME_SEGMENT_LENGTH)

  if (!sanitized) {
    return fallback
  }

  return sanitized
}

export function buildSummaryExportFilename({ summaryName, startDate, endDate, extension = 'xlsx' }) {
  const namePart = sanitizeSummaryExportFilenameSegment(summaryName, 'resumo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'resumo'

  const normalizedStartDate = normalizeDateOnly(startDate) || 'inicio'
  const normalizedEndDate = normalizeDateOnly(endDate) || 'fim'
  const normalizedExtension =
    String(extension || 'xlsx')
      .trim()
      .replace(/^\.+/, '')
      .toLowerCase() || 'xlsx'

  return `${namePart}-${normalizedStartDate}-${normalizedEndDate}.${normalizedExtension}`
}
