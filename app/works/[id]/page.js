'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import EditPencilIcon, { editPencilButtonStyle } from '../../components/EditPencilIcon'
import { listWorkAssignments } from '../../../frontend/controllers/work-assignments-controller.js'
import { getWork } from '../../../frontend/controllers/works-controller.js'
import { getApprovedAssignmentHours, getApprovedAssignmentTotalCost } from '../../../lib/work-assignment-approval.js'

const pageStyle = {
  minHeight: '100vh',
  padding: '40px 24px 60px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const shellStyle = {
  maxWidth: '1180px',
  margin: '0 auto',
  display: 'grid',
  gap: '24px',
}

const heroPanelStyle = {
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--vp-module-hero)',
  border: '1px solid var(--vp-module-hero-border)',
  borderRadius: '32px',
  padding: '24px',
  boxShadow: 'var(--vp-hero-shadow-strong)',
  color: '#ffffff',
  '--vp-text-muted': 'var(--vp-hero-text-muted)',
  '--vp-text-soft': 'var(--vp-hero-text-soft)',
}

const panelStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-panel)',
}

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '14px',
}

const statCardStyle = {
  borderRadius: '20px',
  padding: '18px',
  background: 'var(--vp-stat-surface)',
  border: '1px solid var(--vp-stat-border)',
  boxShadow: 'var(--vp-stat-shadow)',
}

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'var(--vp-overlay)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  zIndex: 50,
}

const modalCardStyle = {
  width: 'min(680px, 100%)',
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  background: 'var(--vp-surface-soft-strong)',
  border: '1px solid var(--vp-border)',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-modal)',
}

const secondaryButtonStyle = {
  border: '1px solid var(--vp-accent)',
  borderRadius: '999px',
  padding: '12px 18px',
  background: 'transparent',
  color: 'var(--vp-accent)',
  fontWeight: 700,
  cursor: 'pointer',
}

const primaryButtonStyle = {
  border: 'none',
  borderRadius: '999px',
  padding: '12px 18px',
  background: 'var(--vp-accent)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
}

const selectStyle = {
  width: '100%',
  marginTop: '8px',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface-muted)',
  color: 'var(--vp-text)',
  fontSize: '14px',
}

const inputStyle = selectStyle

const dangerButtonStyle = {
  border: '1px solid #b42318',
  borderRadius: '999px',
  padding: '12px 18px',
  background: 'transparent',
  color: '#b42318',
  fontWeight: 700,
  cursor: 'pointer',
}

const clientButtonStyle = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'var(--vp-accent)',
  fontSize: 'inherit',
  fontFamily: 'inherit',
  fontWeight: 700,
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
}

const workStatusLabels = {
  planned: 'Planeada',
  in_progress: 'Em curso',
  paused: 'Em pausa',
  completed: 'Concluída',
}

function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateString

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

function getWorkStatusLabel(status) {
  return workStatusLabels[String(status || '').trim()] || workStatusLabels.planned
}

function formatExportMonthHeader(monthKey, fallbackLabel = '') {
  if (!monthKey || monthKey === 'Sem data') {
    return fallbackLabel || monthKey || ''
  }

  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) {
    return fallbackLabel || monthKey
  }

  const frenchLabel = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))

  return `Mois: ${frenchLabel}`
}

function formatPdfMonthHeader(monthKey, fallbackLabel = '') {
  const monthHeader = formatExportMonthHeader(monthKey, fallbackLabel)
  const normalizedLabel = monthHeader.replace(/^Mois:\s*/i, '')

  if (!normalizedLabel) {
    return monthHeader
  }

  return normalizedLabel.charAt(0).toUpperCase() + normalizedLabel.slice(1)
}

function formatSheetName(work, monthKey) {
  const workDisplayName = getWorkExportDisplayName(work, 'obra')
  const baseName = `${work?.number || workDisplayName || 'obra'}-${monthKey}`
  return baseName.slice(0, 31)
}

function getWorkExportDisplayName(work, fallback = 'Obra') {
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

function getWorkDocumentBranding(work) {
  const company = work?.company
  return {
    mark: String(company?.documentMark || '').trim(),
    label: String(company?.documentLabel || company?.name || '').trim(),
    logoUrl: String(company?.documentLogoUrl || '').trim(),
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function isWeekendDay(monthKey, dayNumber) {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month || !dayNumber) return false

  const date = new Date(year, month - 1, dayNumber)
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6
}

function buildMonthlyGrid(month) {
  const peopleMap = new Map()
  const dayColumns = Array.from({ length: 31 }, (_, index) => index + 1)

  month.days.forEach(day => {
    const dayNumber = Number.parseInt(String(day.date).slice(8, 10), 10)
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31) return

    day.people.forEach(assignment => {
      const personKey = assignment.person?.id || assignment.personId
      const personName = assignment.person?.name || `Pessoa ${assignment.personId}`
      const currentPerson = peopleMap.get(personKey) || {
        name: personName,
        values: Array(31).fill(null),
        totalHours: 0,
        totalValue: 0,
        hourlyCosts: new Set(),
      }

      const assignmentHours = getApprovedAssignmentHours(assignment)
      const assignmentHourlyCost = Number(assignment.hourlyCost) || 0
      const assignmentTotalCost = getApprovedAssignmentTotalCost(assignment)
      const nextValue = (currentPerson.values[dayNumber - 1] ?? 0) + assignmentHours

      currentPerson.values[dayNumber - 1] = Number(nextValue.toFixed(2))
      currentPerson.totalHours = Number((currentPerson.totalHours + assignmentHours).toFixed(2))
      currentPerson.totalValue = Number((currentPerson.totalValue + assignmentTotalCost).toFixed(2))
      currentPerson.hourlyCosts.add(assignmentHourlyCost)
      peopleMap.set(personKey, currentPerson)
    })
  })

  const peopleRows = Array.from(peopleMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(person => {
      const hourlyCosts = Array.from(person.hourlyCosts).filter(value => !Number.isNaN(value))

      return {
        name: person.name,
        values: person.values.map(value => value ?? ''),
        totalHours: person.totalHours,
        hourlyPrice: hourlyCosts.length === 1 ? hourlyCosts[0] : null,
        totalValue: person.totalValue,
      }
    })
    .filter(person => person.totalHours > 0 || person.totalValue > 0)

  return {
    headers: ['Trabalhador', ...dayColumns, 'Horas', 'Preço', 'Total'],
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
      currentPrice.totalValue = Number((currentPrice.totalValue + getApprovedAssignmentTotalCost(assignment)).toFixed(2))
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
  const totalHours = Number(month.totalHours) || 0
  const totalValue = Number(month.totalCost) || 0

  return {
    totalHours,
    totalValue,
    roleRows: buildRoleCalculationRows(month),
  }
}

function formatGridNumber(value) {
  if (value === null || value === undefined || value === '') return ''
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
}

function formatGridPrice(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Vários'
  }

  return formatGridNumber(Number(value))
}

const EXCEL_BORDER_RGB = '738178'
const EXCEL_HEADER_FILL_RGB = 'E4E7E2'
const EXCEL_WEEKEND_FILL_RGB = 'D7B8A6'
const EXCEL_TOTAL_FILL_RGB = 'F3DCCF'

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

function buildExcelDocument(months, work, workId) {
  const worksheets = months.map(month => {
    const grid = buildMonthlyGrid(month)
    const summary = buildMonthlySummary(month)
    const headerCells = grid.headers
      .map((header, index) => {
        const isDayColumn = index > 0 && index <= 31
        const styleId = isDayColumn && isWeekendDay(month.monthKey, Number(header)) ? 'headerWeekend' : 'header'
        return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`
      })
      .join('')

    const bodyRows = grid.rows.length > 0
      ? grid.rows.map(row => {
        const rowCells = [
          row.name,
          ...row.values.map(value => formatGridNumber(value)),
          formatGridNumber(row.totalHours),
          formatGridPrice(row.hourlyPrice),
          formatGridNumber(row.totalValue),
        ]

        const cells = rowCells.map((cell, index) => {
          const styleId = index === 0 ? 'nameCell' : 'valueCell'
          const isNumericColumn = (index >= 1 && index <= 31) || index === 32 || index === 34
          const type = isNumericColumn && cell !== '' ? 'Number' : 'String'
          return `<Cell ss:StyleID="${styleId}"><Data ss:Type="${type}">${escapeXml(cell)}</Data></Cell>`
        }).join('')

        return `<Row>${cells}</Row>`
      }).join('')
      : `<Row><Cell ss:StyleID="emptyCell"><Data ss:Type="String">Sem registos para este mês.</Data></Cell></Row>`

    const summaryRows = `
      <Row ss:Height="8"/>
      <Row>
        <Cell ss:MergeAcross="25"/>
        <Cell ss:MergeAcross="3" ss:StyleID="summaryLabel"><Data ss:Type="String">Total horas</Data></Cell>
        <Cell ss:StyleID="summaryValue"><Data ss:Type="Number">${summary.totalHours}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="25"/>
        <Cell ss:MergeAcross="3" ss:StyleID="summaryLabel"><Data ss:Type="String">Preço hora</Data></Cell>
        <Cell ss:StyleID="summaryValue"><Data ss:Type="Number">${summary.hourlyPrice}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="23"/>
        <Cell ss:MergeAcross="5" ss:StyleID="summaryTotalLabel"><Data ss:Type="String">Valor total EUR</Data></Cell>
        <Cell ss:MergeAcross="1" ss:StyleID="summaryTotal"><Data ss:Type="Number">${summary.totalValue}</Data></Cell>
      </Row>
    `

    return `
      <Worksheet ss:Name="${escapeXml(formatSheetName(work, month.monthKey))}">
        <Table>
          <Column ss:Width="220"/>
          ${Array.from({ length: 31 }, () => '<Column ss:Width="24"/>').join('')}
          <Row ss:Height="26">
            <Cell ss:StyleID="dateTitle"><Data ss:Type="String">${escapeXml(`Data: ${month.label}`)}</Data></Cell>
            <Cell ss:MergeAcross="30" ss:StyleID="workTitle"><Data ss:Type="String">${escapeXml(work?.name || `Obra ${workId}`)}</Data></Cell>
          </Row>
          <Row ss:Height="8"/>
          <Row>${headerCells}</Row>
          ${bodyRows}
          ${summaryRows}
        </Table>
      </Worksheet>
    `
  }).join('')

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="dateTitle">
      <Font ss:Bold="1" ss:Size="12"/>
      <Alignment ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="workTitle">
      <Font ss:Bold="1" ss:Size="16"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#E4E7E2" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="headerWeekend">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#D7B8A6" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="nameCell">
      <Font ss:Bold="1"/>
      <Alignment ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="valueCell">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="emptyCell">
      <Alignment ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="summaryLabel">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Interior ss:Color="#EEF3EF" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="summaryValue">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="summaryTotal">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#F3DCCF" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="summaryTotalLabel">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Interior ss:Color="#F3DCCF" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
  </Styles>
  ${worksheets}
</Workbook>`
}

function buildPrintDocument(months, work) {
  const sections = months.map(month => {
    const grid = buildMonthlyGrid(month)
    const summary = buildMonthlySummary(month, work)
    const headHtml = grid.headers
      .map((header, index) => {
        const className = index > 0 && isWeekendDay(month.monthKey, Number(header)) ? 'weekend' : ''
        return `<th class="${className}">${escapeHtml(header)}</th>`
      })
      .join('')
    const bodyHtml = grid.rows.length > 0
      ? grid.rows
        .map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('')
      : `<tr><td colspan="${grid.headers.length}">Sem registos para este mês.</td></tr>`

    return `
      <section class="sheet">
        <div class="sheet-header">
          <div class="sheet-date">Data: ${escapeHtml(month.label)}</div>
          <h1>${escapeHtml(work?.name || 'Obra')}</h1>
          <div class="sheet-spacer"></div>
        </div>
        <table>
          <thead>
            <tr>${headHtml}</tr>
          </thead>
          <tbody>
            ${bodyHtml}
          </tbody>
        </table>
        <div class="summary-box">
          <div class="summary-row">
            <span>Total horas</span>
            <strong>${escapeHtml(summary.totalHours)}</strong>
          </div>
          <div class="summary-row">
            <span>Preço hora</span>
            <strong>${escapeHtml(summary.hourlyPrice)}</strong>
          </div>
          <div class="summary-row total">
            <span>Valor total EUR</span>
            <strong>${escapeHtml(summary.totalValue)}</strong>
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
        <title>${escapeHtml(work?.name || 'Obra')}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            color: #17211c;
            background: #fff;
          }
          .sheet {
            padding: 24px;
            page-break-after: always;
          }
          .sheet:last-child {
            page-break-after: auto;
          }
          .sheet-header {
            margin-bottom: 16px;
            display: grid;
            grid-templateColumns: 1fr auto 1fr;
            alignItems: center;
            gap: 12px;
          }
          .sheet-date {
            font-size: 14px;
            font-weight: 700;
            text-align: left;
          }
          .sheet-spacer {
            min-height: 1px;
          }
          h1 {
            margin: 0;
            font-size: 24px;
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 2px solid #738178;
            padding: 6px 3px;
            font-size: 10px;
            text-align: center;
            word-break: break-word;
          }
          th:first-child, td:first-child {
            text-align: left;
            width: 180px;
          }
          thead th {
            background: #e4e7e2;
          }
          thead th.weekend {
            background: #d7b8a6;
          }
          .summary-box {
            width: 260px;
            margin-top: 16px;
            margin-left: auto;
          }
          .summary-row {
            display: grid;
            grid-template-columns: 1fr 110px;
          }
          .summary-row span,
          .summary-row strong {
            border: 2px solid #738178;
            padding: 8px 10px;
            font-size: 11px;
          }
          .summary-row strong {
            text-align: center;
          }
          .summary-row.total span,
          .summary-row.total strong {
            background: #f3dccf;
            font-weight: 700;
          }
        </style>
      </head>
      <body>${sections}</body>
    </html>
  `
}

function buildWorkExportExcelDocument(months, work, workId) {
  const worksheets = months.map(month => {
    const grid = buildMonthlyGrid(month)
    const summary = buildMonthlySummary(month)
    const headerCells = grid.headers
      .map((header, index) => {
        const isDayColumn = index > 0 && index <= 31
        const styleId = isDayColumn && isWeekendDay(month.monthKey, Number(header)) ? 'headerWeekend' : 'header'
        return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`
      })
      .join('')

    const bodyRows = grid.rows.length > 0
      ? grid.rows.map(row => {
        const rowCells = [
          row.name,
          ...row.values.map(value => formatGridNumber(value)),
          formatGridNumber(row.totalHours),
          formatGridPrice(row.hourlyPrice),
          formatGridNumber(row.totalValue),
        ]

        const cells = rowCells.map((cell, index) => {
          const styleId = index === 0 ? 'nameCell' : 'valueCell'
          const isNumericColumn = (index >= 1 && index <= 31) || index === 32 || index === 34
          const type = isNumericColumn && cell !== '' ? 'Number' : 'String'
          return `<Cell ss:StyleID="${styleId}"><Data ss:Type="${type}">${escapeXml(cell)}</Data></Cell>`
        }).join('')

        return `<Row>${cells}</Row>`
      }).join('')
      : `<Row><Cell ss:StyleID="emptyCell"><Data ss:Type="String">Sem registos para este mês.</Data></Cell></Row>`

    const summaryRows = `
      <Row ss:Height="8"/>
      <Row>
        <Cell ss:MergeAcross="28"/>
        <Cell ss:MergeAcross="2" ss:StyleID="summaryLabel"><Data ss:Type="String">Total horas</Data></Cell>
        <Cell ss:StyleID="summaryValue"><Data ss:Type="Number">${summary.totalHours}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="27"/>
        <Cell ss:MergeAcross="3" ss:StyleID="summaryTotalLabel"><Data ss:Type="String">Valor total EUR</Data></Cell>
        <Cell ss:StyleID="summaryTotal"><Data ss:Type="Number">${summary.totalValue}</Data></Cell>
      </Row>
    `

    return `
      <Worksheet ss:Name="${escapeXml(formatSheetName(work, month.monthKey))}">
        <Table>
          <Column ss:Width="220"/>
          ${Array.from({ length: 31 }, () => '<Column ss:Width="24"/>').join('')}
          <Column ss:Width="52"/>
          <Column ss:Width="60"/>
          <Column ss:Width="72"/>
          <Row ss:Height="26">
            <Cell ss:StyleID="dateTitle"><Data ss:Type="String">${escapeXml(`Data: ${month.label}`)}</Data></Cell>
            <Cell ss:MergeAcross="33" ss:StyleID="workTitle"><Data ss:Type="String">${escapeXml(work?.name || `Obra ${workId}`)}</Data></Cell>
          </Row>
          <Row ss:Height="8"/>
          <Row>${headerCells}</Row>
          ${bodyRows}
          ${summaryRows}
        </Table>
      </Worksheet>
    `
  }).join('')

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="dateTitle">
      <Font ss:Bold="1" ss:Size="12"/>
      <Alignment ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="workTitle">
      <Font ss:Bold="1" ss:Size="16"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#E4E7E2" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="headerWeekend">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#D7B8A6" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="nameCell">
      <Font ss:Bold="1"/>
      <Alignment ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="valueCell">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="emptyCell">
      <Alignment ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="summaryLabel">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Interior ss:Color="#EEF3EF" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="summaryValue">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="summaryTotal">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#F3DCCF" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
    <Style ss:ID="summaryTotalLabel">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Interior ss:Color="#F3DCCF" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
      </Borders>
    </Style>
  </Styles>
  ${worksheets}
</Workbook>`
}

function buildWorkExportExcelWorkbook(months, work, workId) {
  const workbook = XLSX.utils.book_new()
  const branding = getWorkDocumentBranding(work)
  const workDisplayName = getWorkExportDisplayName(work, `Obra ${workId}`)
  const mediumBorder = buildExcelBorder('medium')

  months.forEach(month => {
    const grid = buildMonthlyGrid(month)
    const summary = buildMonthlySummary(month)
    const printHeaders = ['', ...grid.headers.slice(1, 32), 'Horas']
    const totalColumnCount = printHeaders.length
    const calculationStartColumn = 25
    const monthHeaderLabel = formatExportMonthHeader(month.monthKey, month.label)
    const emptyRow = Array.from({ length: totalColumnCount }, () => '')
    const dataRows = grid.rows.length > 0
      ? grid.rows.map(row => [
          row.name,
          ...row.values.map(value => formatGridNumber(value)),
          formatGridNumber(row.totalHours),
        ])
      : [['Sem registos para este mês.']]
    const calculationRows = summary.roleRows.length > 0
      ? summary.roleRows.map(roleRow => [
          roleRow.calculationDisplay,
          formatGridNumber(roleRow.totalValue),
        ])
      : [['Sem horas aprovadas para calcular neste mês.', '']]

    const normalizedDataRows = grid.rows.length > 0
      ? dataRows
      : [['Sem registos para este mês.', ...emptyRow.slice(1)]]
    const calculationSheetRows = summary.roleRows.length > 0
      ? summary.roleRows.map(roleRow => {
          const row = [...emptyRow]
          row[calculationStartColumn] = roleRow.calculationDisplay
          row[totalColumnCount - 1] = formatGridNumber(roleRow.totalValue)
          return row
        })
      : (() => {
          const row = [...emptyRow]
          row[calculationStartColumn] = 'Sem horas aprovadas para calcular neste mês.'
          return [row]
        })()
    const totalRow = [...emptyRow]
    totalRow[calculationStartColumn] = 'TOTAL'
    totalRow[totalColumnCount - 1] = formatGridNumber(summary.totalValue)

    const aoa = [
      [monthHeaderLabel],
      [workDisplayName],
      emptyRow,
      printHeaders,
      ...normalizedDataRows,
      emptyRow,
      ...calculationSheetRows,
      totalRow,
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(aoa)
    const dataRowStart = 4
    const dataRowCount = normalizedDataRows.length
    const separatorRowIndex = dataRowStart + dataRowCount
    const calculationStartRow = separatorRowIndex + 1
    const calculationEndRow = calculationStartRow + calculationSheetRows.length - 1
    const totalRowIndex = calculationEndRow + 1

    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalColumnCount - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalColumnCount - 1 } },
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
    worksheet['!rows'] = [
      { hpt: 22 },
      { hpt: 28 },
    ]

    if (worksheet.A2) {
      worksheet.A2.s = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: 'center', vertical: 'center' },
      }
    }

    applyWorksheetCellStyle(worksheet, 0, 0, {
      font: { bold: true, sz: 11 },
      alignment: { horizontal: 'left', vertical: 'center' },
    })

    applyWorksheetCellStyle(worksheet, 1, 0, {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: 'center', vertical: 'center' },
    })

    for (let col = 0; col < totalColumnCount; col += 1) {
      const isWeekendHeader = col > 0 && col <= 31 && isWeekendDay(month.monthKey, Number(printHeaders[col]))
      applyWorksheetCellStyle(worksheet, 3, col, {
        font: { bold: true, sz: 10 },
        alignment: {
          horizontal: col === 0 ? 'left' : 'center',
          vertical: 'center',
        },
        fill: buildExcelFill(isWeekendHeader ? EXCEL_WEEKEND_FILL_RGB : EXCEL_HEADER_FILL_RGB),
        border: mediumBorder,
      })
    }

    for (let row = dataRowStart; row < dataRowStart + dataRowCount; row += 1) {
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
          alignment: {
            horizontal: 'center',
            vertical: 'center',
          },
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

    XLSX.utils.book_append_sheet(workbook, worksheet, formatSheetName(work, month.monthKey))
  })

  return workbook
}

function buildWorkExportPrintDocument(months, work) {
  const branding = getWorkDocumentBranding(work)
  const workDisplayName = getWorkExportDisplayName(work, 'Obra')
  const sections = months.map(month => {
    const grid = buildMonthlyGrid(month)
    const summary = buildMonthlySummary(month)
    const printHeaders = ['', ...grid.headers.slice(1, 32), 'Horas']
    const monthHeaderLabel = formatPdfMonthHeader(month.monthKey, month.label)
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
      : `<tr><td colspan="${printHeaders.length}">Sem registos para este mês.</td></tr>`

    const roleCalculationRowsHtml = summary.roleRows.length > 0
      ? summary.roleRows
        .map(
          roleRow => `
            <div class="role-calc-row">
              <span>${escapeHtml(roleRow.calculationDisplay)}</span>
              <strong>${escapeHtml(formatGridNumber(roleRow.totalValue))}</strong>
            </div>
          `,
        )
        .join('')
      : '<p class="role-calc-empty">Sem horas aprovadas para calcular neste mês.</p>'

    const brandingHtml = branding.logoUrl
      ? `
          <div class="sheet-brand">
            <img class="sheet-brand-logo" src="${escapeHtml(branding.logoUrl)}" alt="${escapeHtml(branding.label || 'Marca da empresa')}" />
          </div>
        `
      : '<div class="sheet-brand-spacer"></div>'

    return `
      <section class="sheet">
        <div class="sheet-header">
          <div class="sheet-date">${escapeHtml(monthHeaderLabel)}</div>
          <h1>${escapeHtml(workDisplayName)}</h1>
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
            <span>TOTAL</span>
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
        <title>${escapeHtml(workDisplayName)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            color: #17211c;
            background: #fff;
          }
          .sheet {
            padding: 24px;
            page-break-after: always;
          }
          .sheet:last-child {
            page-break-after: auto;
          }
          .sheet-header {
            margin-bottom: 16px;
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 12px;
          }
          .sheet-date {
            font-size: 14px;
            font-weight: 700;
            text-align: left;
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
            font-size: 24px;
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 2px solid #738178;
            padding: 6px 3px;
            font-size: 10px;
            text-align: center;
            word-break: break-word;
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
          thead th.weekend {
            background: #d7b8a6;
          }
          .role-calc-box {
            margin-top: 18px;
            margin-left: auto;
            width: calc((((100% - 238px) / 31) * 5) + 58px);
            max-width: 100%;
            border: 2px solid #738178;
            border-radius: 16px;
            overflow: hidden;
            box-sizing: border-box;
          }
          .role-calc-row,
          .role-calc-total {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 72px;
          }
          .role-calc-row span,
          .role-calc-row strong,
          .role-calc-total span,
          .role-calc-total strong {
            padding: 6px 6px;
            font-size: 10px;
            text-align: center;
            word-break: break-word;
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
            padding: 12px 14px;
            font-size: 11px;
          }
        </style>
      </head>
      <body>${sections}</body>
    </html>
  `
}

export default function WorkDetailPage() {
  const params = useParams()
  const workId = Array.isArray(params.id) ? params.id[0] : params.id
  const [work, setWork] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [showClientModal, setShowClientModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedExportMonth, setSelectedExportMonth] = useState('')
  const [exporting, setExporting] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workId) {
      return
    }

    async function loadData() {
      setLoading(true)
      setError('')

      try {
      const [workData, assignmentsData] = await Promise.all([
        getWork(workId, 'Erro ao carregar obra'),
        listWorkAssignments({ workId }, 'Erro ao carregar afetações'),
      ])

      setWork(workData)
      setAssignments(assignmentsData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [workId])

  const totals = useMemo(() => {
    const totalHours = assignments.reduce((sum, assignment) => sum + getApprovedAssignmentHours(assignment), 0)
    const totalCost = assignments.reduce((sum, assignment) => sum + getApprovedAssignmentTotalCost(assignment), 0)

    return {
      totalHours,
      totalCost: Number(totalCost.toFixed(2)),
    }
  }, [assignments])

  const assignmentsByMonth = useMemo(() => {
    const monthMap = new Map()

    assignments.forEach(assignment => {
      const monthKey = assignment.date ? String(assignment.date).slice(0, 7) : 'Sem data'
      const currentMonth = monthMap.get(monthKey) || {
        monthKey,
        label: monthKey === 'Sem data' ? monthKey : formatMonthLabel(monthKey),
        totalHours: 0,
        totalCost: 0,
        days: new Map(),
      }
      const dayKey = assignment.date || 'Sem data'
      const currentDay = currentMonth.days.get(dayKey) || {
        date: dayKey,
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
      currentMonth.days.set(dayKey, currentDay)
      monthMap.set(monthKey, currentMonth)
    })

    return Array.from(monthMap.values())
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      .map(month => ({
        ...month,
        totalHours: Number(month.totalHours.toFixed(2)),
        totalCost: Number(month.totalCost.toFixed(2)),
        days: Array.from(month.days.values())
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(day => ({
            ...day,
            totalHours: Number(day.totalHours.toFixed(2)),
            totalCost: Number(day.totalCost.toFixed(2)),
            people: day.people.sort((a, b) => {
              const personA = a.person?.name || `Pessoa ${a.personId}`
              const personB = b.person?.name || `Pessoa ${b.personId}`
              return personA.localeCompare(personB)
            }),
          })),
      }))
  }, [assignments])

  const client = work?.client ?? null
  const hasSpecialPricingCases = Object.keys(work?.specialPersonHourlyCosts || {}).length > 0

  useEffect(() => {
    if (assignmentsByMonth.length === 0) {
      setSelectedExportMonth('')
      return
    }

    setSelectedExportMonth(current =>
      assignmentsByMonth.some(month => month.monthKey === current)
        ? current
        : assignmentsByMonth[0].monthKey,
    )
  }, [assignmentsByMonth])

  function openClientModal() {
    if (!client) return
    setShowClientModal(true)
  }

  function closeClientModal() {
    setShowClientModal(false)
  }

  function openExportModal() {
    if (assignmentsByMonth.length === 0) return
    setSelectedExportMonth(current => current || assignmentsByMonth[0].monthKey)
    setShowExportModal(true)
  }

  function closeExportModal() {
    if (exporting) return
    setShowExportModal(false)
  }

  function getSelectedExportMonths() {
    return assignmentsByMonth.filter(month => month.monthKey === selectedExportMonth)
  }

  async function exportExcel() {
    const monthsToExport = getSelectedExportMonths()
    if (!work || monthsToExport.length === 0) return

    setExporting('excel')

    try {
      const workbook = buildWorkExportExcelWorkbook(monthsToExport, work, workId)
      const workbookBytes = XLSX.write(workbook, {
        bookType: 'xlsx',
        cellStyles: true,
        type: 'array',
      })
      const blob = new Blob([workbookBytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `obra-${work.number || workId}-${selectedExportMonth}-mapa.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setExporting('')
    }
  }

  function exportPdf() {
    const monthsToExport = getSelectedExportMonths()
    if (!work || monthsToExport.length === 0) return

    setExporting('pdf')

    try {
      const html = buildWorkExportPrintDocument(monthsToExport, work)
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const iframe = document.createElement('iframe')

      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'

      iframe.onload = () => {
        const frameWindow = iframe.contentWindow
        if (!frameWindow) {
          URL.revokeObjectURL(url)
          document.body.removeChild(iframe)
          return
        }

        frameWindow.focus()
        frameWindow.print()

        window.setTimeout(() => {
          URL.revokeObjectURL(url)
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 1000)
      }

      iframe.src = url
      document.body.appendChild(iframe)
    } finally {
      setExporting('')
    }
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroPanelStyle}>
          <Link
            href={work?.clientId ? `/works/client/${work.clientId}` : '/works'}
            style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}
          >
            {work?.clientId ? 'Voltar ao cliente' : 'Voltar à gestão de obra'}
          </Link>

          {loading && <p style={{ marginTop: '18px' }}>A carregar obra...</p>}
          {error && <p style={{ marginTop: '18px', color: '#b42318' }}>{error}</p>}

          {!loading && !error && work && (
            <>
              <h1 style={{ margin: '10px 0 12px', fontSize: '44px', lineHeight: 1.05 }}>
                {work.name}
              </h1>

            </>
          )}
        </section>

        {!loading && !error && work && (
          <>
            <section style={statGridStyle}>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Estado</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{getWorkStatusLabel(work.status)}</div>
              </article>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Preço hora por defeito</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{work.defaultHourlyCost || 0}/h</div>
              </article>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Horas totais</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{totals.totalHours}</div>
              </article>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Custo acumulado</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{totals.totalCost}</div>
              </article>
            </section>

            <section style={{ ...panelStyle, position: 'relative' }}>
              <h2 style={{ marginTop: 0 }}>Informação da obra</h2>
              <Link
                href={`/works?edit=${work.id}`}
                style={{ ...editPencilButtonStyle, position: 'absolute', top: '22px', right: '22px' }}
                title="Editar obra"
                aria-label="Editar obra"
              >
                <EditPencilIcon />
              </Link>
              <div style={{ display: 'grid', gap: '10px', color: 'var(--vp-text-muted)' }}>
                <p style={{ margin: 0 }}>
                  <strong>Cliente:</strong>{' '}
                  {client ? (
                    <button type="button" onClick={openClientModal} style={clientButtonStyle}>
                      {client.name}
                    </button>
                  ) : (
                    'Sem cliente'
                  )}
                </p>
                <p style={{ margin: 0 }}><strong>Localização:</strong> {work.location || 'Sem localização'}</p>
                <p style={{ margin: 0 }}><strong>Data de começo:</strong> {work.startDate || 'Sem data'}</p>
                <p style={{ margin: 0 }}><strong>Data de finalização:</strong> {work.endDate || 'Em aberto'}</p>
                <p style={{ margin: 0 }}><strong>Orçamento:</strong> {work.budget || 0}</p>
                <p style={{ margin: 0 }}><strong>Notas:</strong> {work.notes || 'Sem notas'}</p>
              </div>
            </section>

            {hasSpecialPricingCases && (
              <section style={panelStyle}>
                <Link
                  href={`/works/${work.id}/special-pricing`}
                  style={{
                    ...primaryButtonStyle,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                  }}
                >
                  Preços especiais por pessoa
                </Link>
              </section>
            )}

            <section style={panelStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                <h2 style={{ margin: 0 }}>Afetações desta obra por mês</h2>
                {assignments.length > 0 && (
                  <button type="button" onClick={openExportModal} style={primaryButtonStyle}>
                    Exportar
                  </button>
                )}
              </div>
              {assignments.length === 0 && <p>Sem afetações registadas para esta obra.</p>}
              {assignments.length > 0 && (
                <div style={{ display: 'grid', gap: '12px' }}>

                  {assignmentsByMonth.map(month => (
                    <details
                      key={month.monthKey}
                      style={{
                        border: '1px solid var(--vp-border)',
                        borderRadius: '18px',
                        padding: '16px',
                        background: 'var(--vp-surface)',
                      }}
                    >
                      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                        <span>
                          {month.label} | {month.totalHours}h | Total {month.totalCost}
                        </span>
                      </summary>

                      <div style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
                        {month.days.map(day => (
                          <article
                            key={day.date}
                            style={{
                              border: '1px solid var(--vp-border)',
                              borderRadius: '14px',
                              padding: '14px',
                              background: 'var(--vp-surface-muted)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                              <strong>{day.date === 'Sem data' ? day.date : formatDateLabel(day.date)}</strong>
                              <span style={{ color: 'var(--vp-text-muted)' }}>
                                {day.totalHours}h | Total {day.totalCost}
                              </span>
                            </div>

                            <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
                              {day.people.map(assignment => (
                                <div
                                  key={assignment.id}
                                  style={{
                                    border: '1px solid var(--vp-border)',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    background: 'var(--vp-surface)',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                    <strong>{assignment.person?.name || `Pessoa ${assignment.personId}`}</strong>
                                    <strong>{assignment.hours}h</strong>
                                  </div>
                                  <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>
                                    {assignment.hourlyCost}/h | Total {getApprovedAssignmentTotalCost(assignment)}
                                  </p>
                                  {assignment.notes && <p style={{ margin: '6px 0 0', color: 'var(--vp-text-soft)' }}>{assignment.notes}</p>}
                                </div>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {showClientModal && client && (
        <div style={modalBackdropStyle} onClick={closeClientModal}>
          <section style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: 'var(--vp-text-soft)' }}>
                  Cliente associado
                </p>
                <h2 style={{ margin: '10px 0 0', fontSize: '34px', lineHeight: 1.1 }}>
                  {client.name}
                </h2>
              </div>
              <button type="button" onClick={closeClientModal} style={secondaryButtonStyle}>
                Fechar
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px', marginTop: '22px', color: 'var(--vp-text-muted)' }}>
              <p style={{ margin: 0 }}><strong>NIF:</strong> {client.vatNumber || 'Sem NIF'}</p>
              <p style={{ margin: 0 }}><strong>Contacto:</strong> {client.contactName || 'Sem contacto'}</p>
              <p style={{ margin: 0 }}><strong>Email:</strong> {client.email || 'Sem email'}</p>
              <p style={{ margin: 0 }}><strong>Telefone:</strong> {client.phone || 'Sem telefone'}</p>
              <p style={{ margin: 0 }}><strong>Notas:</strong> {client.notes || 'Sem notas'}</p>
            </div>
          </section>
        </div>
      )}


      {showExportModal && (
        <div style={modalBackdropStyle} onClick={closeExportModal}>
          <section style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: 'var(--vp-text-soft)' }}>
                  Exportação
                </p>
                <h2 style={{ margin: '10px 0 0', fontSize: '34px', lineHeight: 1.1 }}>
                  Escolher mês
                </h2>
              </div>
              <button type="button" onClick={closeExportModal} style={secondaryButtonStyle} disabled={Boolean(exporting)}>
                Fechar
              </button>
            </div>

            <div style={{ display: 'grid', gap: '18px', marginTop: '22px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>
                Mês
                <select
                  value={selectedExportMonth}
                  onChange={(event) => setSelectedExportMonth(event.target.value)}
                  style={selectStyle}
                  disabled={Boolean(exporting)}
                >
                  {assignmentsByMonth.map(month => (
                    <option key={month.monthKey} value={month.monthKey}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                <button type="button" onClick={exportExcel} style={secondaryButtonStyle} disabled={exporting === 'excel' || !selectedExportMonth}>
                  {exporting === 'excel' ? 'A exportar Excel...' : 'Exportar Excel'}
                </button>
                <button type="button" onClick={exportPdf} style={secondaryButtonStyle} disabled={exporting === 'pdf' || !selectedExportMonth}>
                  {exporting === 'pdf' ? 'A exportar PDF...' : 'Exportar PDF'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
