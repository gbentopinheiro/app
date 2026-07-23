'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import EditPencilIcon, { editPencilButtonStyle } from '../components/EditPencilIcon'
import {
  BentixButton,
  BentixContent,
  BentixOverflowX,
  BentixPage,
  BentixResponsiveGrid,
  BentixSection,
} from '../components/ViewportLayout.js'
import {
  deleteClient,
  listClients,
  saveClient,
} from '../../frontend/controllers/clients-controller.js'
import { listWorks } from '../../frontend/controllers/works-controller.js'
import { listWorkAssignments } from '../../frontend/controllers/work-assignments-controller.js'
import {
  CLIENT_SUMMARY_LANGUAGE_OPTIONS,
  getClientSummaryLanguageLabel,
} from '../../lib/client-summary-language.js'
import { getFinancialSummaryCost, getFinancialSummaryHours } from '../../lib/work-financial-summary.js'

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

const panelStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-panel)',
  minWidth: 0,
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

const topBarStyle = {
  display: 'grid',
  gap: '16px',
  alignItems: 'start',
}

const statGridStyle = {
  '--vp-grid-gap': '16px',
}

const buttonGroupStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  minWidth: 0,
}

const panelHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
}

const formStyle = {
  display: 'grid',
  gap: '14px',
  marginTop: '18px',
  minWidth: 0,
}

const formFieldsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
  gap: '14px',
}

const clientListStyle = {
  display: 'grid',
  gap: '12px',
  minWidth: 0,
}

const detailBodyStyle = {
  display: 'grid',
  gap: '12px',
  marginTop: '18px',
  color: 'var(--vp-text-muted)',
  minWidth: 0,
}

const detailLineStyle = {
  margin: 0,
  minWidth: 0,
}

const detailValueStyle = {
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
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
  width: 'min(760px, 100%)',
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  background: 'var(--vp-surface-soft-strong)',
  border: '1px solid var(--vp-border)',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-modal)',
}

const reportOptionStyle = {
  display: 'grid',
  gap: '16px',
  padding: '20px',
  borderRadius: '20px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface)',
}

const annualSummaryTableWrapStyle = {
  borderRadius: '18px',
  border: '1px solid var(--vp-border)',
}

const annualSummaryTableStyle = {
  width: '100%',
  minWidth: '1320px',
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

const emptyClientForm = {
  id: null,
  name: '',
  vatNumber: '',
  contactName: '',
  email: '',
  phone: '',
  notes: '',
  summaryLanguage: 'pt',
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
    targetMonth.totalHours = Number((targetMonth.totalHours + getFinancialSummaryHours(assignment)).toFixed(2))
    targetMonth.estimatedCost = Number((targetMonth.estimatedCost + getFinancialSummaryCost(assignment)).toFixed(2))
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
          <header class="header">
            <p class="eyebrow">Resumo anual geral</p>
            <h1>Resumo anual da empresa</h1>
          </header>

          <section class="meta">
            <article class="meta-card">
              <p class="meta-label">Ano de referência</p>
              <p class="meta-value">${escapeHtml(String(year))}</p>
            </article>
            <article class="meta-card">
              <p class="meta-label">Data de emissão</p>
              <p class="meta-value">${escapeHtml(formatEmissionDate())}</p>
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

function getClientListButtonStyle(isSelected) {
  return {
    width: '100%',
    minWidth: 0,
    textAlign: 'left',
    padding: '16px',
    borderRadius: '16px',
    border: isSelected ? '1px solid var(--vp-accent)' : '1px solid var(--vp-border)',
    background: isSelected ? 'var(--vp-highlight)' : 'var(--vp-surface)',
    cursor: 'pointer',
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [summaryWorks, setSummaryWorks] = useState(null)
  const [annualAssignments, setAnnualAssignments] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [annualSummaryLoading, setAnnualSummaryLoading] = useState(false)
  const [exportingAnnualPdf, setExportingAnnualPdf] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [annualSummaryError, setAnnualSummaryError] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [showAnnualCompanySummary, setShowAnnualCompanySummary] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [form, setForm] = useState(emptyClientForm)
  const summaryYear = useMemo(() => new Date().getFullYear(), [])

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (!showAnnualCompanySummary || (Array.isArray(summaryWorks) && Array.isArray(annualAssignments))) {
      return
    }

    ensureCompanyAnnualSummaryDataLoaded().catch(() => {})
  }, [annualAssignments, showAnnualCompanySummary, summaryWorks])

  async function loadClients() {
    setLoading(true)
    setError('')

    try {
      const data = await listClients('Erro ao carregar clientes')
      setClients(data)
      setSelectedClientId(current => current ?? data[0]?.id ?? null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = 'O nome do cliente é obrigatório.'

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setFormErrors(current => ({ ...current, [name]: '' }))
  }

  function startCreate() {
    setForm(emptyClientForm)
    setShowForm(true)
    setError('')
    setSuccess('')
    setFormErrors({})
  }

  function startEdit(client) {
    setForm({
      id: client.id,
      name: client.name ?? '',
      vatNumber: client.vatNumber ?? '',
      contactName: client.contactName ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      notes: client.notes ?? '',
      summaryLanguage: client.summaryLanguage ?? 'pt',
    })
    setShowForm(true)
    setSelectedClientId(client.id)
    setError('')
    setSuccess('')
    setFormErrors({})
  }

  function cancelForm() {
    setShowForm(false)
    setForm(emptyClientForm)
    setFormErrors({})
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setSubmitting(true)

    try {
      const payload = {
        name: form.name,
        vatNumber: form.vatNumber,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        notes: form.notes,
        summaryLanguage: form.summaryLanguage,
      }

      const data = await saveClient(form.id, payload, 'Erro ao gravar cliente')

      await loadClients()
      setSelectedClientId(data.id)
      setShowForm(false)
      setForm(emptyClientForm)
      setSuccess(form.id ? 'Cliente atualizado com sucesso.' : 'Cliente criado com sucesso.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(clientId) {
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await deleteClient(clientId, 'Erro ao eliminar cliente')

      await loadClients()
      setSelectedClientId(null)
      setShowForm(false)
      setForm(emptyClientForm)
      setSuccess('Cliente eliminado com sucesso.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const generalAnnualSummaryMonthHeaders = useMemo(
    () => Array.from({ length: 12 }, (_, monthIndex) => ({
      monthKey: `${summaryYear}-${String(monthIndex + 1).padStart(2, '0')}`,
      monthLabel: formatShortMonthSummaryLabel(summaryYear, monthIndex),
    })),
    [summaryYear],
  )

  const generalAnnualSummaryRows = useMemo(
    () => buildGeneralAnnualSummaryRows(annualAssignments, clients, summaryWorks || [], summaryYear),
    [annualAssignments, clients, summaryWorks, summaryYear],
  )

  const generalAnnualSummaryGrandTotals = useMemo(
    () => buildGeneralAnnualSummaryGrandTotals(generalAnnualSummaryRows, generalAnnualSummaryMonthHeaders),
    [generalAnnualSummaryMonthHeaders, generalAnnualSummaryRows],
  )

  async function ensureCompanyAnnualSummaryDataLoaded() {
    if (Array.isArray(summaryWorks) && Array.isArray(annualAssignments)) {
      return {
        works: summaryWorks,
        assignments: annualAssignments,
      }
    }

    setAnnualSummaryLoading(true)
    setAnnualSummaryError('')

    try {
      const [worksData, assignmentsData] = await Promise.all([
        Array.isArray(summaryWorks)
          ? Promise.resolve(summaryWorks)
          : listWorks('Erro ao carregar obras do resumo anual'),
        Array.isArray(annualAssignments)
          ? Promise.resolve(annualAssignments)
          : listWorkAssignments({}, 'Erro ao carregar afetações do resumo anual'),
      ])

      const normalizedWorks = Array.isArray(worksData) ? worksData : []
      const normalizedAssignments = Array.isArray(assignmentsData) ? assignmentsData : []

      setSummaryWorks(normalizedWorks)
      setAnnualAssignments(normalizedAssignments)

      return {
        works: normalizedWorks,
        assignments: normalizedAssignments,
      }
    } catch (err) {
      setAnnualSummaryError(err.message)
      throw err
    } finally {
      setAnnualSummaryLoading(false)
    }
  }

  async function handleOpenAnnualCompanySummary() {
    setShowAnnualCompanySummary(true)

    try {
      await ensureCompanyAnnualSummaryDataLoaded()
      setShowReportsModal(false)
    } catch (err) {
      // annualSummaryError already updated by the loader
    }
  }

  function handleCloseReportsModal() {
    if (annualSummaryLoading || exportingAnnualPdf) {
      return
    }

    setShowReportsModal(false)
  }

  async function handleExportAnnualCompanySummaryPdf() {
    setExportingAnnualPdf(true)
    setAnnualSummaryError('')

    try {
      const { works, assignments } = await ensureCompanyAnnualSummaryDataLoaded()
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
      setExportingAnnualPdf(false)
    }
  }

  const selectedClient = clients.find(client => client.id === selectedClientId) || null

  return (
    <BentixPage style={pageStyle}>
      <BentixContent width="app" gap="lg" style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/" style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}>
            Voltar ao menu
          </Link>
          <p style={{ margin: '18px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: 'var(--vp-text-soft)' }}>
            Gestão de clientes
          </p>
          <h1 style={{ margin: '10px 0 12px', fontSize: '46px', lineHeight: 1.05 }}>
            Clientes
          </h1>
        </section>

        <div style={contentFlowStyle}>
          <section style={topBarStyle} className="btx-clients-toolbar">
            <BentixResponsiveGrid preset="stats" style={statGridStyle}>
              <BentixSection as="div">
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Clientes totais</div>
                <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{clients.length}</div>
              </BentixSection>
            </BentixResponsiveGrid>

            <div style={buttonGroupStyle} className="btx-clients-toolbar-actions">
              <button type="button" onClick={() => setShowReportsModal(true)} style={secondaryButtonStyle}>
                Relatórios
              </button>
              <button type="button" onClick={startCreate} style={primaryButtonStyle}>
                Adicionar cliente
              </button>
            </div>
          </section>

          {showAnnualCompanySummary && (
            <BentixSection style={panelStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0 }}>Resumo anual da empresa</h2>
                  <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)' }}>
                    Ano de referência: <strong>{summaryYear}</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setShowAnnualCompanySummary(false)} style={secondaryButtonStyle}>
                    Ocultar resumo
                  </button>
                  <button
                    type="button"
                    onClick={handleExportAnnualCompanySummaryPdf}
                    disabled={exportingAnnualPdf}
                    style={primaryButtonStyle}
                  >
                    {exportingAnnualPdf ? 'A preparar exportação...' : 'Exportar PDF'}
                  </button>
                </div>
              </div>

              {annualSummaryLoading && <p style={{ marginTop: '18px' }}>A carregar resumo anual da empresa...</p>}
              {!annualSummaryLoading && annualSummaryError && (
                <p style={{ marginTop: '18px', color: '#b42318' }}>{annualSummaryError}</p>
              )}
              {!annualSummaryLoading && !annualSummaryError && (
                <BentixOverflowX style={{ ...annualSummaryTableWrapStyle, marginTop: '18px' }}>
                  <table style={annualSummaryTableStyle}>
                    <thead>
                      <tr>
                        <th style={annualSummaryHeaderCellStyle}>Cliente</th>
                        {generalAnnualSummaryMonthHeaders.map(month => (
                          <th key={month.monthKey} style={annualSummaryHeaderCellStyle}>
                            {month.monthLabel}
                          </th>
                        ))}
                        <th style={annualSummaryHeaderCellStyle}>Total anual de horas</th>
                        <th style={annualSummaryHeaderCellStyle}>Total anual de custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generalAnnualSummaryRows.map(row => (
                        <tr key={row.client.id}>
                          <td style={annualSummaryCellStyle}>
                            <strong style={{ color: 'var(--vp-text)', fontFamily: 'var(--btx-font-family)', fontSize: '16px' }}>
                              {row.client.name}
                            </strong>
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
                      <tr>
                        <td style={{ ...annualSummaryCellStyle, fontWeight: 800 }}>Totais gerais</td>
                        {generalAnnualSummaryGrandTotals.monthlyTotals.map(month => (
                          <td key={month.monthKey} style={{ ...annualSummaryCellStyle, fontWeight: 800 }}>
                            <div style={{ display: 'grid', gap: '4px' }}>
                              <span>{formatSummaryNumber(month.totalHours)}h</span>
                              <span style={{ color: 'var(--vp-text-soft)', fontSize: '12px' }}>
                                {formatSummaryCurrency(month.totalEstimatedCost)}
                              </span>
                            </div>
                          </td>
                        ))}
                        <td style={{ ...annualSummaryCellStyle, fontWeight: 800 }}>
                          {formatSummaryNumber(generalAnnualSummaryGrandTotals.annualTotals.totalHours)}
                        </td>
                        <td style={{ ...annualSummaryCellStyle, fontWeight: 800 }}>
                          {formatSummaryCurrency(generalAnnualSummaryGrandTotals.annualTotals.totalEstimatedCost)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </BentixOverflowX>
              )}
            </BentixSection>
          )}

          {showForm && (
            <BentixSection style={panelStyle}>
              <div style={panelHeaderStyle} className="btx-clients-form-header">
                <div>
                  <h2 style={{ margin: 0 }}>{form.id ? 'Editar cliente' : 'Adicionar cliente'}</h2>
                  <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)' }}>
                    Mantém a ficha de cliente usada depois na relação N para 1 com as obras.
                  </p>
                </div>
                <button type="button" onClick={cancelForm} style={secondaryButtonStyle}>
                  Fechar
                </button>
              </div>

              <form onSubmit={handleSubmit} style={formStyle}>
                <div style={formFieldsGridStyle}>
                  <label style={labelStyle}>
                    Nome
                    <input type="text" name="name" value={form.name} onChange={handleChange} style={inputStyle} />
                    {formErrors.name && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.name}</span>}
                  </label>
                  <label style={labelStyle}>
                    NIF
                    <input type="text" name="vatNumber" value={form.vatNumber} onChange={handleChange} style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    Contacto
                    <input type="text" name="contactName" value={form.contactName} onChange={handleChange} style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    Email
                    <input type="email" name="email" value={form.email} onChange={handleChange} style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    Telefone
                    <input type="text" name="phone" value={form.phone} onChange={handleChange} style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    Língua dos resumos enviados ao cliente
                    <select name="summaryLanguage" value={form.summaryLanguage} onChange={handleChange} style={inputStyle}>
                      {CLIENT_SUMMARY_LANGUAGE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label style={labelStyle}>
                  Notas
                  <textarea name="notes" value={form.notes} onChange={handleChange} rows={4} style={inputStyle} />
                </label>

                {error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}
                {success && <p style={{ margin: 0, color: '#1f7a45' }}>{success}</p>}

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="submit" disabled={submitting} style={primaryButtonStyle}>
                    {submitting ? 'A gravar...' : form.id ? 'Guardar alterações' : 'Criar cliente'}
                  </button>
                  {form.id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(form.id)}
                      disabled={submitting}
                      style={iconDangerButtonStyle}
                      title="Eliminar cliente"
                      aria-label="Eliminar cliente"
                    >
                      X
                    </button>
                  )}
                </div>
              </form>
            </BentixSection>
          )}

          <BentixResponsiveGrid as="section" preset="split" className="btx-clients-main-grid" style={{ gap: '24px' }}>
            <BentixSection style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Lista de clientes</h2>
              {loading && <p>A carregar clientes...</p>}
              {!loading && !error && clients.length === 0 && <p>Sem clientes registados.</p>}
              {!loading && clients.length > 0 && (
                <div style={clientListStyle}>
                  {clients.map(client => {
                    const isSelected = client.id === selectedClientId

                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => setSelectedClientId(client.id)}
                        style={getClientListButtonStyle(isSelected)}
                      >
                        <strong style={detailValueStyle}>{client.name}</strong>
                        <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)', ...detailValueStyle }}>
                          {client.contactName || 'Sem contacto definido'}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </BentixSection>

            <BentixSection style={panelStyle}>
              <div style={panelHeaderStyle} className="btx-clients-detail-header">
                <h2 style={{ margin: 0 }}>Detalhe do cliente</h2>
                {selectedClient && (
                  <button
                    type="button"
                    onClick={() => startEdit(selectedClient)}
                    style={iconButtonStyle}
                    title="Editar cliente"
                    aria-label="Editar cliente"
                  >
                    <EditPencilIcon />
                  </button>
                )}
              </div>

              {!selectedClient && <p style={{ marginTop: '18px' }}>Seleciona um cliente para ver os detalhes.</p>}

              {selectedClient && (
                <div style={detailBodyStyle}>
                  <p style={detailLineStyle}><strong>Nome:</strong> <span style={detailValueStyle}>{selectedClient.name}</span></p>
                  <p style={detailLineStyle}><strong>NIF:</strong> <span style={detailValueStyle}>{selectedClient.vatNumber || 'Sem NIF'}</span></p>
                  <p style={detailLineStyle}><strong>Contacto:</strong> <span style={detailValueStyle}>{selectedClient.contactName || 'Sem contacto'}</span></p>
                  <p style={detailLineStyle}><strong>Email:</strong> <span style={detailValueStyle}>{selectedClient.email || 'Sem email'}</span></p>
                  <p style={detailLineStyle}><strong>Telefone:</strong> <span style={detailValueStyle}>{selectedClient.phone || 'Sem telefone'}</span></p>
                  <p style={detailLineStyle}><strong>Língua do resumo:</strong> <span style={detailValueStyle}>{getClientSummaryLanguageLabel(selectedClient.summaryLanguage)}</span></p>
                  <p style={detailLineStyle}><strong>Notas:</strong> <span style={{ ...detailValueStyle, whiteSpace: 'pre-wrap' }}>{selectedClient.notes || 'Sem notas'}</span></p>
                </div>
              )}
            </BentixSection>
          </BentixResponsiveGrid>
        </div>

        {showReportsModal && (
          <div style={modalBackdropStyle} onClick={handleCloseReportsModal}>
            <section
              className="vp-modal-card"
              style={modalCardStyle}
              onClick={event => event.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'grid', gap: '6px' }}>
                  <h2 style={{ margin: 0 }}>Relatórios</h2>
                  <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>
                    Gestão global da empresa
                  </p>
                </div>
                <BentixButton
                  type="button"
                  variant="secondary"
                  onClick={handleCloseReportsModal}
                  disabled={annualSummaryLoading || exportingAnnualPdf}
                >
                  Fechar
                </BentixButton>
              </div>

              <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
                <article style={reportOptionStyle}>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <h3 style={{ margin: 0 }}>Resumo anual da empresa</h3>
                    <p style={{ margin: 0, color: 'var(--vp-text-muted)', lineHeight: 1.5 }}>
                      Resumo anual com estatísticas de todos os clientes.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                    <BentixButton
                      type="button"
                      variant="primary"
                      onClick={handleOpenAnnualCompanySummary}
                      loading={annualSummaryLoading}
                      disabled={exportingAnnualPdf}
                    >
                      {showAnnualCompanySummary ? 'Ver resumo anual' : 'Abrir resumo anual'}
                    </BentixButton>
                    <BentixButton
                      type="button"
                      variant="secondary"
                      onClick={handleExportAnnualCompanySummaryPdf}
                      loading={exportingAnnualPdf}
                      disabled={annualSummaryLoading}
                    >
                      Exportar PDF
                    </BentixButton>
                  </div>
                  {annualSummaryError && (
                    <p style={{ margin: 0, color: '#b42318' }}>{annualSummaryError}</p>
                  )}
                </article>
              </div>
            </section>
          </div>
        )}
      </BentixContent>
    </BentixPage>
  )
}
