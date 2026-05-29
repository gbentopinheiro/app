'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import EditPencilIcon, { editPencilButtonStyle } from '../components/EditPencilIcon'
import { createProtectedPayload } from '../../lib/browser-protected-payload.js'
import { getApprovedAssignmentHours } from '../../lib/work-assignment-approval.js'
import {
  ROLE_ADMIN,
  ROLE_CARPINTEIRO,
  ROLE_CHEF_PRIMEIRA,
  ROLE_CHEF_SEGUNDA,
  ROLE_FERRAJEIRO,
  ROLE_GRUISTA,
  ROLE_RESPONSAVEL,
  ROLE_TROLHA,
  getRoleLabel,
  isWorkerRole,
  roleRequiresAppAccess,
  roleUsesWorkScope,
} from '../../lib/roles.js'

const pageStyle = {
  minHeight: '100vh',
  padding: '40px 24px 60px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const shellStyle = {
  maxWidth: '1240px',
  margin: '0 auto',
  display: 'grid',
  gap: '24px',
}

const heroStyle = {
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--vp-module-hero)',
  border: '1px solid var(--vp-module-hero-border)',
  borderRadius: '32px',
  padding: '28px',
  boxShadow: 'var(--vp-hero-shadow-strong)',
  color: '#ffffff',
  '--vp-text-muted': 'var(--vp-hero-text-muted)',
  '--vp-text-soft': 'var(--vp-hero-text-soft)',
  '--vp-surface': 'var(--vp-hero-surface)',
  '--vp-border': 'var(--vp-hero-border)',
}

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
}

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '14px',
  flex: 1,
}

const statCardStyle = {
  borderRadius: '20px',
  padding: '18px',
  background: 'var(--vp-stat-surface)',
  border: '1px solid var(--vp-stat-border)',
  boxShadow: 'var(--vp-stat-shadow)',
}

const layoutStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(320px, 360px) minmax(0, 1fr)',
  gap: '24px',
  alignItems: 'start',
}

const panelStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-panel)',
  minWidth: 0,
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
  width: 'min(920px, 100%)',
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-modal)',
}

const searchInputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '14px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface-muted)',
  fontSize: '14px',
  marginBottom: '16px',
}

const peopleListStyle = {
  display: 'grid',
  gap: '12px',
  maxHeight: '560px',
  overflowY: 'auto',
  paddingRight: '6px',
}

const responsavelPeopleListStyle = {
  ...peopleListStyle,
  overflowX: 'hidden',
  justifyItems: 'start',
}

const responsavelPersonRowStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  textAlign: 'left',
  padding: '14px 16px',
  borderRadius: '16px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface)',
  color: 'inherit',
  textDecoration: 'none',
  cursor: 'pointer',
}

const responsavelAlertListWrapStyle = {
  display: 'grid',
  gap: '10px',
  marginTop: '10px',
  marginBottom: '16px',
  padding: '14px',
  borderRadius: '18px',
  background: 'rgba(180, 35, 24, 0.08)',
  border: '1px solid rgba(180, 35, 24, 0.16)',
}

const responsavelAlertListStyle = {
  display: 'grid',
  gap: '8px',
}

const responsavelAlertLinkStyle = {
  padding: '10px 12px',
  borderRadius: '14px',
  border: '1px solid rgba(180, 35, 24, 0.18)',
  background: 'rgba(255, 255, 255, 0.88)',
  color: '#b42318',
  textDecoration: 'none',
}

const responsavelAlertNameStyle = {
  margin: 0,
  fontSize: '14px',
  fontWeight: 800,
}

const responsavelAlertMetaStyle = {
  margin: '4px 0 0',
  fontSize: '12px',
  lineHeight: 1.4,
  color: '#9f1f14',
}

const inputStyle = {
  width: '100%',
  marginTop: '8px',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface-muted)',
  fontSize: '14px',
}

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 700,
}

const personFormGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '16px',
  alignItems: 'start',
}

const formSectionTitleStyle = {
  margin: 0,
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--vp-text-soft)',
}

const compactFieldStyle = {
  ...labelStyle,
  maxWidth: '220px',
  width: '100%',
}

const mediumFieldStyle = {
  ...labelStyle,
  maxWidth: '320px',
  width: '100%',
}

const primaryFieldsRowStyle = {
  display: 'grid',
  alignItems: 'start',
  columnGap: '32px',
  rowGap: '16px',
}

const wideFieldStyle = {
  gridColumn: '1 / -1',
}

const primaryButtonStyle = {
  border: 'none',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'var(--vp-accent)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  border: '1px solid var(--vp-accent)',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'transparent',
  color: 'var(--vp-accent)',
  fontWeight: 700,
  cursor: 'pointer',
}

const dangerButtonStyle = {
  border: '1px solid #b42318',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'transparent',
  color: '#b42318',
  fontWeight: 700,
  cursor: 'pointer',
}

const iconButtonStyle = editPencilButtonStyle

const iconDangerButtonStyle = {
  ...dangerButtonStyle,
  width: '34px',
  height: '34px',
  padding: 0,
  fontSize: '14px',
}

const buttonGroupStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
}

const mutedButtonStyle = {
  border: '1px solid var(--vp-border)',
  borderRadius: '999px',
  padding: '10px 16px',
  background: 'var(--vp-surface)',
  color: 'var(--vp-text)',
  fontWeight: 700,
  cursor: 'pointer',
}

const closeButtonStyle = {
  border: '1px solid var(--vp-border)',
  borderRadius: '999px',
  width: '38px',
  height: '38px',
  background: 'var(--vp-surface)',
  color: 'var(--vp-text)',
  fontSize: '22px',
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}

const responsavelListHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
}

const responsavelCreateFormStyle = {
  display: 'grid',
  gap: '12px',
  marginBottom: '16px',
  padding: '16px',
  borderRadius: '18px',
  background: 'rgba(37, 99, 235, 0.05)',
  border: '1px solid rgba(191, 219, 254, 0.9)',
}

const responsavelCreateActionsStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
}

const emptyPersonForm = {
  id: null,
  name: '',
  price: '',
  monthlyPrice: '',
  role: ROLE_CARPINTEIRO,
  accessIdentityId: null,
  accessUsername: '',
  accessPassword: '',
  accessWorkIds: [],
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
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

function getExportDateLabel() {
  return new Intl.DateTimeFormat('sv-SE').format(new Date())
}

function getCurrentMonthKey() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function openNativeMonthPicker(event) {
  try {
    if (typeof event?.currentTarget?.showPicker === 'function') {
      event.currentTarget.showPicker()
    }
  } catch (error) {
    return
  }
}

function getDaysInMonth(monthKey) {
  const [year, month] = String(monthKey || '').split('-').map(Number)
  if (!year || !month) return 31
  return new Date(year, month, 0).getDate()
}

function getWeekdayLabel(monthKey, dayNumber) {
  const [year, month] = String(monthKey || '').split('-').map(Number)
  if (!year || !month || !dayNumber) return ''
  const labels = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
  return labels[new Date(year, month - 1, dayNumber).getDay()] || ''
}

function isWeekendDay(monthKey, dayNumber) {
  const [year, month] = String(monthKey || '').split('-').map(Number)
  if (!year || !month || !dayNumber) return false
  const weekday = new Date(year, month - 1, dayNumber).getDay()
  return weekday === 0 || weekday === 6
}

function isSunday(monthKey, dayNumber) {
  const [year, month] = String(monthKey || '').split('-').map(Number)
  if (!year || !month || !dayNumber) return false
  return new Date(year, month - 1, dayNumber).getDay() === 0
}

function formatHourCell(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue === 0) return ''
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(2).replace('.', ',')
}

function formatTotalHours(value) {
  const numericValue = Number(value) || 0
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(2).replace('.', ',')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value) || 0)
}

function getDocumentAlertPriority(status) {
  if (status === 'expired') {
    return 0
  }

  if (status === 'warning') {
    return 1
  }

  return 2
}

function buildPeopleHoursGrid(monthKey, people, assignments) {
  const dayColumns = Array.from({ length: getDaysInMonth(monthKey) }, (_, index) => {
    const dayNumber = index + 1
    return {
      dayNumber,
      weekdayLabel: getWeekdayLabel(monthKey, dayNumber),
      isSunday: isSunday(monthKey, dayNumber),
      isWeekend: isWeekendDay(monthKey, dayNumber),
    }
  })

  const rows = people.map(person => {
    const values = Array(dayColumns.length).fill('')
    let totalHours = 0

    assignments.forEach(assignment => {
      if (Number(assignment.personId) !== Number(person.id) || !assignment.date) {
        return
      }

      if (String(assignment.date).slice(0, 7) !== monthKey) {
        return
      }

      const dayNumber = Number.parseInt(String(assignment.date).slice(8, 10), 10)
      if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > dayColumns.length) {
        return
      }

      const approvedHours = getApprovedAssignmentHours(assignment)
      const nextHours = (Number(values[dayNumber - 1]) || 0) + approvedHours
      values[dayNumber - 1] = Number(nextHours.toFixed(2))
      totalHours += approvedHours
    })

    const normalizedTotalHours = Number(totalHours.toFixed(2))
    const unitPrice = person.isMonthlyBilling ? Number(person.monthlyPrice) || 0 : Number(person.price) || 0
    const totalValue = person.isMonthlyBilling
      ? normalizedTotalHours > 0
        ? unitPrice
        : 0
      : Number((normalizedTotalHours * unitPrice).toFixed(2))

    return {
      id: person.id,
      name: person.name || '',
      values,
      totalHours: normalizedTotalHours,
      priceDisplay: person.isMonthlyBilling ? '' : formatCurrency(unitPrice),
      totalDisplay:
        normalizedTotalHours > 0
          ? formatCurrency(totalValue)
          : '-',
      totalStyle: person.isMonthlyBilling && normalizedTotalHours > 0 ? 'monthly' : '',
    }
  })

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    yearLabel: String(monthKey || '').slice(0, 4),
    dayColumns,
    rows,
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

function buildPeoplePrintDocument(rows, summary, exportDateLabel, hoursGrid) {
  const tableRows = rows
    .map(
      row => `
        <tr>
          <td>${escapeHtml(row.id)}</td>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.billingType)}</td>
          <td>${escapeHtml(row.roleLabel)}</td>
          <td>${escapeHtml(row.hourlyPrice)}</td>
          <td>${escapeHtml(row.monthlyPrice)}</td>
        </tr>`,
    )
    .join('')

  const hoursHeaderWeekdays = hoursGrid.dayColumns
    .map(day => `<th class="${day.isSunday ? 'sunday' : ''}">${escapeHtml(day.weekdayLabel)}</th>`)
    .join('')
  const hoursHeaderDays = hoursGrid.dayColumns
    .map(day => `<th class="${day.isSunday ? 'sunday' : ''}">${escapeHtml(day.dayNumber)}</th>`)
    .join('')
  const hoursBodyRows = hoursGrid.rows
    .map(row => {
      const valuesHtml = row.values
        .map((value, index) => {
          const column = hoursGrid.dayColumns[index]
          const cellValue = column?.isSunday ? 'X' : formatHourCell(value)
          return `<td class="${column?.isSunday ? 'sunday' : ''}">${escapeHtml(cellValue)}</td>`
        })
        .join('')

      return `
        <tr>
          <td>${escapeHtml(row.id)}</td>
          <td class="name-cell">${escapeHtml(row.name)}</td>
          ${valuesHtml}
          <td>${escapeHtml(formatTotalHours(row.totalHours))}</td>
          <td>${escapeHtml(row.priceDisplay)}</td>
          <td class="${row.totalStyle}">${escapeHtml(row.totalDisplay)}</td>
        </tr>
      `
    })
    .join('')

  return `
    <!doctype html>
    <html lang="pt">
      <head>
        <meta charset="utf-8" />
        <title>Lista de pessoas</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 8mm 8mm 8mm 4mm;
          }
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
            grid-template-columns: 1fr auto;
            align-items: end;
            gap: 12px;
          }
          .sheet-date {
            font-size: 14px;
            font-weight: 700;
            text-align: right;
          }
          h1 {
            margin: 0;
            font-size: 24px;
          }
          .sheet-subtitle {
            margin: 6px 0 0;
            color: #546158;
            font-size: 13px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-top: 18px;
          }
          th, td {
            border: 2px solid #738178;
            padding: 7px 8px;
            font-size: 11px;
            text-align: center;
            word-break: break-word;
          }
          th {
            background: #e4e7e2;
          }
          th:nth-child(2),
          td:nth-child(2) {
            text-align: left;
            width: 26%;
          }
          .summary-box {
            width: min(340px, 100%);
            margin-top: 16px;
            margin-left: auto;
          }
          .summary-row {
            display: grid;
            grid-template-columns: 1fr 120px;
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
          .hours-sheet .sheet-header {
            grid-template-columns: 1fr auto;
          }
          .hours-sheet table {
            table-layout: auto;
          }
          .hours-sheet th,
          .hours-sheet td {
            padding: 6px 4px;
            font-size: 10px;
            min-width: 28px;
          }
          .hours-sheet .name-cell {
            text-align: left;
            min-width: 220px;
          }
          .hours-sheet .sunday {
            background: #f3dccf;
            font-weight: 700;
          }
          .hours-sheet .monthly {
            color: #c81e1e;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <section class="sheet">
          <div class="sheet-header">
            <div>
              <h1>Lista de pessoas</h1>
              <p class="sheet-subtitle">Exportação completa com os nomes de todas as pessoas registadas.</p>
            </div>
            <div class="sheet-date">Exportado em ${escapeHtml(exportDateLabel)}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Função</th>
                <th>Preço hora</th>
                <th>Preço mensal</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>

          <div class="summary-box">
            <div class="summary-row">
              <span>Pessoas totais</span>
              <strong>${escapeHtml(summary.total)}</strong>
            </div>
            <div class="summary-row">
              <span>Mensais</span>
              <strong>${escapeHtml(summary.monthly)}</strong>
            </div>
            <div class="summary-row total">
              <span>Horárias</span>
              <strong>${escapeHtml(summary.hourly)}</strong>
            </div>
          </div>
        </section>
        <section class="sheet hours-sheet">
          <div class="sheet-header">
            <div>
              <h1>Folha de horas</h1>
              <p class="sheet-subtitle">Mapa mensal por pessoa para ${escapeHtml(hoursGrid.monthLabel)}.</p>
            </div>
            <div class="sheet-date">ANO : ${escapeHtml(hoursGrid.yearLabel)}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th rowspan="2">NUMERO</th>
                <th rowspan="2">NOME</th>
                ${hoursHeaderWeekdays}
                <th rowspan="2">HORAS</th>
                <th rowspan="2">PREÇO</th>
                <th rowspan="2">TOTAL</th>
              </tr>
              <tr>${hoursHeaderDays}</tr>
            </thead>
            <tbody>${hoursBodyRows}</tbody>
          </table>
        </section>
      </body>
    </html>
  `
}

function buildResponsavelDocumentReviewPrintDocument(alertPeople, exportDateLabel) {
  const rows = alertPeople
    .flatMap(person => {
      const personDocuments = Array.isArray(person.documentAlerts) ? person.documentAlerts : []

      return personDocuments.map(document => `
        <tr>
          <td>${escapeHtml(person.name || '')}</td>
          <td>${escapeHtml(document.name || '')}</td>
          <td>${escapeHtml(document.statusLabel || '')}</td>
          <td>${escapeHtml(formatDateLabel(document.expirationDate))}</td>
        </tr>
      `)
    })
    .join('')

  return `
    <!doctype html>
    <html lang="pt">
      <head>
        <meta charset="utf-8" />
        <title>Documentos a rever</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            color: #10233e;
            background: #ffffff;
          }
          .sheet {
            padding: 22px 18px;
          }
          .sheet-header {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 12px;
            align-items: end;
            margin-bottom: 18px;
          }
          h1 {
            margin: 0;
            font-size: 24px;
            line-height: 1.05;
          }
          .sheet-subtitle {
            margin: 6px 0 0;
            color: #6b7280;
            font-size: 13px;
          }
          .sheet-date {
            font-size: 13px;
            font-weight: 700;
            color: #b42318;
            text-align: right;
          }
          .summary {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            padding: 10px 12px;
            border-radius: 999px;
            background: rgba(180, 35, 24, 0.08);
            border: 1px solid rgba(180, 35, 24, 0.16);
            color: #b42318;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #d4dbe5;
            padding: 9px 10px;
            font-size: 11px;
            vertical-align: top;
            word-break: break-word;
          }
          th {
            background: #eef3fb;
            color: #173b70;
            text-align: left;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
          }
          tbody tr:nth-child(even) {
            background: #fafbfd;
          }
        </style>
      </head>
      <body>
        <section class="sheet">
          <div class="sheet-header">
            <div>
              <h1>Documentos a rever</h1>
            </div>
            <div class="sheet-date">Emitido em ${escapeHtml(exportDateLabel)}</div>
          </div>
          <div class="summary">${escapeHtml(String(alertPeople.length))} pessoas com documentos a rever</div>
          <table>
            <thead>
              <tr>
                <th>Pessoa</th>
                <th>Documento</th>
                <th>Estado</th>
                <th>Expiração</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>
      </body>
    </html>
  `
}

const PEOPLE_EXCEL_BORDER_RGB = '738178'
const PEOPLE_EXCEL_HEADER_FILL_RGB = 'E3E8E3'
const PEOPLE_EXCEL_SUNDAY_FILL_RGB = 'D6B8A6'
const PEOPLE_EXCEL_TOTAL_FILL_RGB = 'F3DCCF'

function buildPeopleExcelBorder(style = 'medium') {
  return {
    top: { style, color: { rgb: PEOPLE_EXCEL_BORDER_RGB } },
    right: { style, color: { rgb: PEOPLE_EXCEL_BORDER_RGB } },
    bottom: { style, color: { rgb: PEOPLE_EXCEL_BORDER_RGB } },
    left: { style, color: { rgb: PEOPLE_EXCEL_BORDER_RGB } },
  }
}

function buildPeopleExcelFill(rgb) {
  return {
    patternType: 'solid',
    fgColor: { rgb },
  }
}

function ensurePeopleWorksheetCell(worksheet, row, col) {
  const address = XLSX.utils.encode_cell({ r: row, c: col })

  if (!worksheet[address]) {
    worksheet[address] = { t: 's', v: '' }
  }

  return address
}

function applyPeopleWorksheetCellStyle(worksheet, row, col, style) {
  const address = ensurePeopleWorksheetCell(worksheet, row, col)
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

function buildPeopleHoursWorksheet(hoursGrid) {
  // Estrutura do Excel independente do PDF congelado abaixo.
  const titleColumnIndex = 0
  const firstDayColumnIndex = 2
  const hoursColumnIndex = firstDayColumnIndex + hoursGrid.dayColumns.length
  const priceColumnIndex = hoursColumnIndex + 1
  const totalColumnIndex = priceColumnIndex + 1
  const aoa = [
    ['Folha de horas'],
    [hoursGrid.monthLabel],
    [
      '',
      '',
      ...hoursGrid.dayColumns.map(day => day.weekdayLabel),
      'HORAS',
      'PREÇO',
      'TOTAL',
    ],
    [
      'NUMERO',
      'NOME',
      ...hoursGrid.dayColumns.map(day => day.dayNumber),
      '',
      '',
      '',
    ],
    ...hoursGrid.rows.map(row => [
      row.id,
      row.name,
      ...row.values.map((value, index) => (hoursGrid.dayColumns[index]?.isSunday ? 'X' : formatHourCell(value))),
      formatTotalHours(row.totalHours),
      row.priceDisplay,
      row.totalDisplay,
    ]),
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(aoa)
  worksheet['!merges'] = [
    { s: { r: 0, c: titleColumnIndex }, e: { r: 0, c: totalColumnIndex } },
    { s: { r: 1, c: titleColumnIndex }, e: { r: 1, c: totalColumnIndex } },
    { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
    { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
    { s: { r: 2, c: hoursColumnIndex }, e: { r: 3, c: hoursColumnIndex } },
    { s: { r: 2, c: priceColumnIndex }, e: { r: 3, c: priceColumnIndex } },
    { s: { r: 2, c: totalColumnIndex }, e: { r: 3, c: totalColumnIndex } },
  ]
  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 38 },
    ...hoursGrid.dayColumns.map(() => ({ wch: 5 })),
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
  ]

  const mediumBorder = buildPeopleExcelBorder('medium')

  applyPeopleWorksheetCellStyle(worksheet, 0, 0, {
    font: { bold: true, sz: 16 },
    alignment: { horizontal: 'center', vertical: 'center' },
  })
  applyPeopleWorksheetCellStyle(worksheet, 1, 0, {
    font: { sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center' },
  })
  applyPeopleWorksheetCellStyle(worksheet, 2, 0, {
    font: { sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center' },
  })

  for (let col = 0; col <= totalColumnIndex; col += 1) {
    const dayMeta = hoursGrid.dayColumns[col - firstDayColumnIndex]
    const isSundayHeader = Boolean(dayMeta?.isSunday)
    const fill = buildPeopleExcelFill(isSundayHeader ? PEOPLE_EXCEL_SUNDAY_FILL_RGB : PEOPLE_EXCEL_HEADER_FILL_RGB)
    const alignLeft = col === 0 || col === 1

    applyPeopleWorksheetCellStyle(worksheet, 2, col, {
      font: { bold: true, sz: 10 },
      alignment: { horizontal: alignLeft ? 'left' : 'center', vertical: 'center' },
      fill,
      border: mediumBorder,
    })
    applyPeopleWorksheetCellStyle(worksheet, 3, col, {
      font: { bold: true, sz: 10 },
      alignment: { horizontal: alignLeft ? 'left' : 'center', vertical: 'center' },
      fill,
      border: mediumBorder,
    })
  }

  for (let row = 4; row < 4 + hoursGrid.rows.length; row += 1) {
    for (let col = 0; col <= totalColumnIndex; col += 1) {
      const isSundayColumn = col >= firstDayColumnIndex && col < hoursColumnIndex && hoursGrid.dayColumns[col - firstDayColumnIndex]?.isSunday
      const isTotalColumn = col === totalColumnIndex

      applyPeopleWorksheetCellStyle(worksheet, row, col, {
        font: { sz: 10, bold: isTotalColumn },
        alignment: { horizontal: col === 1 ? 'left' : 'center', vertical: 'center' },
        fill: isSundayColumn
          ? buildPeopleExcelFill(PEOPLE_EXCEL_SUNDAY_FILL_RGB)
          : col === priceColumnIndex || isTotalColumn
            ? buildPeopleExcelFill(PEOPLE_EXCEL_TOTAL_FILL_RGB)
            : undefined,
        border: mediumBorder,
      })
    }
  }

  return worksheet
}

function buildPeopleListWorksheet(rows, summary, exportDateLabel) {
  // Estrutura do Excel independente do PDF congelado abaixo.
  const aoa = [
    ['Lista de pessoas'],
    [`Exportado em ${exportDateLabel}`],
    [`Total ${summary.total} | Mensais ${summary.monthly} | Horarias ${summary.hourly}`],
    [],
    ['ID', 'Nome', 'Tipo', 'Função', 'Preço hora', 'Preço mensal'],
    ...rows.map(row => [
      row.id,
      row.name,
      row.billingType,
      row.roleLabel,
      row.hourlyPrice,
      row.monthlyPrice,
    ]),
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(aoa)
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
  ]
  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 34 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
  ]

  const mediumBorder = buildPeopleExcelBorder('medium')

  applyPeopleWorksheetCellStyle(worksheet, 0, 0, {
    font: { bold: true, sz: 16 },
    alignment: { horizontal: 'center', vertical: 'center' },
  })
  applyPeopleWorksheetCellStyle(worksheet, 1, 0, {
    font: { bold: true, sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center' },
  })
  applyPeopleWorksheetCellStyle(worksheet, 2, 0, {
    font: { sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center' },
  })

  for (let col = 0; col < 6; col += 1) {
    applyPeopleWorksheetCellStyle(worksheet, 4, col, {
      font: { bold: true, sz: 10 },
      alignment: { horizontal: col === 1 ? 'left' : 'center', vertical: 'center' },
      fill: buildPeopleExcelFill(PEOPLE_EXCEL_HEADER_FILL_RGB),
      border: mediumBorder,
    })
  }

  for (let row = 5; row < 5 + rows.length; row += 1) {
    const sourceRow = rows[row - 5]
    const highlightMonthlyTotal = Number(sourceRow?.monthlyPrice) > 0

    for (let col = 0; col < 6; col += 1) {
      applyPeopleWorksheetCellStyle(worksheet, row, col, {
        font: { sz: 10, bold: col === 5 && highlightMonthlyTotal },
        alignment: { horizontal: col === 1 ? 'left' : 'center', vertical: 'center' },
        fill: col === 5 && highlightMonthlyTotal ? buildPeopleExcelFill(PEOPLE_EXCEL_TOTAL_FILL_RGB) : undefined,
        border: mediumBorder,
      })
    }
  }

  return worksheet
}

function buildPeopleExcelWorkbook(rows, summary, exportDateLabel, hoursGrid) {
  const workbook = XLSX.utils.book_new()
  const peopleWorksheet = buildPeopleListWorksheet(rows, summary, exportDateLabel)
  const hoursWorksheet = buildPeopleHoursWorksheet(hoursGrid)

  XLSX.utils.book_append_sheet(workbook, peopleWorksheet, 'Pessoas')
  XLSX.utils.book_append_sheet(workbook, hoursWorksheet, `Horas-${hoursGrid.monthKey}`.slice(0, 31))

  return workbook
}

function sanitizePdfText(value) {
  return String(value ?? '')
    .replaceAll('€', 'EUR')
    .replaceAll('–', '-')
    .replaceAll('—', '-')
    .replaceAll('×', 'x')
    .replaceAll('\r', ' ')
    .replaceAll('\n', ' ')
    .replace(/[^\x20-\xFF]/g, character => {
      const normalized = character.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return /^[\x20-\xFF]$/.test(normalized) ? normalized : '?'
    })
}

function escapePdfText(value) {
  return sanitizePdfText(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
}

function measurePdfText(text, fontSize) {
  return escapePdfText(text).length * fontSize * 0.48
}

function fitPdfText(text, maxWidth, fontSize) {
  const safeText = sanitizePdfText(text)

  if (measurePdfText(safeText, fontSize) <= maxWidth) {
    return safeText
  }

  let trimmed = safeText
  while (trimmed.length > 0 && measurePdfText(`${trimmed}...`, fontSize) > maxWidth) {
    trimmed = trimmed.slice(0, -1)
  }

  return `${trimmed}...`
}

function stringToPdfBytes(value) {
  const safeValue = String(value ?? '')
  const bytes = new Uint8Array(safeValue.length)

  for (let index = 0; index < safeValue.length; index += 1) {
    bytes[index] = safeValue.charCodeAt(index) & 0xff
  }

  return bytes
}

function buildPeoplePdfDocument(rows, summary, exportDateLabel, hoursGrid) {
  // Layout do PDF da Gestão de pessoas congelado por pedido do cliente em 18/05/2026.
  // Evitar alterações visuais aqui sem validação explícita.
  // Mudanças futuras no Excel não devem alterar esta composição do PDF.
  const pageWidth = 841.89
  const pageHeight = 595.28
  const marginLeft = 16
  const marginRight = 12
  const marginTop = 18
  const marginBottom = 18
  const objects = ['']
  const pageObjectIds = []

  function addObject(content) {
    objects.push(content)
    return objects.length - 1
  }

  function formatNumber(value) {
    return Number(value.toFixed(2)).toString()
  }

  function toPdfY(top, height = 0) {
    return pageHeight - top - height
  }

  function rectPath(x, top, width, height) {
    return `${formatNumber(x)} ${formatNumber(toPdfY(top, height))} ${formatNumber(width)} ${formatNumber(height)} re`
  }

  function drawFilledRect(commands, x, top, width, height, rgb) {
    commands.push(`q ${rgb.join(' ')} rg ${rectPath(x, top, width, height)} f Q`)
  }

  function drawRect(commands, x, top, width, height, lineWidth = 0.8) {
    commands.push(`q ${formatNumber(lineWidth)} w ${rectPath(x, top, width, height)} S Q`)
  }

  function drawText(commands, text, x, baselineTop, options = {}) {
    const {
      font = 'F1',
      fontSize = 9,
      rgb = '0 0 0',
      maxWidth = null,
      align = 'left',
    } = options

    const fittedText = maxWidth ? fitPdfText(text, maxWidth, fontSize) : sanitizePdfText(text)
    const escapedText = escapePdfText(fittedText)
    const textWidth = measurePdfText(fittedText, fontSize)
    let drawX = x

    if (align === 'center' && maxWidth) {
      drawX += Math.max((maxWidth - textWidth) / 2, 0)
    } else if (align === 'right' && maxWidth) {
      drawX += Math.max(maxWidth - textWidth, 0)
    }

    commands.push(
      `BT /${font} ${formatNumber(fontSize)} Tf ${rgb} rg 1 0 0 1 ${formatNumber(drawX)} ${formatNumber(toPdfY(baselineTop))} Tm (${escapedText}) Tj ET`,
    )
  }

  function drawCell(commands, x, top, width, height, text, options = {}) {
    const {
      fill = null,
      font = 'F1',
      fontSize = 8,
      align = 'center',
      rgb = '0 0 0',
      paddingX = 4,
      boldBorder = 0.8,
    } = options

    if (fill) {
      drawFilledRect(commands, x, top, width, height, fill)
    }

    drawRect(commands, x, top, width, height, boldBorder)

    if (text !== '' && text !== null && text !== undefined) {
      const textMaxWidth = Math.max(width - paddingX * 2, 0)
      const textX = align === 'left' ? x + paddingX : x + paddingX
      const baselineTop = top + height * 0.68
      drawText(commands, text, textX, baselineTop, {
        font,
        fontSize,
        rgb,
        maxWidth: textMaxWidth,
        align,
      })
    }
  }

  function drawPageNumber(commands, pageNumber, totalPages) {
    drawText(commands, `Pagina ${pageNumber} de ${totalPages}`, marginLeft, pageHeight - marginBottom + 4, {
      fontSize: 8,
      maxWidth: pageWidth - marginLeft - marginRight,
      align: 'center',
    })
  }

  function addPage(commands) {
    const stream = commands.join('\n')
    const streamBytes = stringToPdfBytes(stream)
    const contentId = addObject(`<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`)
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${formatNumber(pageWidth)} ${formatNumber(pageHeight)}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    )
    pageObjectIds.push(pageId)
  }

  const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  const pagesId = addObject('')

  const listColumns = [36, 230, 88, 118, 95, 100]
  const listTableWidth = listColumns.reduce((sum, width) => sum + width, 0)
  const listTableStartX = marginLeft + (pageWidth - marginLeft - marginRight - listTableWidth) / 2
  const listHeaderHeight = 20
  const listRowHeight = 18
  const listRowsPerPage = 23
  const hoursRowsPerPage = 24
  const listPageCount = Math.max(1, Math.ceil(rows.length / listRowsPerPage))
  const hoursPageCount = Math.max(1, Math.ceil(hoursGrid.rows.length / hoursRowsPerPage))
  const totalPages = listPageCount + hoursPageCount

  for (let start = 0; start < rows.length || start === 0; start += listRowsPerPage) {
    const pageNumber = Math.floor(start / listRowsPerPage) + 1
    const pageRows = rows.slice(start, start + listRowsPerPage)
    const commands = []
    let cursorX = listTableStartX
    let cursorY = marginTop

    drawText(commands, 'Lista de pessoas', marginLeft, cursorY + 6, {
      font: 'F2',
      fontSize: 16,
      maxWidth: pageWidth - marginLeft - marginRight,
      align: 'center',
    })
    drawText(
      commands,
      `Exportado em ${exportDateLabel}`,
      marginLeft,
      cursorY + 22,
      {
        font: 'F2',
        fontSize: 10,
        maxWidth: pageWidth - marginLeft - marginRight,
        align: 'center',
      },
    )
    drawText(
      commands,
      `Total ${summary.total} | Mensais ${summary.monthly} | Horarias ${summary.hourly}`,
      marginLeft,
      cursorY + 36,
      {
        fontSize: 9,
        maxWidth: pageWidth - marginLeft - marginRight,
        align: 'center',
      },
    )

    cursorY += 52
    const headers = ['ID', 'Nome', 'Tipo', 'Função', 'Preço hora', 'Preço mensal']
    headers.forEach((header, index) => {
      const align = index === 1 ? 'left' : 'center'
      drawCell(commands, cursorX, cursorY, listColumns[index], listHeaderHeight, header, {
        fill: [0.89, 0.91, 0.89],
        font: 'F2',
        fontSize: 8.5,
        align,
      })
      cursorX += listColumns[index]
    })

    cursorY += listHeaderHeight
    pageRows.forEach(row => {
      cursorX = listTableStartX
      const values = [row.id, row.name, row.billingType, row.roleLabel, row.hourlyPrice, row.monthlyPrice]
      values.forEach((value, index) => {
        const align = index === 1 ? 'left' : 'center'
        drawCell(commands, cursorX, cursorY, listColumns[index], listRowHeight, value, {
          fontSize: 8,
          align,
        })
        cursorX += listColumns[index]
      })
      cursorY += listRowHeight
    })

    drawPageNumber(commands, pageNumber, totalPages)
    addPage(commands)
  }

  const hoursNumberWidth = 28
  const hoursNameWidth = 170
  const hoursHoursWidth = 32
  const hoursPriceWidth = 50
  const hoursTotalWidth = 54
  const dayWidth = (pageWidth - marginLeft - marginRight - hoursNumberWidth - hoursNameWidth - hoursHoursWidth - hoursPriceWidth - hoursTotalWidth) / hoursGrid.dayColumns.length
  const hoursHeaderHeight = 16
  const hoursRowHeight = 17

  for (let start = 0; start < hoursGrid.rows.length || start === 0; start += hoursRowsPerPage) {
    const pageNumber = listPageCount + Math.floor(start / hoursRowsPerPage) + 1
    const pageRows = hoursGrid.rows.slice(start, start + hoursRowsPerPage)
    const commands = []
    let cursorY = marginTop

    drawText(commands, 'Folha de horas', marginLeft, cursorY + 6, {
      font: 'F2',
      fontSize: 16,
      maxWidth: pageWidth - marginLeft - marginRight,
      align: 'center',
    })
    drawText(commands, hoursGrid.monthLabel, marginLeft, cursorY + 36, {
      fontSize: 9,
      maxWidth: pageWidth - marginLeft - marginRight,
      align: 'center',
    })

    cursorY += 52
    let cursorX = marginLeft

    drawCell(commands, cursorX, cursorY, hoursNumberWidth, hoursHeaderHeight, 'NUMERO', {
      fill: [0.89, 0.91, 0.89],
      font: 'F2',
      fontSize: 6.5,
    })
    cursorX += hoursNumberWidth
    drawCell(commands, cursorX, cursorY, hoursNameWidth, hoursHeaderHeight, 'NOME', {
      fill: [0.89, 0.91, 0.89],
      font: 'F2',
      fontSize: 6.5,
      align: 'left',
    })
    cursorX += hoursNameWidth
    hoursGrid.dayColumns.forEach(day => {
      drawCell(commands, cursorX, cursorY, dayWidth, hoursHeaderHeight, day.weekdayLabel, {
        fill: day.isSunday ? [0.95, 0.86, 0.81] : [0.89, 0.91, 0.89],
        font: 'F2',
        fontSize: 5.2,
        paddingX: 1,
      })
      cursorX += dayWidth
    })
    ;[
      ['HORAS', hoursHoursWidth],
      ['PREÇO', hoursPriceWidth],
      ['TOTAL', hoursTotalWidth],
    ].forEach(([label, width]) => {
      drawCell(commands, cursorX, cursorY, width, hoursHeaderHeight, label, {
        fill: [0.89, 0.91, 0.89],
        font: 'F2',
        fontSize: 6.3,
      })
      cursorX += width
    })

    cursorY += hoursHeaderHeight
    cursorX = marginLeft
    drawCell(commands, cursorX, cursorY, hoursNumberWidth, hoursHeaderHeight, '', {
      fill: [1, 1, 1],
      fontSize: 5,
    })
    cursorX += hoursNumberWidth
    drawCell(commands, cursorX, cursorY, hoursNameWidth, hoursHeaderHeight, '', {
      fill: [1, 1, 1],
      fontSize: 5,
    })
    cursorX += hoursNameWidth
    hoursGrid.dayColumns.forEach(day => {
      drawCell(commands, cursorX, cursorY, dayWidth, hoursHeaderHeight, day.dayNumber, {
        fill: day.isSunday ? [0.95, 0.86, 0.81] : [1, 1, 1],
        font: 'F2',
        fontSize: 6,
        paddingX: 1,
      })
      cursorX += dayWidth
    })
    ;['', '', ''].forEach((label, index) => {
      const width = [hoursHoursWidth, hoursPriceWidth, hoursTotalWidth][index]
      drawCell(commands, cursorX, cursorY, width, hoursHeaderHeight, label, {
        fill: [1, 1, 1],
        fontSize: 5,
      })
      cursorX += width
    })

    cursorY += hoursHeaderHeight
    pageRows.forEach(row => {
      cursorX = marginLeft
      drawCell(commands, cursorX, cursorY, hoursNumberWidth, hoursRowHeight, row.id, {
        fontSize: 6.6,
      })
      cursorX += hoursNumberWidth
      drawCell(commands, cursorX, cursorY, hoursNameWidth, hoursRowHeight, row.name, {
        fontSize: 6.1,
        align: 'left',
      })
      cursorX += hoursNameWidth
      row.values.forEach((value, index) => {
        const day = hoursGrid.dayColumns[index]
        drawCell(commands, cursorX, cursorY, dayWidth, hoursRowHeight, day?.isSunday ? 'X' : formatHourCell(value), {
          fill: day?.isSunday ? [0.95, 0.86, 0.81] : null,
          fontSize: 6.2,
          font: day?.isSunday ? 'F2' : 'F1',
        })
        cursorX += dayWidth
      })
      drawCell(commands, cursorX, cursorY, hoursHoursWidth, hoursRowHeight, formatTotalHours(row.totalHours), {
        fontSize: 6.4,
        font: 'F2',
      })
      cursorX += hoursHoursWidth
      drawCell(commands, cursorX, cursorY, hoursPriceWidth, hoursRowHeight, row.priceDisplay, {
        fontSize: 6,
      })
      cursorX += hoursPriceWidth
      drawCell(commands, cursorX, cursorY, hoursTotalWidth, hoursRowHeight, row.totalDisplay, {
        fontSize: 6.2,
        font: 'F2',
        rgb: row.totalStyle === 'monthly' ? '0.78 0.12 0.12' : '0 0 0',
      })
      cursorY += hoursRowHeight
    })

    drawPageNumber(commands, pageNumber, totalPages)
    addPage(commands)
  }

  objects[pagesId] = `<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)

  let output = '%PDF-1.4\n%\xD3\xEB\xE9\xE1\n'
  const offsets = [0]

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = stringToPdfBytes(output).length
    output += `${index} 0 obj\n${objects[index]}\nendobj\n`
  }

  const xrefOffset = stringToPdfBytes(output).length
  output += `xref\n0 ${objects.length}\n`
  output += '0000000000 65535 f \n'

  for (let index = 1; index < objects.length; index += 1) {
    output += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }

  output += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return stringToPdfBytes(output)
}

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function buildExcelCell(value, styleId, type = 'String', index = null) {
  const indexAttribute = index ? ` ss:Index="${index}"` : ''
  return `<Cell${indexAttribute} ss:StyleID="${styleId}"><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`
}

function buildPeopleExcelDocument(rows, summary, exportDateLabel, hoursGrid) {
  const listRows = rows
    .map(
      row => `
        <Row>
          ${buildExcelCell(row.id, 'idCell')}
          ${buildExcelCell(row.name, 'nameCell')}
          ${buildExcelCell(row.billingType, 'valueCell')}
          ${buildExcelCell(row.roleLabel, 'valueCell')}
          ${buildExcelCell(row.hourlyPrice, 'valueCell')}
          ${buildExcelCell(row.monthlyPrice, 'valueCell')}
        </Row>`,
    )
    .join('')

  const hoursWeekdays = hoursGrid.dayColumns
    .map(day => buildExcelCell(day.weekdayLabel, day.isSunday ? 'sundayHeader' : 'header'))
    .join('')
  const hoursDays = hoursGrid.dayColumns
    .map((day, index) =>
      buildExcelCell(day.dayNumber, day.isSunday ? 'sundayHeader' : 'header', 'String', index === 0 ? 3 : null),
    )
    .join('')
  const hoursRows = hoursGrid.rows
    .map(row => {
      const dayCells = row.values
        .map((value, index) =>
          buildExcelCell(
            hoursGrid.dayColumns[index]?.isSunday ? 'X' : formatHourCell(value),
            hoursGrid.dayColumns[index]?.isSunday ? 'sundayCell' : 'valueCell',
          ),
        )
        .join('')

      return `
        <Row>
          ${buildExcelCell(row.id, 'idCell')}
          ${buildExcelCell(row.name, 'nameCell')}
          ${dayCells}
          ${buildExcelCell(formatTotalHours(row.totalHours), 'totalCell')}
          ${buildExcelCell(row.priceDisplay, 'valueCell')}
          ${buildExcelCell(row.totalDisplay, row.totalStyle === 'monthly' ? 'monthlyTotalCell' : 'totalCell')}
        </Row>`
    })
    .join('')

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="title">
      <Font ss:Bold="1" ss:Size="16"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="metaCenter">
      <Font ss:Bold="1" ss:Size="10"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="summaryCenter">
      <Font ss:Bold="1" ss:Size="10"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="subtitle">
      <Alignment ss:Vertical="Center"/>
      <Font ss:Italic="1"/>
    </Style>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#E4E7E2" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
      </Borders>
    </Style>
    <Style ss:ID="sundayHeader">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#F3DCCF" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
      </Borders>
    </Style>
    <Style ss:ID="idCell">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
      </Borders>
    </Style>
    <Style ss:ID="nameCell">
      <Font ss:Bold="1"/>
      <Alignment ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
      </Borders>
    </Style>
    <Style ss:ID="valueCell">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
      </Borders>
    </Style>
    <Style ss:ID="sundayCell">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#F3DCCF" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
      </Borders>
    </Style>
    <Style ss:ID="totalCell">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
      </Borders>
    </Style>
    <Style ss:ID="monthlyTotalCell">
      <Font ss:Bold="1" ss:Color="#C81E1E"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
      </Borders>
    </Style>
    <Style ss:ID="summaryLabel">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Interior ss:Color="#EEF3EF" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
      </Borders>
    </Style>
    <Style ss:ID="summaryValue">
      <Font ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#738178"/>
      </Borders>
    </Style>
  </Styles>
  <Worksheet ss:Name="Pessoas">
    <Table ss:ExpandedColumnCount="6" ss:ExpandedRowCount="${rows.length + 5}">
      <Column ss:Width="60"/>
      <Column ss:Width="230"/>
      <Column ss:Width="90"/>
      <Column ss:Width="110"/>
      <Column ss:Width="90"/>
      <Column ss:Width="100"/>
      <Row ss:Height="28">
        <Cell ss:MergeAcross="5" ss:StyleID="title"><Data ss:Type="String">Lista de pessoas</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="5" ss:StyleID="metaCenter"><Data ss:Type="String">${escapeXml(`Exportado em ${exportDateLabel}`)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="5" ss:StyleID="summaryCenter"><Data ss:Type="String">${escapeXml(`Total ${summary.total} | Mensais ${summary.monthly} | Horarias ${summary.hourly}`)}</Data></Cell>
      </Row>
      <Row ss:Height="10"/>
      <Row>
        ${buildExcelCell('ID', 'header')}
        ${buildExcelCell('Nome', 'header')}
        ${buildExcelCell('Tipo', 'header')}
        ${buildExcelCell('Função', 'header')}
        ${buildExcelCell('Preço hora', 'header')}
        ${buildExcelCell('Preço mensal', 'header')}
      </Row>
      ${listRows}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="${escapeXml(`Horas-${hoursGrid.monthKey}`.slice(0, 31))}">
    <Table ss:ExpandedColumnCount="${hoursGrid.dayColumns.length + 5}" ss:ExpandedRowCount="${hoursGrid.rows.length + 4}">
      <Column ss:Width="60"/>
      <Column ss:Width="170"/>
      ${hoursGrid.dayColumns.map(() => '<Column ss:Width="28"/>').join('')}
      <Column ss:Width="44"/>
      <Column ss:Width="66"/>
      <Column ss:Width="70"/>
      <Row ss:Height="28">
        <Cell ss:MergeAcross="${hoursGrid.dayColumns.length + 4}" ss:StyleID="title"><Data ss:Type="String">Folha de horas</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="${hoursGrid.dayColumns.length + 4}" ss:StyleID="summaryCenter"><Data ss:Type="String">${escapeXml(hoursGrid.monthLabel)}</Data></Cell>
      </Row>
      <Row ss:Height="10"/>
      <Row>
        <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">NUMERO</Data></Cell>
        <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">NOME</Data></Cell>
        ${hoursWeekdays}
        <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">HORAS</Data></Cell>
        <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">PREÇO</Data></Cell>
        <Cell ss:MergeDown="1" ss:StyleID="header"><Data ss:Type="String">TOTAL</Data></Cell>
      </Row>
      <Row>
        ${hoursDays}
      </Row>
      ${hoursRows}
    </Table>
  </Worksheet>
</Workbook>`
}

export default function PeoplePage() {
  const router = useRouter()
  const [people, setPeople] = useState([])
  const [assignments, setAssignments] = useState([])
  const [accessIdentities, setAccessIdentities] = useState([])
  const [accessWorks, setAccessWorks] = useState([])
  const [viewerRole, setViewerRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [form, setForm] = useState(emptyPersonForm)
  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [exportMonthKey, setExportMonthKey] = useState(getCurrentMonthKey)
  const [exportSelectionMode, setExportSelectionMode] = useState('all')
  const [exportSearchTerm, setExportSearchTerm] = useState('')
  const [selectedExportPersonIds, setSelectedExportPersonIds] = useState([])
  const [exporting, setExporting] = useState(false)
  const isResponsavelView = viewerRole === ROLE_RESPONSAVEL
  const canManagePeople = Boolean(viewerRole) && !isResponsavelView
  const canCreatePeople = Boolean(viewerRole) && (canManagePeople || isResponsavelView)
  const isMonthlyForm = Number(form.monthlyPrice) > 0
  const roleNeedsAccess = roleRequiresAppAccess(form.role)
  const formUsesWorkScope = roleUsesWorkScope(form.role)

  useEffect(() => {
    loadPeople()
  }, [])

  const selectedPerson = useMemo(
    () => people.find(person => Number(person.id) === Number(selectedPersonId)) || people[0] || null,
    [people, selectedPersonId],
  )
  const selectedAccessIdentity = useMemo(
    () => accessIdentities.find(identity => Number(identity.personId) === Number(selectedPerson?.id)) || null,
    [accessIdentities, selectedPerson],
  )
  const reusableAccessIdentity = useMemo(() => {
    const normalizedUsername = String(form.accessUsername || '').trim().toLowerCase()

    if (!normalizedUsername || form.accessIdentityId) {
      return null
    }

    return (
      accessIdentities.find(
        identity =>
          !identity.personId &&
          String(identity.username || '').trim().toLowerCase() === normalizedUsername,
      ) || null
    )
  }, [accessIdentities, form.accessIdentityId, form.accessUsername])

  useEffect(() => {
    if (!selectedPersonId && people[0]) {
      setSelectedPersonId(people[0].id)
    }
  }, [selectedPersonId, people])

  const monthlyPeople = useMemo(() => people.filter(person => person.isMonthlyBilling), [people])
  const hourlyPeople = useMemo(() => people.filter(person => !person.isMonthlyBilling), [people])
  const filteredPeople = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return people

    return people.filter(person => String(person.name || '').toLowerCase().includes(normalizedSearch))
  }, [people, searchTerm])
  const sortedPeople = useMemo(
    () =>
      [...people].sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''), 'pt-PT', { sensitivity: 'base' }),
      ),
    [people],
  )
  const filteredExportPeople = useMemo(() => {
    const normalizedSearch = exportSearchTerm.trim().toLowerCase()

    if (!normalizedSearch) return sortedPeople

    return sortedPeople.filter(person => String(person.name || '').toLowerCase().includes(normalizedSearch))
  }, [exportSearchTerm, sortedPeople])
  const exportPeople = useMemo(() => {
    if (exportSelectionMode === 'all') {
      return sortedPeople
    }

    const selectedIds = new Set(selectedExportPersonIds.map(String))
    return sortedPeople.filter(person => selectedIds.has(String(person.id)))
  }, [exportSelectionMode, selectedExportPersonIds, sortedPeople])
  const exportSummary = useMemo(
    () => ({
      total: exportPeople.length,
      monthly: exportPeople.filter(person => person.isMonthlyBilling).length,
      hourly: exportPeople.filter(person => !person.isMonthlyBilling).length,
    }),
    [exportPeople],
  )
  const responsavelDocumentAlertPeople = useMemo(() => {
    if (!isResponsavelView) {
      return []
    }

    return [...people]
      .filter(person => person.hasDocumentAlert)
      .sort((left, right) => {
        const priorityComparison =
          getDocumentAlertPriority(left.documentAlertStatus) - getDocumentAlertPriority(right.documentAlertStatus)

        if (priorityComparison !== 0) {
          return priorityComparison
        }

        return String(left.name || '').localeCompare(String(right.name || ''), 'pt-PT', { sensitivity: 'base' })
      })
  }, [isResponsavelView, people])
  const monthlyAssignmentSummary = useMemo(() => {
    if (!selectedPerson) return []

    const personAssignments = assignments.filter(
      assignment => Number(assignment.personId) === Number(selectedPerson.id) && assignment.date,
    )

    const monthMap = new Map()

    personAssignments.forEach(assignment => {
      const monthKey = String(assignment.date).slice(0, 7)
      const currentMonth = monthMap.get(monthKey) || {
        monthKey,
        totalHours: 0,
        days: new Map(),
      }

      currentMonth.totalHours += Number(assignment.hours) || 0

      const currentDay = currentMonth.days.get(assignment.date) || {
        date: assignment.date,
        totalHours: 0,
        works: new Map(),
      }

      currentDay.totalHours += Number(assignment.hours) || 0

      const workName = assignment.work?.name || `Obra ${assignment.workId}`
      const currentWork = currentDay.works.get(workName) || {
        name: workName,
        hours: 0,
      }

      currentWork.hours += Number(assignment.hours) || 0
      currentDay.works.set(workName, currentWork)
      currentMonth.days.set(assignment.date, currentDay)
      monthMap.set(monthKey, currentMonth)
    })

    return Array.from(monthMap.values())
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      .map(month => ({
        monthKey: month.monthKey,
        label: formatMonthLabel(month.monthKey),
        totalHours: Number(month.totalHours.toFixed(2)),
        days: Array.from(month.days.values())
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(day => ({
            ...day,
            totalHours: Number(day.totalHours.toFixed(2)),
            works: Array.from(day.works.values()).sort((a, b) => a.name.localeCompare(b.name)).map(work => ({
              ...work,
              hours: Number(work.hours.toFixed(2)),
            })),
          })),
      }))
  }, [assignments, selectedPerson])

  async function loadPeople() {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const sessionResponse = await fetch('/api/auth/session')
      const sessionData = await sessionResponse.json()

      if (!sessionResponse.ok) {
        throw new Error(sessionData.error || 'Erro ao carregar a sessão')
      }

      const nextViewerRole = sessionData?.user?.role || ''
      const responsavelView = nextViewerRole === ROLE_RESPONSAVEL
      setViewerRole(nextViewerRole)

      const peopleResponse = await fetch('/api/people')
      const peopleData = await peopleResponse.json()

      if (!peopleResponse.ok) {
        throw new Error(peopleData.error || 'Erro ao carregar pessoas')
      }

      setPeople(peopleData)

      if (responsavelView) {
        setAssignments([])
        setAccessIdentities([])
        setAccessWorks([])
        setShowForm(false)
        setShowExportModal(false)
        return
      }

      const [assignmentsResponse, accessIdentitiesResponse] = await Promise.all([
        fetch('/api/work-assignments'),
        fetch('/api/access-identities?includeWorks=true'),
      ])

      const assignmentsData = await assignmentsResponse.json()
      const accessIdentitiesData = await accessIdentitiesResponse.json()

      if (!assignmentsResponse.ok) throw new Error(assignmentsData.error || 'Erro ao carregar afetações')
      if (!accessIdentitiesResponse.ok) throw new Error(accessIdentitiesData.error || 'Erro ao carregar acessos')

      setAssignments(assignmentsData)
      setAccessIdentities(accessIdentitiesData.items || [])
      setAccessWorks(accessIdentitiesData.works || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value, selectedOptions } = event.target

    setForm(current => ({
      ...current,
      [name]:
        name === 'accessWorkIds'
          ? Array.from(selectedOptions, option => option.value)
          : value,
    }))
    setFormErrors(current => ({ ...current, [name]: '' }))
  }

  function validateForm() {
    if (isResponsavelView) {
      const nextErrors = {}

      if (!form.name.trim()) {
        nextErrors.name = 'O nome é obrigatório.'
      }

      setFormErrors(nextErrors)
      return Object.keys(nextErrors).length === 0
    }

    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = 'O nome é obrigatório.'
    if (form.monthlyPrice === '' || Number(form.monthlyPrice) < 0) nextErrors.monthlyPrice = 'O preço mensal não pode ser negativo.'
    if (form.price === '' || Number(form.price) < 0) {
      nextErrors.price = 'O preço hora não pode ser negativo.'
    }
    const wantsAccessConfiguration = roleNeedsAccess

    if (!form.role) nextErrors.role = 'Seleciona o role.'
    if (wantsAccessConfiguration && !form.accessUsername.trim()) nextErrors.accessUsername = 'O nome de utilizador é obrigatório.'
    if (wantsAccessConfiguration && !form.accessIdentityId && !reusableAccessIdentity && !form.accessPassword.trim()) {
      nextErrors.accessPassword = 'A palavra-passe é obrigatória.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function startCreate() {
    setForm(
      isResponsavelView
        ? {
            ...emptyPersonForm,
            role: ROLE_CARPINTEIRO,
            price: 0,
            monthlyPrice: 0,
          }
        : emptyPersonForm,
    )
    setShowForm(true)
    setError('')
    setSuccess('')
    setFormErrors({})
  }

  function startEdit(person) {
    const accessIdentity = accessIdentities.find(identity => Number(identity.personId) === Number(person.id)) || null

    setForm({
      id: person.id,
      name: person.name ?? '',
      price: person.price ?? 0,
      monthlyPrice: person.monthlyPrice ?? 0,
      role: person.role || ROLE_CARPINTEIRO,
      accessIdentityId: accessIdentity?.id || null,
      accessUsername: accessIdentity?.username || '',
      accessPassword: '',
      accessWorkIds: Array.isArray(accessIdentity?.works) ? accessIdentity.works.map(work => String(work.id)) : [],
    })
    setShowForm(true)
    setError('')
    setSuccess('')
    setFormErrors({})
  }

  function cancelForm() {
    setShowForm(false)
    setForm(emptyPersonForm)
    setFormErrors({})
  }

  function openExportModal() {
    setShowExportModal(true)
    setExportSearchTerm('')
    setError('')
    setSuccess('')
  }

  function closeExportModal() {
    setShowExportModal(false)
    setExportSearchTerm('')
  }

  function toggleExportPerson(personId) {
    setSelectedExportPersonIds(current =>
      current.includes(String(personId))
        ? current.filter(id => id !== String(personId))
        : [...current, String(personId)],
    )
  }

  function selectVisibleExportPeople() {
    setSelectedExportPersonIds(current => {
      const nextIds = new Set(current.map(String))
      filteredExportPeople.forEach(person => nextIds.add(String(person.id)))
      return Array.from(nextIds)
    })
  }

  function clearSelectedExportPeople() {
    setSelectedExportPersonIds([])
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setSubmitting(true)

    try {
      if (isResponsavelView) {
        const protectedPayload = await createProtectedPayload({ name: form.name })
        const response = await fetch('/api/people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ protectedPayload }),
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao gravar pessoa')
        }

        await loadPeople()
        setSelectedPersonId(data.id)
        setSuccess('Pessoa criada com sucesso.')
        setShowForm(false)
        setForm(emptyPersonForm)
        return
      }

      const payload = {
        name: form.name,
        price: Number(form.price),
        monthlyPrice: Number(form.monthlyPrice),
        role: form.role,
        accessIdentity: roleNeedsAccess
          ? {
              id: form.accessIdentityId,
              username: form.accessUsername,
              password: form.accessPassword,
              works: form.accessWorkIds.map(workId => Number(workId)),
            }
          : null,
      }

      const url = form.id ? `/api/people/${form.id}` : '/api/people'
      const method = form.id ? 'PUT' : 'POST'
      const protectedPayload = await createProtectedPayload(payload)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protectedPayload }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao gravar pessoa')

      await loadPeople()
      setSelectedPersonId(data.id)
      setSuccess(form.id ? 'Pessoa atualizada com sucesso.' : 'Pessoa criada com sucesso.')
      setShowForm(false)
      setForm(emptyPersonForm)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(personId) {
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/people/${personId}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao eliminar pessoa')

      await loadPeople()
      setSelectedPersonId(null)
      setSuccess('Pessoa removida com sucesso.')
      setShowForm(false)
      setForm(emptyPersonForm)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function getPeopleExportRows(sourcePeople = filteredPeople) {
    return sourcePeople.map(person => ({
      id: person.id,
      name: person.name || '',
      hourlyPrice: Number(person.price) || 0,
      monthlyPrice: Number(person.monthlyPrice) || 0,
      billingType: person.isMonthlyBilling ? 'Mensal' : 'Horária',
      roleLabel: getRoleLabel(person.role),
    }))
  }

  function handleExportExcel() {
    const rows = getPeopleExportRows(exportPeople)

    if (exportSelectionMode === 'selected' && exportPeople.length === 0) {
      setError('Seleciona pelo menos uma pessoa para exportar.')
      setSuccess('')
      return
    }

    if (rows.length === 0) {
      setError('Não existem pessoas para exportar.')
      setSuccess('')
      return
    }

    setError('')
    setSuccess('')
    setExporting(true)

    try {
      const hoursGrid = buildPeopleHoursGrid(exportMonthKey, exportPeople, assignments)
      const excelDocument = buildPeopleExcelDocument(
        rows,
        exportSummary,
        formatDateLabel(getExportDateLabel()),
        hoursGrid,
      )
      const blob = new Blob([`\ufeff${excelDocument}`], {
        type: 'application/vnd.ms-excel;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `pessoas-${getExportDateLabel()}-${exportMonthKey}.xls`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setSuccess('Exportação para Excel concluída.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível preparar a exportação Excel.')
      setSuccess('')
    } finally {
      setExporting(false)
    }
  }

  function handleExportPdf() {
    const rows = getPeopleExportRows(exportPeople)

    if (exportSelectionMode === 'selected' && exportPeople.length === 0) {
      setError('Seleciona pelo menos uma pessoa para exportar.')
      setSuccess('')
      return
    }

    if (rows.length === 0) {
      setError('Não existem pessoas para exportar.')
      setSuccess('')
      return
    }

    setError('')
    setSuccess('')
    setExporting(true)

    try {
      const hoursGrid = buildPeopleHoursGrid(exportMonthKey, exportPeople, assignments)
      const pdfBytes = buildPeoplePdfDocument(
        rows,
        exportSummary,
        formatDateLabel(getExportDateLabel()),
        hoursGrid,
      )
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `pessoas-${getExportDateLabel()}-${exportMonthKey}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setError('')
      setSuccess('Exportação para PDF concluída.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível preparar a exportação PDF.')
      setSuccess('')
    } finally {
      setExporting(false)
    }
  }

  function handlePrintResponsavelDocumentAlerts() {
    if (responsavelDocumentAlertPeople.length === 0) {
      setError('Nao existem pessoas com documentos a rever.')
      setSuccess('')
      return
    }

    const printDocument = buildResponsavelDocumentReviewPrintDocument(
      responsavelDocumentAlertPeople,
      formatDateLabel(getExportDateLabel()),
    )

    const printFrame = document.createElement('iframe')
    printFrame.setAttribute('aria-hidden', 'true')
    printFrame.style.position = 'fixed'
    printFrame.style.right = '0'
    printFrame.style.bottom = '0'
    printFrame.style.width = '0'
    printFrame.style.height = '0'
    printFrame.style.border = '0'
    printFrame.style.opacity = '0'
    printFrame.style.pointerEvents = 'none'

    const cleanup = () => {
      window.setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame)
        }
      }, 0)
    }

    document.body.appendChild(printFrame)

    const frameWindow = printFrame.contentWindow
    const frameDocument = frameWindow?.document

    if (!frameWindow || !frameDocument) {
      cleanup()
      setError('Nao foi possivel abrir a folha de impressao.')
      setSuccess('')
      return
    }

    const handleAfterPrint = () => {
      frameWindow.removeEventListener('afterprint', handleAfterPrint)
      cleanup()
    }

    frameWindow.addEventListener('afterprint', handleAfterPrint)
    frameDocument.open()
    frameDocument.write(printDocument)
    frameDocument.close()

    window.setTimeout(() => {
      frameWindow.focus()
      frameWindow.print()
    }, 250)

    window.setTimeout(cleanup, 2000)
    setError('')
    setSuccess('')
  }

  function renderPersonRow(person) {
    if (isResponsavelView) {
      return (
        <Link
          href={`/people/${person.id}`}
          key={person.id}
          style={responsavelPersonRowStyle}
        >
          <strong>{person.name}</strong>
        </Link>
      )
    }

    const selected = Number(selectedPerson?.id) === Number(person.id)

    return (
      <button
        key={person.id}
        type="button"
        onClick={() => setSelectedPersonId(person.id)}
        onDoubleClick={() => router.push(`/people/${person.id}`)}
        title="Clique para selecionar. Faz duplo clique para abrir a página da pessoa."
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '16px',
          borderRadius: '16px',
          border: selected ? '1px solid var(--vp-accent)' : '1px solid var(--vp-border)',
          background: selected ? 'var(--vp-highlight)' : 'var(--vp-surface)',
          cursor: 'pointer',
        }}
        >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
          <strong>{person.name}</strong>
          {!isWorkerRole(person.role) && (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'var(--vp-accent)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {getRoleLabel(person.role)}
            </span>
          )}
        </div>
        {person.isMonthlyBilling ? (
          <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>Mensal: {person.monthlyPrice || 0}</p>
        ) : (
          <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>Preço hora: {person.price || 0}/h</p>
        )}
      </button>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/" style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}>
            Voltar ao menu
          </Link>
          {canManagePeople && (
            <p style={{ margin: '18px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: 'var(--vp-text-soft)' }}>
              Gestão de pessoas
            </p>
          )}
          <h1 style={{ margin: '10px 0 12px', fontSize: '46px', lineHeight: 1.05 }}>
            {viewerRole === null ? 'Gestão de pessoas' : isResponsavelView ? 'Lista de pessoas' : 'Gestão e manutenção de pessoas'}
          </h1>
        </section>

        {canManagePeople && (
          <section style={topBarStyle}>
            <div style={statGridStyle}>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Pessoas totais</div>
                <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{people.length}</div>
              </article>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Mensais</div>
                <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{monthlyPeople.length}</div>
              </article>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Horárias</div>
                <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{hourlyPeople.length}</div>
              </article>
            </div>

            <div style={buttonGroupStyle}>
              <label style={{ display: 'none', gap: '6px', fontSize: '12px', color: 'var(--vp-text-soft)' }}>
                Mês da exportação
                <input
                  type="month"
                  value={exportMonthKey}
                  onChange={event => setExportMonthKey(event.target.value || getCurrentMonthKey())}
                  onClick={openNativeMonthPicker}
                  style={{ ...inputStyle, marginTop: 0, minWidth: '170px' }}
                />
              </label>
              <button type="button" onClick={openExportModal} style={secondaryButtonStyle}>
                Exportar
              </button>
              <button type="button" onClick={startCreate} style={primaryButtonStyle}>
                Adicionar pessoa
              </button>
            </div>
          </section>
        )}

        {!showForm && error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}
        {!showForm && success && <p style={{ margin: 0, color: '#1f7a45' }}>{success}</p>}

        {canManagePeople && showForm && (
          <section style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>{form.id ? 'Editar pessoa' : 'Adicionar nova pessoa'}</h2>
              </div>
              <button type="button" onClick={cancelForm} style={closeButtonStyle} aria-label="Fechar">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <p style={formSectionTitleStyle}>Dados da pessoa</p>
                <div
                  style={{
                    ...primaryFieldsRowStyle,
                    gridTemplateColumns: '420px 220px 220px 220px',
                  }}
                >
                <label style={{ ...mediumFieldStyle, maxWidth: '420px' }}>
                  Nome
                  <input type="text" name="name" value={form.name} onChange={handleChange} style={inputStyle} />
                  {formErrors.name && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.name}</span>}
                </label>

                <label style={compactFieldStyle}>
                  Preço mensal
                  <input
                    type="number"
                    name="monthlyPrice"
                    min="0"
                    step="0.01"
                    value={form.monthlyPrice}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                  {formErrors.monthlyPrice && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.monthlyPrice}</span>}
                </label>

                <label style={compactFieldStyle}>
                  Função
                  <select name="role" value={form.role} onChange={handleChange} style={inputStyle}>
                    <option value={ROLE_ADMIN}>Administrador</option>
                    <option value={ROLE_RESPONSAVEL}>Responsável</option>
                    <option value={ROLE_CHEF_PRIMEIRA}>Chefe de primeira</option>
                    <option value={ROLE_CHEF_SEGUNDA}>Chefe de segunda</option>
                    <option value={ROLE_CARPINTEIRO}>Carpinteiro</option>
                    <option value={ROLE_FERRAJEIRO}>Ferrajeiro</option>
                    <option value={ROLE_TROLHA}>Trolha</option>
                    <option value={ROLE_GRUISTA}>Gruista</option>
                  </select>
                  {formErrors.role && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.role}</span>}
                </label>

                  <label style={compactFieldStyle}>
                    Preço hora
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                    {formErrors.price && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.price}</span>}
                  </label>
                </div>
              </div>

              {roleNeedsAccess && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <p style={formSectionTitleStyle}>Acesso à aplicação</p>
                  <div style={{ ...personFormGridStyle, columnGap: '32px' }}>
                    <label style={mediumFieldStyle}>
                      Nome de utilizador
                      <input type="text" name="accessUsername" value={form.accessUsername} onChange={handleChange} style={inputStyle} />
                      {formErrors.accessUsername && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.accessUsername}</span>}
                    </label>

                    <label style={mediumFieldStyle}>
                      Palavra-passe
                      <input type="text" name="accessPassword" value={form.accessPassword} onChange={handleChange} style={inputStyle} />
                      {(form.accessIdentityId || reusableAccessIdentity) && (
                        <span style={{ display: 'block', marginTop: '6px', color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                          Deixa em branco para manter a password atual.
                        </span>
                      )}
                      {formErrors.accessPassword && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.accessPassword}</span>}
                    </label>

                    {formUsesWorkScope && (
                      <label style={{ ...labelStyle, ...wideFieldStyle }}>
                        Obras permitidas
                        <select
                          multiple
                          name="accessWorkIds"
                          value={form.accessWorkIds}
                          onChange={handleChange}
                          style={{ ...inputStyle, minHeight: '180px' }}
                        >
                          {accessWorks.map(work => (
                            <option key={work.id} value={work.id}>
                              #{work.number} - {work.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}
              {success && <p style={{ margin: 0, color: '#1f7a45' }}>{success}</p>}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="submit" disabled={submitting} style={primaryButtonStyle}>
                  {submitting ? 'A gravar...' : form.id ? 'Guardar alterações' : 'Criar pessoa'}
                </button>
                {form.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(form.id)}
                    disabled={submitting}
                    style={dangerButtonStyle}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </form>
          </section>
        )}

        <div style={canManagePeople ? layoutStyle : { display: 'grid' }}>
          <section style={panelStyle}>
            <div style={isResponsavelView ? responsavelListHeaderStyle : {}}>
              <h2 style={{ marginTop: 0, marginBottom: isResponsavelView ? 0 : undefined }}>Lista de pessoas</h2>
            </div>

            {isResponsavelView && showForm && (
              <form onSubmit={handleSubmit} style={responsavelCreateFormStyle}>
                <label style={labelStyle}>
                  Nome
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nome da pessoa"
                    style={inputStyle}
                  />
                  {formErrors.name && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.name}</span>}
                </label>

                {error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}

                <div style={responsavelCreateActionsStyle}>
                  <button type="button" onClick={cancelForm} style={secondaryButtonStyle}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitting} style={primaryButtonStyle}>
                    {submitting ? 'A gravar...' : 'Guardar'}
                  </button>
                </div>
              </form>
            )}

            {loading && <p>A carregar pessoas...</p>}
            {!loading && error && !(isResponsavelView && showForm) && <p style={{ color: '#b42318' }}>{error}</p>}
            {!loading && (!error || (isResponsavelView && showForm)) && people.length === 0 && <p>Sem pessoas registadas.</p>}
            {!loading && (!error || (isResponsavelView && showForm)) && people.length > 0 && (
              <>
                {isResponsavelView && responsavelDocumentAlertPeople.length > 0 && (
                  <div style={responsavelAlertListWrapStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#b42318' }}>
                        Documentos a rever
                      </div>
                      <button type="button" onClick={handlePrintResponsavelDocumentAlerts} style={dangerButtonStyle}>
                        Imprimir folha
                      </button>
                    </div>
                    <div style={responsavelAlertListStyle}>
                      {responsavelDocumentAlertPeople.map(person => (
                        <Link key={`alert-${person.id}`} href={`/people/${person.id}`} style={responsavelAlertLinkStyle}>
                          <p style={responsavelAlertNameStyle}>{person.name}</p>
                          <p style={responsavelAlertMetaStyle}>
                            {person.documentAlertLabel}
                            {person.documentAlertCount > 1 ? ` · ${person.documentAlertCount} documentos` : ''}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  type="search"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Pesquisar pessoa pelo nome"
                  style={searchInputStyle}
                />

                {filteredPeople.length === 0 ? (
                  <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>Nenhuma pessoa encontrada com esse nome.</p>
                ) : (
                  <div style={isResponsavelView ? responsavelPeopleListStyle : peopleListStyle}>
                    {filteredPeople.map(renderPersonRow)}
                  </div>
                )}
              </>
            )}
          </section>

          {canManagePeople && (
            <section style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Detalhe da pessoa</h2>
              {!selectedPerson && <p>Seleciona uma pessoa para veres o detalhe.</p>}
              {selectedPerson && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '30px' }}>{selectedPerson.name}</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => startEdit(selectedPerson)}
                        style={iconButtonStyle}
                        title="Editar pessoa"
                        aria-label="Editar pessoa"
                    >
                        <EditPencilIcon />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <article style={statCardStyle}>
                      <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Tipo</div>
                      <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>
                        {selectedPerson.isMonthlyBilling ? 'Mensal' : 'Horária'}
                      </div>
                    </article>
                    {!selectedPerson.isMonthlyBilling && (
                      <article style={statCardStyle}>
                        <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Preço hora</div>
                        <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{selectedPerson.price || 0}/h</div>
                      </article>
                    )}
                    {selectedPerson.isMonthlyBilling && (
                      <article style={statCardStyle}>
                        <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Preço mensal</div>
                        <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>
                          {selectedPerson.monthlyPrice || 0}
                        </div>
                      </article>
                    )}
                    <article style={statCardStyle}>
                      <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Função</div>
                      <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>
                        {getRoleLabel(selectedPerson.role)}
                      </div>
                    </article>
                  </div>

                  {(roleRequiresAppAccess(selectedPerson.role) || selectedAccessIdentity) && (
                    <article style={statCardStyle}>
                      <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Acesso à aplicação</div>
                      <div style={{ marginTop: '8px', display: 'grid', gap: '8px' }}>
                        <div>
                          <strong>Nome de utilizador:</strong> {selectedAccessIdentity?.username || 'Sem acesso configurado'}
                        </div>
                        {roleUsesWorkScope(selectedPerson.role) && (
                          <div>
                            <strong>Obras:</strong>{' '}
                            {selectedAccessIdentity?.works?.length
                              ? selectedAccessIdentity.works.map(work => work.name || `Obra ${work.id}`).join(', ')
                              : 'Sem obras atribuídas'}
                          </div>
                        )}
                      </div>
                    </article>
                  )}

                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '24px' }}>Histórico mensal</h3>
                    </div>

                    {monthlyAssignmentSummary.length === 0 && (
                      <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>
                        Sem afetações registadas para esta pessoa.
                      </p>
                    )}

                    {monthlyAssignmentSummary.map(month => (
                      <details
                        key={month.monthKey}
                        style={{
                          border: '1px solid var(--vp-border)',
                          borderRadius: '18px',
                          background: 'var(--vp-surface)',
                          padding: '16px',
                        }}
                      >
                        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                          {month.label} | {month.totalHours}h
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
                                <strong>{formatDateLabel(day.date)}</strong>
                                <span style={{ color: 'var(--vp-text-muted)' }}>{day.totalHours}h</span>
                              </div>

                              <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                                {day.works.map(work => (
                                  <div
                                    key={`${day.date}-${work.name}`}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      gap: '12px',
                                      padding: '10px 12px',
                                      borderRadius: '12px',
                                      background: 'var(--vp-surface)',
                                    }}
                                  >
                                    <span>{work.name}</span>
                                    <strong>{work.hours}h</strong>
                                  </div>
                                ))}
                              </div>
                            </article>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {canManagePeople && showExportModal && (
        <div style={modalBackdropStyle} onClick={closeExportModal}>
          <section style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>Exportar pessoas</h2>
              </div>
              <button type="button" onClick={closeExportModal} style={closeButtonStyle} aria-label="Fechar">
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '18px' }}>
              <label style={{ ...labelStyle, maxWidth: '200px' }}>
                Mês da folha
                <input
                  type="month"
                  value={exportMonthKey}
                  onChange={event => setExportMonthKey(event.target.value || getCurrentMonthKey())}
                  onClick={openNativeMonthPicker}
                  style={{ ...inputStyle, minHeight: '52px', fontSize: '16px', width: '200px' }}
                />
              </label>

              <div style={{ ...panelStyle, padding: '16px', boxShadow: 'none' }}>
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Resumo</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{exportSummary.total}</div>
                <div style={{ marginTop: '4px', color: 'var(--vp-text-muted)' }}>
                  {exportSelectionMode === 'all' ? 'todas as pessoas' : 'pessoas selecionadas'}
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--vp-text-muted)' }}>
                  {formatMonthLabel(exportMonthKey)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <input
                  type="radio"
                  name="exportSelectionMode"
                  checked={exportSelectionMode === 'all'}
                  onChange={() => setExportSelectionMode('all')}
                />
                Todos
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <input
                  type="radio"
                  name="exportSelectionMode"
                  checked={exportSelectionMode === 'selected'}
                  onChange={() => setExportSelectionMode('selected')}
                />
                Selecionar pessoas
              </label>
            </div>

            {exportSelectionMode === 'selected' && (
              <div style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Selecionar pessoas</h3>
                    <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)' }}>
                      Marca apenas as pessoas que queres incluir nesta exportação.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={selectVisibleExportPeople} style={mutedButtonStyle}>
                      Selecionar visíveis
                    </button>
                    <button type="button" onClick={clearSelectedExportPeople} style={mutedButtonStyle}>
                      Limpar seleção
                    </button>
                  </div>
                </div>

                <input
                  type="search"
                  value={exportSearchTerm}
                  onChange={event => setExportSearchTerm(event.target.value)}
                  placeholder="Pesquisar pessoa pelo nome"
                  style={{ ...inputStyle, marginTop: 0 }}
                />

                <div style={{ display: 'grid', gap: '12px', maxHeight: '360px', overflowY: 'auto', paddingRight: '6px' }}>
                  {filteredExportPeople.map(person => {
                    const checked = selectedExportPersonIds.includes(String(person.id))

                    return (
                      <label
                        key={person.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '16px',
                          borderRadius: '16px',
                          border: checked ? '1px solid var(--vp-accent)' : '1px solid var(--vp-border)',
                          background: checked ? 'var(--vp-highlight)' : 'var(--vp-surface)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleExportPerson(person.id)}
                          />
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ display: 'block' }}>{person.name}</strong>
                            <span style={{ color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                              {getRoleLabel(person.role)}
                            </span>
                          </div>
                        </div>
                        <span style={{ color: 'var(--vp-text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          #{person.id}
                        </span>
                      </label>
                    )
                  })}

                  {filteredExportPeople.length === 0 && (
                    <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>Nenhuma pessoa encontrada com esse nome.</p>
                  )}
                </div>
              </div>
            )}

            {(error || success) && (
              <div style={{ display: 'grid', gap: '8px', marginTop: '18px' }}>
                {error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}
                {success && <p style={{ margin: 0, color: '#1f7a45' }}>{success}</p>}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '22px' }}>
              <button type="button" onClick={handleExportPdf} disabled={loading || exporting} style={secondaryButtonStyle}>
                {exporting ? 'A preparar...' : 'Exportar PDF'}
              </button>
              <button type="button" onClick={handleExportExcel} disabled={loading || exporting} style={primaryButtonStyle}>
                {exporting ? 'A preparar...' : 'Exportar Excel'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}



