'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import EditPencilIcon, { editPencilButtonStyle } from '../components/EditPencilIcon'
import {
  BentixContent,
  BentixOverflowX,
  BentixPage,
  BentixResponsiveGrid,
  BentixSection,
} from '../components/ViewportLayout.js'
import {
  deleteClient as deleteClientRequest,
  listClients,
  saveClient as saveClientRequest,
} from '../../frontend/controllers/clients-controller.js'
import {
  deleteWork as deleteWorkRequest,
  listWorks,
  saveWork as saveWorkRequest,
} from '../../frontend/controllers/works-controller.js'
import { listWorkAssignments } from '../../frontend/controllers/work-assignments-controller.js'
import { getFinancialSummaryCost, getFinancialSummaryHours } from '../../lib/work-financial-summary.js'
import { getNextWorkNumber } from '../../lib/work-numbering.js'
import { buildWorkPricingSnapshot, hasWorkPricingChanges } from '../../lib/work-pricing.js'

const pageStyle = {
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: 'var(--btx-font-family)',
}

const shellStyle = {
  '--btx-content-gap': '24px',
}

const contentFlowStyle = {
  display: 'grid',
  gap: '24px',
  minWidth: 0,
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
  display: 'grid',
  gap: '16px',
  alignItems: 'start',
}

const statGridStyle = {
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

const panelStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-panel)',
  minWidth: 0,
}

const clientOverviewGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '24px',
}

const clientFilterListStyle = {
  display: 'grid',
  gap: '10px',
  marginTop: '18px',
}

const clientSummaryPanelStyle = {
  ...panelStyle,
  display: 'grid',
  gap: '12px',
  alignContent: 'start',
}

const clientHeaderActionsStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
}

const clientInfoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: '12px',
}

const clientInfoCardStyle = {
  borderRadius: '16px',
  padding: '14px 16px',
  background: 'var(--vp-surface)',
  border: '1px solid var(--vp-border)',
  display: 'grid',
  gap: '6px',
}

const clientCardContentStyle = {
  display: 'flex',
  gap: '12px',
  marginTop: '18px',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const annualSummaryTableWrapStyle = {
  borderRadius: '18px',
  border: '1px solid var(--vp-border)',
}

const annualSummaryTableStyle = {
  width: '100%',
  minWidth: '620px',
  borderCollapse: 'collapse',
  background: 'var(--vp-surface)',
}

const annualSummaryHeaderCellStyle = {
  padding: '14px 16px',
  borderBottom: '1px solid var(--vp-border)',
  textAlign: 'left',
  fontSize: '12px',
  color: 'var(--vp-text-soft)',
  textTransform: 'uppercase',
}

const annualSummaryCellStyle = {
  padding: '14px 16px',
  borderBottom: '1px solid var(--vp-border)',
  color: 'var(--vp-text-muted)',
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
  width: 'min(980px, 100%)',
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  background: 'var(--vp-surface-soft-strong)',
  border: '1px solid var(--vp-border)',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-modal)',
}

const inputStyle = {
  width: '100%',
  marginTop: '8px',
  padding: '12px 14px',
  boxSizing: 'border-box',
  borderRadius: '12px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface-muted)',
  fontSize: '14px',
}

const notesTextareaStyle = {
  ...inputStyle,
  minHeight: '72px',
  resize: 'none',
  overflow: 'hidden',
}

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 700,
}

const infoBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '18px',
  height: '18px',
  borderRadius: '999px',
  background: '#1d4ed8',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 800,
  lineHeight: 1,
  flexShrink: 0,
}

const inlineInfoLabelStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
}

const infoNoteRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  margin: '12px 0 0',
  fontSize: '13px',
  color: 'var(--vp-text-muted)',
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

const heroPrimaryButtonStyle = {
  ...primaryButtonStyle,
  width: '188px',
  textAlign: 'center',
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

const workDayOptions = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'TerÃ§a' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'SÃ¡bado' },
  { value: 'sunday', label: 'Domingo' },
]

const rolePriceOptions = [
  { value: 'chef_primeira', label: 'Chefe' },
  { value: 'chef_segunda', label: 'Chefe de segunda' },
  { value: 'carpinteiro', label: 'Carpinteiro' },
  { value: 'ferrajeiro', label: 'Ferrajeiro' },
  { value: 'trolha', label: 'Trolha' },
  { value: 'gruista', label: 'Gruista' },
]

const defaultWorkingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const workStatusLabels = {
  planned: 'Planeada',
  in_progress: 'Em curso',
  paused: 'Em pausa',
  completed: 'ConcluÃ­da',
}

const workingDaysGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '10px',
  marginTop: '8px',
}

const workingDayOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 12px',
  borderRadius: '12px',
  background: 'var(--vp-surface-muted)',
  border: '1px solid var(--vp-border)',
  fontWeight: 700,
}

const emptyWorkForm = {
  id: null,
  number: '',
  name: '',
  clientId: '',
  location: '',
  status: 'planned',
  budget: '',
  defaultHourlyCost: '',
  roleHourlyCosts: {},
  specialPersonHourlyCosts: {},
  startDate: '',
  endDate: '',
  workingDays: defaultWorkingDays,
  notes: '',
}

const emptyClientForm = {
  id: null,
  name: '',
  vatNumber: '',
  contactName: '',
  email: '',
  phone: '',
  notes: '',
}

const emptyWorkPricingSnapshot = buildWorkPricingSnapshot(emptyWorkForm)

function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPricingApplicationStartDate(mode) {
  const today = new Date()

  if (mode === 'month_start') {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  }

  if (mode === 'next_month') {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    return toDateInputValue(nextMonth)
  }

  return toDateInputValue(today)
}

function autoResizeTextarea(textarea) {
  if (!textarea) return
  textarea.style.height = '72px'
  textarea.style.height = `${Math.max(textarea.scrollHeight, 72)}px`
}

function getWorkStatusLabel(status) {
  return workStatusLabels[String(status || '').trim()] || workStatusLabels.planned
}

function getAssignmentEstimatedHours(assignment) {
  return getFinancialSummaryHours(assignment)
}

function getAssignmentEstimatedCost(assignment) {
  return getFinancialSummaryCost(assignment)
}

function formatMonthSummaryLabel(year, monthIndex) {
  return new Intl.DateTimeFormat('pt-PT', { month: 'long' }).format(new Date(year, monthIndex, 1))
}

function formatShortMonthSummaryLabel(year, monthIndex) {
  return new Intl.DateTimeFormat('pt-PT', { month: 'short' })
    .format(new Date(year, monthIndex, 1))
    .replace('.', '')
}

function formatSummaryNumber(value) {
  const normalizedValue = Number(value) || 0
  return Number.isInteger(normalizedValue) ? String(normalizedValue) : normalizedValue.toFixed(2)
}

function formatSummaryCurrency(value) {
  const normalizedValue = Number.isFinite(Number(value)) ? Number(value) : 0

  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalizedValue)
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatEmissionDate(value = new Date()) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(value)
}

function buildClientAnnualSummaryRows(assignments, works, clientId, year) {
  if (!Array.isArray(assignments) || !clientId) {
    return []
  }

  const selectedClientWorkIds = new Set(
    works
      .filter(work => String(work.clientId) === String(clientId))
      .map(work => Number(work.id)),
  )

  const monthlyRows = Array.from({ length: 12 }, (_, monthIndex) => ({
    monthKey: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
    monthLabel: formatMonthSummaryLabel(year, monthIndex),
    totalHours: 0,
    estimatedCost: 0,
    workIds: new Set(),
  }))

  assignments.forEach(assignment => {
    const workId = Number(assignment?.workId)
    if (!selectedClientWorkIds.has(workId)) {
      return
    }

    const dateValue = String(assignment?.date || '')
    if (!dateValue.startsWith(`${year}-`)) {
      return
    }

    const monthNumber = Number.parseInt(dateValue.slice(5, 7), 10)
    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return
    }

    const targetMonth = monthlyRows[monthNumber - 1]
    targetMonth.totalHours = Number((targetMonth.totalHours + getAssignmentEstimatedHours(assignment)).toFixed(2))
    targetMonth.estimatedCost = Number((targetMonth.estimatedCost + getAssignmentEstimatedCost(assignment)).toFixed(2))
    targetMonth.workIds.add(workId)
  })

  return monthlyRows.map(row => ({
    monthKey: row.monthKey,
    monthLabel: row.monthLabel,
    totalHours: row.totalHours,
    estimatedCost: row.estimatedCost,
    workCount: row.workIds.size,
  }))
}

function buildClientAnnualSummaryTotals(rows) {
  return rows.reduce(
    (totals, row) => ({
      totalHours: Number((totals.totalHours + Number(row.totalHours || 0)).toFixed(2)),
      totalEstimatedCost: Number((totals.totalEstimatedCost + Number(row.estimatedCost || 0)).toFixed(2)),
    }),
    { totalHours: 0, totalEstimatedCost: 0 },
  )
}

function buildGeneralAnnualSummaryRows(assignments, clients, works, year) {
  if (!Array.isArray(assignments) || !Array.isArray(clients) || clients.length === 0) {
    return []
  }

  return clients.map(client => {
    const rows = buildClientAnnualSummaryRows(assignments, works, client.id, year)
    const totals = buildClientAnnualSummaryTotals(rows)

    return {
      client,
      months: rows,
      totals,
    }
  })
}

function buildGeneralAnnualSummaryGrandTotals(rows, monthHeaders) {
  const monthlyTotals = monthHeaders.map(monthHeader => ({
    monthKey: monthHeader.monthKey,
    totalHours: 0,
    totalEstimatedCost: 0,
  }))

  rows.forEach(row => {
    row.months.forEach((month, monthIndex) => {
      monthlyTotals[monthIndex].totalHours = Number((monthlyTotals[monthIndex].totalHours + Number(month.totalHours || 0)).toFixed(2))
      monthlyTotals[monthIndex].totalEstimatedCost = Number((monthlyTotals[monthIndex].totalEstimatedCost + Number(month.estimatedCost || 0)).toFixed(2))
    })
  })

  const annualTotals = rows.reduce(
    (totals, row) => ({
      totalHours: Number((totals.totalHours + Number(row.totals.totalHours || 0)).toFixed(2)),
      totalEstimatedCost: Number((totals.totalEstimatedCost + Number(row.totals.totalEstimatedCost || 0)).toFixed(2)),
    }),
    { totalHours: 0, totalEstimatedCost: 0 },
  )

  return {
    monthlyTotals,
    annualTotals,
  }
}

function buildClientAnnualSummaryPrintDocument(client, year, rows, totals) {
  const issuedAt = formatEmissionDate()
  const tableRows = rows.map(row => `
    <tr>
      <td>${escapeHtml(row.monthLabel)}</td>
      <td>${escapeHtml(formatSummaryNumber(row.totalHours))}</td>
      <td>${escapeHtml(formatSummaryCurrency(row.estimatedCost))}</td>
      <td>${escapeHtml(String(row.workCount))}</td>
    </tr>
  `).join('')

  return `
    <!doctype html>
    <html lang="pt">
      <head>
        <meta charset="utf-8" />
        <title>Resumo anual cliente ${escapeHtml(client?.name || '')}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: #10233e;
            background: #ffffff;
          }
          .sheet {
            display: grid;
            gap: 20px;
          }
          .header {
            display: grid;
            gap: 8px;
          }
          .eyebrow {
            margin: 0;
            font-size: 12px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 800;
          }
          h1 {
            margin: 0;
            font-size: 28px;
            line-height: 1.1;
          }
          .meta {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
          }
          .meta-card {
            border: 1px solid #d8e1ee;
            border-radius: 16px;
            padding: 14px 16px;
            background: #f8fbff;
          }
          .meta-label {
            margin: 0;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #64748b;
            font-weight: 800;
          }
          .meta-value {
            margin: 8px 0 0;
            font-size: 18px;
            font-weight: 800;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #d8e1ee;
            padding: 12px 14px;
            text-align: left;
            font-size: 13px;
          }
          thead th {
            background: #eef4fb;
            color: #47617d;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 11px;
          }
          tfoot td {
            font-weight: 800;
            background: #f6efe8;
          }
          .align-right {
            text-align: right;
          }
          @media print {
            body {
              padding: 18px;
            }
          }
        </style>
      </head>
      <body>
        <section class="sheet">
          <header class="header">
            <p class="eyebrow">Resumo anual por cliente</p>
            <h1>${escapeHtml(client?.name || 'Cliente')}</h1>
          </header>

          <section class="meta">
              <p class="meta-label">Ano</p>
              <p class="meta-value">${escapeHtml(String(year))}</p>
            </article>
            <article class="meta-card">
              <p class="meta-label">Data de emissÃ£o</p>
              <p class="meta-value">${escapeHtml(issuedAt)}</p>
            </article>
            <article class="meta-card">
              <p class="meta-label">Contacto</p>
              <p class="meta-value">${escapeHtml(client?.contactName || client?.email || client?.phone || 'Sem contacto')}</p>
            </article>
          </section>

          <table>
            <thead>
              <tr>
                <th>MÃªs</th>
                <th>Total de horas</th>
                <th>Custo estimado</th>
                <th>Obras envolvidas</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
            <tfoot>
              <tr>
                <td>Total anual</td>
                <td>${escapeHtml(formatSummaryNumber(totals.totalHours))}</td>
                <td>${escapeHtml(formatSummaryCurrency(totals.totalEstimatedCost))}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </section>
      </body>
    </html>
  `
}

function buildGeneralAnnualSummaryPrintDocument(year, monthHeaders, rows, grandTotals) {
  const tableHeader = monthHeaders.map(month => `<th>${escapeHtml(month.monthLabel)}</th>`).join('')
  const tableRows = rows.map(row => {
    const monthCells = row.months.map(month => `
      <td>
        <div class="month-cell">
          <strong>${escapeHtml(formatSummaryNumber(month.totalHours))}h</strong>
          <span>${escapeHtml(formatSummaryCurrency(month.estimatedCost))}</span>
        </div>
      </td>
    `).join('')

    return `
      <tr>
        <td class="client-name">${escapeHtml(row.client.name)}</td>
        ${monthCells}
        <td>${escapeHtml(formatSummaryNumber(row.totals.totalHours))}</td>
        <td>${escapeHtml(formatSummaryCurrency(row.totals.totalEstimatedCost))}</td>
      </tr>
    `
  }).join('')

  const totalsRow = grandTotals.monthlyTotals.map(month => `
    <td>
      <div class="month-cell">
        <strong>${escapeHtml(formatSummaryNumber(month.totalHours))}h</strong>
        <span>${escapeHtml(formatSummaryCurrency(month.totalEstimatedCost))}</span>
      </div>
    </td>
  `).join('')

  return `
    <!doctype html>
    <html lang="pt">
      <head>
        <meta charset="utf-8" />
        <title>Resumo Anual de Clientes</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 24px;
            font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: #10233e;
            background: #ffffff;
          }
          .sheet {
            display: grid;
            gap: 18px;
          }
          .header {
            display: grid;
            gap: 8px;
          }
          .eyebrow {
            margin: 0;
            font-size: 12px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 800;
          }
          h1 {
            margin: 0;
            font-size: 28px;
            line-height: 1.1;
          }
          .meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .meta-card {
            border: 1px solid #d8e1ee;
            border-radius: 16px;
            padding: 14px 16px;
            background: #f8fbff;
          }
          .meta-label {
            margin: 0;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #64748b;
            font-weight: 800;
          }
          .meta-value {
            margin: 8px 0 0;
            font-size: 18px;
            font-weight: 800;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #d8e1ee;
            padding: 10px 8px;
            text-align: center;
            font-size: 11px;
            vertical-align: middle;
          }
          thead th {
            background: #eef4fb;
            color: #47617d;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 10px;
          }
          th:first-child, td:first-child {
            text-align: left;
            width: 180px;
          }
          th:last-child, td:last-child,
          th:nth-last-child(2), td:nth-last-child(2) {
            width: 86px;
          }
          .client-name {
            font-weight: 800;
          }
          .month-cell {
            display: grid;
            gap: 4px;
          }
          .month-cell strong {
            font-size: 11px;
          }
          .month-cell span {
            color: #64748b;
            font-size: 10px;
          }
          tfoot td {
            font-weight: 800;
            background: #f6efe8;
          }
          @page {
            size: landscape;
            margin: 14mm;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <section class="sheet">
          <section class="meta">
            <article class="meta-card">
              <p class="meta-label">Ano de referÃªncia</p>
              <p class="meta-value">${escapeHtml(String(year))}</p>
            </article>
          </section>

          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                ${tableHeader}
                <th>Total anual de horas</th>
                <th>Total anual de custo</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
            <tfoot>
              <tr>
                <td>Totais gerais</td>
                ${totalsRow}
                <td>${escapeHtml(formatSummaryNumber(grandTotals.annualTotals.totalHours))}</td>
                <td>${escapeHtml(formatSummaryCurrency(grandTotals.annualTotals.totalEstimatedCost))}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      </body>
    </html>
  `
}

function getClientCardStyle(isSelected) {
  return {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: '16px',
    border: isSelected ? '1px solid var(--vp-accent)' : '1px solid var(--vp-border)',
    background: isSelected ? 'var(--vp-highlight)' : 'var(--vp-surface)',
    minHeight: '56px',
  }
}

function getClientFilterButtonStyle() {
  return {
    flex: 1,
    textAlign: 'left',
    padding: 0,
    borderRadius: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'block',
  }
}

function getClientEditButtonStyle(isSelected) {
  return {
    ...iconButtonStyle,
    width: '34px',
    height: '34px',
    border: isSelected ? '1px solid var(--vp-accent)' : '1px solid var(--vp-border)',
    background: 'var(--vp-surface)',
    borderRadius: '999px',
    flexShrink: 0,
  }
}

function getClientIdFromLocation() {
  if (typeof window === 'undefined') {
    return ''
  }

  return new URLSearchParams(window.location.search).get('clientId') || ''
}

export function WorksPageView({ forcedClientId = '', dedicatedClientView = false }) {
  const router = useRouter()
  const [works, setWorks] = useState([])
  const [clients, setClients] = useState([])
  const [selectedClientId, setSelectedClientId] = useState(() => String(forcedClientId || ''))
  const [showAnnualSummary, setShowAnnualSummary] = useState(false)
  const [showGeneralAnnualSummary, setShowGeneralAnnualSummary] = useState(false)
  const [annualAssignments, setAnnualAssignments] = useState(null)
  const [annualSummaryLoading, setAnnualSummaryLoading] = useState(false)
  const [annualSummaryError, setAnnualSummaryError] = useState('')
  const [exportingClientPdf, setExportingClientPdf] = useState(false)
  const [exportingGeneralAnnualPdf, setExportingGeneralAnnualPdf] = useState(false)
  const [showClientForm, setShowClientForm] = useState(false)
  const [clientSubmitting, setClientSubmitting] = useState(false)
  const [clientFormError, setClientFormError] = useState('')
  const [clientFormErrors, setClientFormErrors] = useState({})
  const [clientForm, setClientForm] = useState(emptyClientForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [form, setForm] = useState(emptyWorkForm)
  const [originalPricingSnapshot, setOriginalPricingSnapshot] = useState(emptyWorkPricingSnapshot)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPricingChangeModal, setShowPricingChangeModal] = useState(false)
  const [pendingWorkPayload, setPendingWorkPayload] = useState(null)
  const [handledEditId, setHandledEditId] = useState('')
  const [shouldSyncCreateWorkNumber, setShouldSyncCreateWorkNumber] = useState(false)
  const notesTextareaRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!forcedClientId) {
      if (dedicatedClientView) {
        setSelectedClientId('')
      }
      return
    }

    setSelectedClientId(String(forcedClientId))
  }, [dedicatedClientView, forcedClientId])

  useEffect(() => {
    if (dedicatedClientView) {
      return
    }

    const syncClientIdFromUrl = () => {
      const clientIdFromQuery = getClientIdFromLocation()
      setSelectedClientId(current => (current === clientIdFromQuery ? current : clientIdFromQuery))
    }

    syncClientIdFromUrl()
    window.addEventListener('popstate', syncClientIdFromUrl)

    return () => window.removeEventListener('popstate', syncClientIdFromUrl)
  }, [dedicatedClientView])

  useEffect(() => {
    if (typeof window === 'undefined' || loading || works.length === 0) return

    const editId = new URLSearchParams(window.location.search).get('edit')
    if (!editId || handledEditId === editId) return

    const workToEdit = works.find(work => String(work.id) === String(editId))
    if (!workToEdit) return

    startEdit(workToEdit)
    setHandledEditId(editId)
  }, [handledEditId, loading, works])

  useEffect(() => {
    autoResizeTextarea(notesTextareaRef.current)
  }, [form.notes, showCreateForm])

  const nextWorkNumber = useMemo(() => String(getNextWorkNumber(works)), [works])

  useEffect(() => {
    if (!showCreateForm || form.id || !shouldSyncCreateWorkNumber) {
      return
    }

    setForm(current => {
      if (current.id || String(current.number || '') === nextWorkNumber) {
        return current
      }

      return {
        ...current,
        number: nextWorkNumber,
      }
    })
  }, [form.id, nextWorkNumber, shouldSyncCreateWorkNumber, showCreateForm])

  const selectedClient = useMemo(
    () => clients.find(client => String(client.id) === String(selectedClientId)) || null,
    [clients, selectedClientId],
  )
  const isClientWorksView = dedicatedClientView && Boolean(selectedClient)

  const summaryYear = useMemo(() => new Date().getFullYear(), [])

  const clientWorkCounts = useMemo(() => {
    return works.reduce((countsMap, work) => {
      const clientKey = String(work.clientId || '')
      const currentCounts = countsMap.get(clientKey) || { total: 0, active: 0, archived: 0 }

      currentCounts.total += 1
      if (work.status === 'completed') {
        currentCounts.archived += 1
      } else {
        currentCounts.active += 1
      }

      countsMap.set(clientKey, currentCounts)
      return countsMap
    }, new Map())
  }, [works])

  const visibleWorks = useMemo(() => {
    if (!selectedClientId) {
      return works
    }

    return works.filter(work => String(work.clientId) === String(selectedClientId))
  }, [selectedClientId, works])

  const activeWorks = useMemo(
    () => visibleWorks.filter(work => work.status !== 'completed'),
    [visibleWorks],
  )
  const archivedWorks = useMemo(
    () => visibleWorks.filter(work => work.status === 'completed'),
    [visibleWorks],
  )

  const annualSummaryRows = useMemo(() => {
    return buildClientAnnualSummaryRows(annualAssignments, works, selectedClient?.id, summaryYear)
  }, [annualAssignments, selectedClient, summaryYear, works])

  const annualSummaryTotals = useMemo(
    () => buildClientAnnualSummaryTotals(annualSummaryRows),
    [annualSummaryRows],
  )

  const generalAnnualSummaryRows = useMemo(() => {
    return buildGeneralAnnualSummaryRows(annualAssignments, clients, works, summaryYear)
  }, [annualAssignments, clients, summaryYear, works])

  const generalAnnualSummaryMonthHeaders = useMemo(
    () => Array.from({ length: 12 }, (_, monthIndex) => ({
      monthKey: `${summaryYear}-${String(monthIndex + 1).padStart(2, '0')}`,
      monthLabel: formatShortMonthSummaryLabel(summaryYear, monthIndex),
    })),
    [summaryYear],
  )

  const generalAnnualSummaryGrandTotals = useMemo(
    () => buildGeneralAnnualSummaryGrandTotals(generalAnnualSummaryRows, generalAnnualSummaryMonthHeaders),
    [generalAnnualSummaryMonthHeaders, generalAnnualSummaryRows],
  )

  async function ensureAnnualAssignmentsLoaded() {
    if (Array.isArray(annualAssignments)) {
      return annualAssignments
    }

    setAnnualSummaryLoading(true)
    setAnnualSummaryError('')

    try {
      const data = await listWorkAssignments({}, 'Erro ao carregar afetacoes do resumo anual')
      const normalizedAssignments = Array.isArray(data) ? data : []
      setAnnualAssignments(normalizedAssignments)
      return normalizedAssignments
    } catch (err) {
      setAnnualSummaryError(err.message)
      throw err
    } finally {
      setAnnualSummaryLoading(false)
    }
  }

  useEffect(() => {
    if (!showAnnualSummary || !selectedClient || annualAssignments !== null) {
      return
    }

    ensureAnnualAssignmentsLoaded().catch(() => {})
  }, [annualAssignments, selectedClient, showAnnualSummary])

  async function exportClientAnnualSummaryPdf() {
    if (!selectedClient) {
      return
    }

    setExportingClientPdf(true)
    setAnnualSummaryError('')

    try {
      const assignments = await ensureAnnualAssignmentsLoaded()
      const rows = buildClientAnnualSummaryRows(assignments, works, selectedClient.id, summaryYear)
      const totals = buildClientAnnualSummaryTotals(rows)
      const html = buildClientAnnualSummaryPrintDocument(selectedClient, summaryYear, rows, totals)
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
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
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
    } catch (err) {
      setAnnualSummaryError(err.message)
    } finally {
      setExportingClientPdf(false)
    }
  }

  async function exportGeneralAnnualSummaryPdf() {
    setExportingGeneralAnnualPdf(true)
    setAnnualSummaryError('')

    try {
      const assignments = await ensureAnnualAssignmentsLoaded()
      const rows = buildGeneralAnnualSummaryRows(assignments, clients, works, summaryYear)
      const grandTotals = buildGeneralAnnualSummaryGrandTotals(rows, generalAnnualSummaryMonthHeaders)
      const html = buildGeneralAnnualSummaryPrintDocument(
        summaryYear,
        generalAnnualSummaryMonthHeaders,
        rows,
        grandTotals,
      )
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
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
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
    } catch (err) {
      setAnnualSummaryError(err.message)
    } finally {
      setExportingGeneralAnnualPdf(false)
    }
  }

  async function toggleGeneralAnnualSummary() {
    const nextVisibility = !showGeneralAnnualSummary
    setShowGeneralAnnualSummary(nextVisibility)

    if (nextVisibility) {
      try {
        await ensureAnnualAssignmentsLoaded()
      } catch (err) {
        // annualSummaryError already updated in helper
      }
    }
  }

  async function loadData(nextSelectedClientId = null) {
    setLoading(true)
    setError('')

    try {
      const [worksData, clientsData] = await Promise.all([
        listWorks('Erro ao carregar obras'),
        listClients('Erro ao carregar clientes'),
      ])

      setWorks(worksData)
      setClients(clientsData)
      setSelectedClientId(currentSelectedClientId => (
        nextSelectedClientId !== null
          ? (
              clientsData.some(client => String(client.id) === String(nextSelectedClientId))
                ? String(nextSelectedClientId)
                : ''
            )
          : (
              currentSelectedClientId &&
              clientsData.some(client => String(client.id) === String(currentSelectedClientId))
                ? currentSelectedClientId
                : ''
            )
      ))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    if (name === 'number') {
      setShouldSyncCreateWorkNumber(false)
    }
    setForm(current => ({ ...current, [name]: value }))
    setFormErrors(current => ({ ...current, [name]: '' }))
  }

  function openClientWorks(clientId) {
    const nextClientId = String(clientId || '').trim()
    if (nextClientId) {
      router.push(`/works/client/${nextClientId}`)
      return
    }

    setSelectedClientId('')
    router.push('/works')
  }

  function handleClientChange(event) {
    const { name, value } = event.target
    setClientForm(current => ({ ...current, [name]: value }))
    setClientFormErrors(current => ({ ...current, [name]: '' }))
  }

  function handleWorkingDayChange(event) {
    const { value, checked } = event.target

    setForm(current => {
      const currentDays = Array.isArray(current.workingDays) ? current.workingDays : []
      const nextDays = checked
        ? [...new Set([...currentDays, value])]
        : currentDays.filter(day => day !== value)

      return { ...current, workingDays: nextDays }
    })
  }

  function handleRoleHourlyCostChange(event) {
    const { name, value } = event.target
    const role = name.replace('roleHourlyCost-', '')

    setForm(current => ({
      ...current,
      roleHourlyCosts: {
        ...(current.roleHourlyCosts || {}),
        [role]: value,
      },
    }))
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = 'O nome da obra Ã© obrigatÃ³rio.'
    if (!form.clientId) nextErrors.clientId = 'Seleciona um cliente.'
    if (form.defaultHourlyCost !== '' && Number(form.defaultHourlyCost) < 0) nextErrors.defaultHourlyCost = 'O preÃ§o hora nÃ£o pode ser negativo.'
    if (form.budget !== '' && Number(form.budget) < 0) nextErrors.budget = 'O orÃ§amento nÃ£o pode ser negativo.'
    if (form.startDate && Number.isNaN(new Date(form.startDate).getTime())) nextErrors.startDate = 'A data de comeÃ§o Ã© invÃ¡lida.'
    if (form.endDate && Number.isNaN(new Date(form.endDate).getTime())) nextErrors.endDate = 'A data de finalizaÃ§Ã£o Ã© invÃ¡lida.'

    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      nextErrors.endDate = 'A data de finalizaÃ§Ã£o nÃ£o pode ser anterior ao comeÃ§o.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function startCreate() {
    setForm({
      ...emptyWorkForm,
      number: nextWorkNumber,
      clientId: selectedClientId ? String(selectedClientId) : '',
    })
    setShouldSyncCreateWorkNumber(true)
    setOriginalPricingSnapshot(emptyWorkPricingSnapshot)
    setShowCreateForm(true)
    setSuccess('')
    setError('')
    setFormErrors({})
  }

  function validateClientForm() {
    const nextErrors = {}

    if (!clientForm.name.trim()) {
      nextErrors.name = 'O nome do cliente Ã© obrigatÃ³rio.'
    }

    setClientFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function startCreateClient() {
    setClientForm(emptyClientForm)
    setClientFormErrors({})
    setClientFormError('')
    setShowClientForm(true)
  }

  function startEditClient(client) {
    if (!client) {
      return
    }

    setClientForm({
      id: client.id,
      name: client.name ?? '',
      vatNumber: client.vatNumber ?? '',
      contactName: client.contactName ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      notes: client.notes ?? '',
    })
    setClientFormErrors({})
    setClientFormError('')
    setShowClientForm(true)
  }

  function cancelClientForm() {
    if (clientSubmitting) {
      return
    }

    setShowClientForm(false)
    setClientForm(emptyClientForm)
    setClientFormErrors({})
    setClientFormError('')
  }

  function cancelCreate() {
    setShowCreateForm(false)
    setForm(emptyWorkForm)
    setShouldSyncCreateWorkNumber(false)
    setOriginalPricingSnapshot(emptyWorkPricingSnapshot)
    setShowPricingChangeModal(false)
    setPendingWorkPayload(null)
    setFormErrors({})
  }

  function startEdit(work) {
    setSelectedClientId(work.clientId ? String(work.clientId) : '')
    setForm({
      id: work.id,
      number: work.number ?? '',
      name: work.name ?? '',
      clientId: work.clientId ? String(work.clientId) : '',
      location: work.location ?? '',
      status: work.status ?? 'planned',
      budget: work.budget ?? '',
      defaultHourlyCost: work.defaultHourlyCost ?? '',
      roleHourlyCosts: work.roleHourlyCosts || {},
      specialPersonHourlyCosts: work.specialPersonHourlyCosts || {},
      startDate: work.startDate ?? '',
      endDate: work.endDate ?? '',
      workingDays: Array.isArray(work.workingDays) ? work.workingDays : defaultWorkingDays,
      notes: work.notes ?? '',
    })
    setShouldSyncCreateWorkNumber(false)
    setOriginalPricingSnapshot(buildWorkPricingSnapshot(work))
    setShowCreateForm(true)
    setSuccess('')
    setError('')
    setFormErrors({})
  }

  async function handleClientSubmit(event) {
    event.preventDefault()

    if (!validateClientForm()) {
      return
    }

    setClientSubmitting(true)
    setClientFormError('')

    try {
      const payload = {
        name: clientForm.name,
        vatNumber: clientForm.vatNumber,
        contactName: clientForm.contactName,
        email: clientForm.email,
        phone: clientForm.phone,
        notes: clientForm.notes,
      }

      const data = await saveClientRequest(clientForm.id, payload, 'Erro ao gravar cliente')

      if (dedicatedClientView) {
        await loadData(String(data.id))
      } else {
        await loadData()
      }
      setShowClientForm(false)
      setClientForm(emptyClientForm)
      setClientFormErrors({})
      setClientFormError('')
    } catch (err) {
      setClientFormError(err.message)
    } finally {
      setClientSubmitting(false)
    }
  }

  async function saveWork(payload, pricingChangeApplication = null) {
    const data = await saveWorkRequest(
      form.id,
      {
        ...payload,
        pricingChangeApplication,
      },
      'Erro ao gravar obra',
    )

    await loadData()
    setShowCreateForm(false)
    setShowPricingChangeModal(false)
    setPendingWorkPayload(null)
    setForm(emptyWorkForm)
    setShouldSyncCreateWorkNumber(false)
    setOriginalPricingSnapshot(emptyWorkPricingSnapshot)

    if (pricingChangeApplication?.startDate) {
      const updatedCount = Number(data.repricedAssignmentsCount) || 0
      setSuccess(
        updatedCount > 0
          ? `Obra atualizada e ${updatedCount} afetaÃ§Ãµes ficaram com a nova tarifa.`
          : 'Obra atualizada com a nova tarifa. Nao houve afetacoes elegiveis para atualizar.',
      )
      return
    }

    setSuccess(form.id ? 'Obra atualizada com sucesso.' : 'Obra criada com sucesso.')
  }

  async function confirmPricingChangeApplication(mode = 'none') {
    if (!pendingWorkPayload) {
      return
    }

    setShowPricingChangeModal(false)
    setSubmitting(true)

    try {
      const pricingChangeApplication = mode === 'none'
        ? null
        : {
            mode,
            startDate: getPricingApplicationStartDate(mode),
          }

      await saveWork(pendingWorkPayload, pricingChangeApplication)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setSubmitting(true)

    try {
      const payload = {
        number: form.number === '' ? undefined : Number(form.number),
        name: form.name,
        clientId: Number(form.clientId),
        location: form.location,
        status: form.status,
        budget: form.budget === '' ? 0 : Number(form.budget),
        defaultHourlyCost: form.defaultHourlyCost === '' ? 0 : Number(form.defaultHourlyCost),
        roleHourlyCosts: Object.fromEntries(
          Object.entries(form.roleHourlyCosts || {})
            .filter(([, value]) => value !== '' && value !== null && value !== undefined)
            .map(([role, value]) => [role, Number(value)]),
        ),
        specialPersonHourlyCosts: Object.fromEntries(
          Object.entries(form.specialPersonHourlyCosts || {})
            .filter(([, value]) => value !== '' && value !== null && value !== undefined)
            .map(([personId, value]) => [personId, Number(value)]),
        ),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        workingDays: form.workingDays,
        notes: form.notes,
      }

      if (form.id && hasWorkPricingChanges(payload, originalPricingSnapshot)) {
        setPendingWorkPayload(payload)
        setShowPricingChangeModal(true)
        return
      }

      await saveWork(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(workId) {
    const confirmed = window.confirm('Pretendes mesmo remover esta obra?')

    if (!confirmed) {
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await deleteWorkRequest(workId, 'Erro ao eliminar obra')

      await loadData()
      setSuccess('Obra eliminada com sucesso.')
      setShowCreateForm(false)
      setForm(emptyWorkForm)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteClient(clientId) {
    const confirmed = window.confirm('Pretendes mesmo remover este cliente?')

    if (!confirmed) {
      return
    }

    setClientSubmitting(true)
    setClientFormError('')

    try {
      await deleteClientRequest(clientId, 'Erro ao remover cliente')

      if (dedicatedClientView) {
        router.push('/works')
      } else {
        await loadData()
      }

      setShowClientForm(false)
      setClientForm(emptyClientForm)
      setClientFormErrors({})
      setClientFormError('')
      setSuccess('Cliente removido com sucesso.')
    } catch (err) {
      setClientFormError(err.message)
    } finally {
      setClientSubmitting(false)
    }
  }

  function renderWorkRow(work) {
    return (
      <div
        key={work.id}
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/works/${work.id}`)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            router.push(`/works/${work.id}`)
          }
        }}
        style={{
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid var(--vp-border)',
          background: 'var(--vp-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          alignItems: 'flex-start',
          cursor: 'pointer',
        }}
        className="btx-works-work-row"
      >
        <div style={{ minWidth: 0 }}>
          <strong style={{ overflowWrap: 'anywhere' }}>#{work.number} - {work.name}</strong>
          <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>{work.client?.name || 'Sem cliente'}</p>
          <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>Estado: {getWorkStatusLabel(work.status)}</p>
          <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>
            Dias de trabalho: {(work.workingDays || defaultWorkingDays)
              .map(day => workDayOptions.find(option => option.value === day)?.label)
              .filter(Boolean)
              .join(', ')}
          </p>
          {work.roleHourlyCosts && Object.keys(work.roleHourlyCosts).length > 0 && (
            <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>
              PreÃ§os por role definidos: {Object.keys(work.roleHourlyCosts).length}
            </p>
          )}
        </div>
        <div
          className="btx-works-work-row-actions"
          style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              startEdit(work)
            }}
            style={iconButtonStyle}
            title="Editar obra"
            aria-label="Editar obra"
          >
            <EditPencilIcon />
          </button>
        </div>
      </div>
    )
  }

  return (
    <BentixPage style={pageStyle}>
      <BentixContent width="app" gap="lg" style={shellStyle}>
        <section style={heroStyle}>
          <Link
            href={dedicatedClientView ? '/works' : '/'}
            style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}
          >
            {dedicatedClientView ? 'Voltar aos clientes' : 'Voltar ao menu'}
          </Link>
          <div
            className="btx-works-hero-head"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '10px' }}
          >
            <h1 style={{ margin: '0 0 12px', fontSize: '46px', lineHeight: 1.05 }}>
              {dedicatedClientView && selectedClient ? selectedClient.name : 'Clientes e obras'}
            </h1>
            <div className="btx-works-hero-actions" style={{ display: 'grid', gap: '10px', justifyItems: 'end' }}>
              <button type="button" onClick={startCreateClient} style={heroPrimaryButtonStyle}>
                Adicionar cliente
              </button>
              <button type="button" onClick={startCreate} style={heroPrimaryButtonStyle}>
                Adicionar obra
              </button>
            </div>
          </div>

        </section>

        <div style={contentFlowStyle}>
        <section style={topBarStyle} className="btx-works-toolbar">
          <BentixResponsiveGrid preset="stats" style={statGridStyle}>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Clientes</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{clients.length}</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Obras visÃ­veis</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{visibleWorks.length}</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Obras ativas</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{activeWorks.length}</div>
            </article>
          </BentixResponsiveGrid>

          <div
            className="btx-works-toolbar-actions"
            style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'flex-start' }}
          >
            {dedicatedClientView ? (
              <>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAnnualSummary(current => !current)}
                    style={primaryButtonStyle}
                  >
                    {showAnnualSummary ? 'Ocultar resumo anual' : 'Resumo anual'}
                  </button>
                  <button
                    type="button"
                    onClick={exportClientAnnualSummaryPdf}
                    style={primaryButtonStyle}
                    disabled={exportingClientPdf}
                  >
                    {exportingClientPdf ? 'A preparar exportaÃ§Ã£o...' : 'Exportar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={toggleGeneralAnnualSummary}
                    style={primaryButtonStyle}
                  >
                    {showGeneralAnnualSummary ? 'Ocultar resumo anual' : 'Resumo anual'}
                  </button>
                  <button
                    type="button"
                    onClick={exportGeneralAnnualSummaryPdf}
                    style={primaryButtonStyle}
                    disabled={exportingGeneralAnnualPdf}
                  >
                    {exportingGeneralAnnualPdf ? 'A preparar exportaÃ§Ã£o...' : 'Exportar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {!dedicatedClientView && showGeneralAnnualSummary && (
          <BentixSection style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0 }}>Resumo anual geral</h2>
                <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)' }}>
                  Ano de referÃªncia: <strong>{summaryYear}</strong>
                </p>
              </div>
            </div>

            {annualSummaryLoading && <p style={{ marginTop: '18px' }}>A carregar resumo anual geral...</p>}
            {!annualSummaryLoading && annualSummaryError && (
              <p style={{ marginTop: '18px', color: '#b42318' }}>{annualSummaryError}</p>
            )}
            {!annualSummaryLoading && !annualSummaryError && (
              <BentixOverflowX style={{ ...annualSummaryTableWrapStyle, marginTop: '18px' }}>
                <table style={{ ...annualSummaryTableStyle, minWidth: '1320px' }}>
                  <thead>
                    <tr>
                      <th style={annualSummaryHeaderCellStyle}>Cliente</th>
                      {generalAnnualSummaryMonthHeaders.map(month => (
                        <th key={month.monthKey} style={annualSummaryHeaderCellStyle}>{month.monthLabel}</th>
                      ))}
                      <th style={annualSummaryHeaderCellStyle}>Total anual de horas</th>
                      <th style={annualSummaryHeaderCellStyle}>Total anual de custo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generalAnnualSummaryRows.map(row => (
                      <tr key={row.client.id}>
                        <td style={annualSummaryCellStyle}>
                          <strong style={{ color: 'var(--vp-text)', fontFamily: 'var(--btx-font-family)', fontSize: '16px' }}>{row.client.name}</strong>
                        </td>
                        {row.months.map(month => (
                          <td key={month.monthKey} style={annualSummaryCellStyle}>
                            <div style={{ display: 'grid', gap: '4px' }}>
                              <span>{formatSummaryNumber(month.totalHours)}h</span>
                              <span style={{ color: 'var(--vp-text-soft)', fontSize: '12px' }}>
                                {formatSummaryCurrency(month.estimatedCost)}
                              </span>
                            </div>
                          </td>
                        ))}
                        <td style={annualSummaryCellStyle}>{formatSummaryNumber(row.totals.totalHours)}</td>
                        <td style={annualSummaryCellStyle}>{formatSummaryCurrency(row.totals.totalEstimatedCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </BentixOverflowX>
            )}
          </BentixSection>
        )}

        <section style={isClientWorksView ? { display: 'grid', gap: '24px' } : { display: 'grid', gap: '24px' }}>
          {!dedicatedClientView && (
          <BentixSection style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0 }}>Clientes</h2>
              </div>
            </div>

            {!loading && !error && clients.length === 0 && (
              <p style={{ marginTop: '18px' }}>Sem clientes registados.</p>
            )}

            {!loading && !error && clients.length > 0 && (
              <div style={clientFilterListStyle}>
                {clients.map(client => {
                  const workCounts = clientWorkCounts.get(String(client.id)) || { total: 0, active: 0, archived: 0 }
                  const isSelected = String(client.id) === String(selectedClientId)

                  return (
                    <div key={client.id} style={getClientCardStyle(isSelected)} className="btx-works-client-card">
                      <button
                        type="button"
                        onClick={() => openClientWorks(String(client.id))}
                        style={getClientFilterButtonStyle()}
                      >
                        <strong style={{ fontFamily: 'var(--btx-font-family)', fontSize: '16px' }}>{client.name}</strong>
                        <span style={{ display: 'none', color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                        {workCounts.total} obra(s) Â· {workCounts.active} ativa(s)
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditClient(client)}
                        style={getClientEditButtonStyle(isSelected)}
                        title={`Editar ${client.name}`}
                        aria-label={`Editar ${client.name}`}
                      >
                        <EditPencilIcon />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </BentixSection>
          )}

          {dedicatedClientView && (
          <BentixSection style={clientSummaryPanelStyle}>
            {selectedClient ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '28px', lineHeight: 1.1, fontFamily: 'var(--btx-font-family)' }}>{selectedClient.name}</h3>
                  </div>
                  <div style={{ ...clientHeaderActionsStyle, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => startEditClient(selectedClient)}
                      style={secondaryButtonStyle}
                    >
                      Editar Cliente
                    </button>
                  </div>
                </div>
                <div style={clientInfoGridStyle}>
                  <div style={clientInfoCardStyle}>
                    <span style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Contacto</span>
                    <strong>{selectedClient.contactName || 'Sem contacto'}</strong>
                  </div>
                  <div style={clientInfoCardStyle}>
                    <span style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Email</span>
                    <strong>{selectedClient.email || 'Sem email'}</strong>
                  </div>
                  <div style={clientInfoCardStyle}>
                    <span style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Telefone</span>
                    <strong>{selectedClient.phone || 'Sem telefone'}</strong>
                  </div>
                  <div style={clientInfoCardStyle}>
                    <span style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>NIF</span>
                    <strong>{selectedClient.vatNumber || 'Sem NIF'}</strong>
                  </div>
                </div>
                {selectedClient.notes && (
                  <div style={clientInfoCardStyle}>
                    <span style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Notas</span>
                    <span style={{ color: 'var(--vp-text-muted)', lineHeight: 1.5 }}>{selectedClient.notes}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 style={{ margin: 0 }}>Cliente</h2>
                <p style={{ margin: 0, color: '#b42318' }}>Cliente nÃ£o encontrado.</p>
              </>
            )}
          </BentixSection>
          )}
        </section>

        {dedicatedClientView && selectedClient && showAnnualSummary && (
          <BentixSection style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: 'var(--btx-font-family)' }}>Resumo anual de {selectedClient.name}</h2>
                <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)' }}>
                  Ano de referÃªncia: <strong>{summaryYear}</strong>
                </p>
              </div>
            </div>

            {annualSummaryLoading && <p style={{ marginTop: '18px' }}>A carregar resumo anual...</p>}
            {!annualSummaryLoading && annualSummaryError && (
              <p style={{ marginTop: '18px', color: '#b42318' }}>{annualSummaryError}</p>
            )}
            {!annualSummaryLoading && !annualSummaryError && (
              <BentixOverflowX style={{ ...annualSummaryTableWrapStyle, marginTop: '18px' }}>
                <table style={annualSummaryTableStyle}>
                  <thead>
                    <tr>
                      <th style={annualSummaryHeaderCellStyle}>MÃªs</th>
                      <th style={annualSummaryHeaderCellStyle}>Total de horas</th>
                      <th style={annualSummaryHeaderCellStyle}>Custo estimado</th>
                      <th style={annualSummaryHeaderCellStyle}>Obras envolvidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annualSummaryRows.map(row => (
                      <tr key={row.monthKey}>
                        <td style={annualSummaryCellStyle}>{row.monthLabel}</td>
                        <td style={annualSummaryCellStyle}>{formatSummaryNumber(row.totalHours)}</td>
                        <td style={annualSummaryCellStyle}>{formatSummaryCurrency(row.estimatedCost)}</td>
                        <td style={annualSummaryCellStyle}>{row.workCount}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ ...annualSummaryCellStyle, fontWeight: 800 }}>Total anual</td>
                      <td style={{ ...annualSummaryCellStyle, fontWeight: 800 }}>{formatSummaryNumber(annualSummaryTotals.totalHours)}</td>
                      <td style={{ ...annualSummaryCellStyle, fontWeight: 800 }}>{formatSummaryCurrency(annualSummaryTotals.totalEstimatedCost)}</td>
                      <td style={{ ...annualSummaryCellStyle, fontWeight: 800 }}></td>
                    </tr>
                  </tbody>
                </table>
              </BentixOverflowX>
            )}
          </BentixSection>
        )}

        {dedicatedClientView && selectedClient && (
        <BentixResponsiveGrid preset="split" className="btx-works-lists-grid" style={{ '--vp-grid-gap': '24px' }}>
          <BentixSection style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>
              {selectedClient ? `Obras ativas de ${selectedClient.name}` : 'Obras ativas'}
            </h2>
            {loading && <p>A carregar obras...</p>}
            {!loading && error && <p style={{ color: '#b42318' }}>{error}</p>}
            {!loading && !error && activeWorks.length === 0 && (
              <p>{selectedClient ? 'Sem obras ativas para este cliente.' : 'Sem obras ativas.'}</p>
            )}
            {!loading && !error && activeWorks.length > 0 && (
              <div style={{ display: 'grid', gap: '12px' }}>
                {activeWorks.map(renderWorkRow)}
              </div>
            )}
          </BentixSection>

          <BentixSection style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>
              {selectedClient ? `Obras antigas de ${selectedClient.name}` : 'Obras antigas com resumo'}
            </h2>
            {!loading && archivedWorks.length === 0 && (
              <p>{selectedClient ? 'Sem obras antigas para este cliente.' : 'Sem obras antigas.'}</p>
            )}
            {!loading && archivedWorks.length > 0 && (
              <div style={{ display: 'grid', gap: '12px' }}>
                {archivedWorks.map(renderWorkRow)}
              </div>
            )}
          </BentixSection>
        </BentixResponsiveGrid>
        )}
        </div>
      </BentixContent>

      {showCreateForm && (
        <div style={modalBackdropStyle} onClick={cancelCreate}>
          <section className="vp-modal-card" style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>{form.id ? 'Editar obra' : 'Adicionar nova obra'}</h2>
                {!form.id && selectedClient && (
                  <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)' }}>
                    Cliente prÃ©-selecionado: <strong>{selectedClient.name}</strong>
                  </p>
                )}
              </div>
              <button type="button" onClick={cancelCreate} style={secondaryButtonStyle}>
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px', marginTop: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                <label style={{ ...labelStyle, maxWidth: '110px' }}>
                  NÃºmero
                  <input type="number" name="number" value={form.number} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Nome da obra
                  <input type="text" name="name" value={form.name} onChange={handleChange} style={inputStyle} />
                  {formErrors.name && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.name}</span>}
                </label>
                <label style={labelStyle}>
                  Cliente
                  <select name="clientId" value={form.clientId} onChange={handleChange} style={inputStyle}>
                    <option value="">Seleciona um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.clientId && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.clientId}</span>}
                </label>
                <label style={labelStyle}>
                  LocalizaÃ§Ã£o
                  <input type="text" name="location" value={form.location} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Estado
                  <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                    <option value="planned">Planeada</option>
                    <option value="in_progress">Em curso</option>
                    <option value="paused">Em pausa</option>
                    <option value="completed">ConcluÃ­da</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  OrÃ§amento
                  <input type="number" name="budget" min="0" step="0.01" value={form.budget} onChange={handleChange} style={inputStyle} />
                  {formErrors.budget && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.budget}</span>}
                </label>
                <label style={labelStyle}>
                  PreÃ§o hora por defeito
                  <input
                    type="number"
                    name="defaultHourlyCost"
                    min="0"
                    step="0.01"
                    value={form.defaultHourlyCost}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                  {formErrors.defaultHourlyCost && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.defaultHourlyCost}</span>}
                </label>
                <label style={labelStyle}>
                  Data de comeÃ§o
                  <input type="date" name="startDate" value={form.startDate} onChange={handleChange} style={inputStyle} />
                  {formErrors.startDate && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.startDate}</span>}
                </label>
                <label style={labelStyle}>
                  Data de finalizaÃ§Ã£o
                  <input type="date" name="endDate" value={form.endDate} onChange={handleChange} style={inputStyle} />
                  {formErrors.endDate && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.endDate}</span>}
                </label>
              </div>

              <fieldset style={{ border: '1px solid var(--vp-border)', borderRadius: '18px', padding: '16px', margin: 0 }}>
                <legend style={{ padding: '0 8px', fontWeight: 800 }}>Dias em que a obra trabalha</legend>
                <div style={workingDaysGridStyle}>
                  {workDayOptions.map(option => (
                    <label key={option.value} style={workingDayOptionStyle}>
                      <input
                        type="checkbox"
                        value={option.value}
                        checked={(form.workingDays || []).includes(option.value)}
                        onChange={handleWorkingDayChange}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset style={{ border: '1px solid var(--vp-border)', borderRadius: '18px', padding: '16px', margin: 0 }}>
                <legend style={{ padding: '0 8px', fontWeight: 800 }}>PreÃ§o por role no plano diÃ¡rio</legend>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginTop: '8px' }}>
                  {rolePriceOptions.map(option => (
                    <label key={option.value} style={labelStyle}>
                      {option.value === 'chef_segunda' ? (
                        <span style={inlineInfoLabelStyle}>
                          <span>{option.label}</span>
                          <span
                            aria-hidden="true"
                            title="Chefe de segunda inclui chefe de carpinteiro, ferrajeiro e trolha."
                            style={infoBadgeStyle}
                          >
                            i
                          </span>
                        </span>
                      ) : (
                        option.label
                      )}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name={`roleHourlyCost-${option.value}`}
                        value={form.roleHourlyCosts?.[option.value] ?? ''}
                        onChange={handleRoleHourlyCostChange}
                        placeholder="Usar preÃ§o por defeito"
                        style={inputStyle}
                      />
                    </label>
                  ))}
                </div>
                <div style={infoNoteRowStyle}>
                  <span aria-hidden="true" style={infoBadgeStyle}>
                    i
                  </span>
                  <span>Chefe de segunda inclui chefe de carpinteiro, ferrajeiro e trolha.</span>
                </div>
              </fieldset>

              <label style={labelStyle}>
                Notas
                <textarea
                  ref={notesTextareaRef}
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                  style={notesTextareaStyle}
                ></textarea>
              </label>

              {error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}
              {success && <p style={{ margin: 0, color: '#1f7a45' }}>{success}</p>}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="submit" disabled={submitting} style={primaryButtonStyle}>
                  {submitting ? 'A gravar...' : form.id ? 'Guardar alteraÃ§Ãµes' : 'Criar obra'}
                </button>
                {form.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(form.id)}
                    disabled={submitting}
                    style={dangerButtonStyle}
                  >
                    Remover obra
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}

      {showClientForm && (
        <div style={modalBackdropStyle} onClick={cancelClientForm}>
          <section className="vp-modal-card" style={{ ...modalCardStyle, width: 'min(760px, 100%)' }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0 }}>{clientForm.id ? 'Editar cliente' : 'Novo cliente'}</h2>
              </div>
              <button type="button" onClick={cancelClientForm} style={secondaryButtonStyle} disabled={clientSubmitting}>
                Fechar
              </button>
            </div>

            <form noValidate onSubmit={handleClientSubmit} style={{ display: 'grid', gap: '20px', marginTop: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <label style={labelStyle}>
                  Nome do cliente
                  <input type="text" name="name" value={clientForm.name} onChange={handleClientChange} style={inputStyle} />
                  {clientFormErrors.name && <span style={{ color: '#b42318', fontSize: '13px' }}>{clientFormErrors.name}</span>}
                </label>
                <label style={labelStyle}>
                  NIF
                  <input type="text" name="vatNumber" value={clientForm.vatNumber} onChange={handleClientChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Contacto
                  <input type="text" name="contactName" value={clientForm.contactName} onChange={handleClientChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Email
                  <input type="email" name="email" value={clientForm.email} onChange={handleClientChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Telefone
                  <input type="text" name="phone" value={clientForm.phone} onChange={handleClientChange} style={inputStyle} />
                </label>
              </div>

              <label style={labelStyle}>
                Notas
                <textarea name="notes" value={clientForm.notes} onChange={handleClientChange} style={notesTextareaStyle} />
              </label>

              {clientFormError && <p style={{ margin: 0, color: '#b42318' }}>{clientFormError}</p>}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {clientForm.id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteClient(clientForm.id)}
                      style={dangerButtonStyle}
                      disabled={clientSubmitting}
                    >
                      Remover cliente
                    </button>
                  )}
                </div>
                <button type="submit" style={primaryButtonStyle} disabled={clientSubmitting}>
                  {clientSubmitting ? 'A guardar...' : clientForm.id ? 'Guardar cliente' : 'Criar cliente'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showPricingChangeModal && (
        <div style={modalBackdropStyle} onClick={() => !submitting && setShowPricingChangeModal(false)}>
          <section className="vp-modal-card" style={{ ...modalCardStyle, width: 'min(720px, 100%)' }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <h2 style={{ margin: 0 }}>Alteracao de precos da obra</h2>
              <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>
                Mudaste os precos desta obra. Queres so guardar os novos valores para o futuro ou reaplicar a nova tarifa nas afetacoes ainda nao aprovadas?
              </p>
              <p style={{ margin: 0, color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                Horas ja aprovadas mantem o preco antigo. Afetacoes com preco manual tambem nao sao alteradas.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => confirmPricingChangeApplication('none')} style={primaryButtonStyle} disabled={submitting}>
                So guardar os novos precos
              </button>
              <button type="button" onClick={() => confirmPricingChangeApplication('today')} style={secondaryButtonStyle} disabled={submitting}>
                Aplicar a partir de hoje
              </button>
              <button type="button" onClick={() => confirmPricingChangeApplication('month_start')} style={secondaryButtonStyle} disabled={submitting}>
                Aplicar desde o inicio do mes
              </button>
              <button type="button" onClick={() => confirmPricingChangeApplication('next_month')} style={secondaryButtonStyle} disabled={submitting}>
                Aplicar a partir do proximo mes
              </button>
            </div>
          </section>
        </div>
      )}
    </BentixPage>
  )
}

export default function WorksPage() {
  return <WorksPageView />
}

