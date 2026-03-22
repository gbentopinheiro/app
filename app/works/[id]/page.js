'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const pageStyle = {
  minHeight: '100vh',
  padding: '40px 24px 60px',
  background: 'linear-gradient(180deg, #f4efe5 0%, #e8f0eb 100%)',
  color: '#1d2a24',
  fontFamily: 'Georgia, serif',
}

const shellStyle = {
  maxWidth: '1180px',
  margin: '0 auto',
  display: 'grid',
  gap: '24px',
}

const panelStyle = {
  background: 'rgba(255, 252, 247, 0.9)',
  border: '1px solid #d4d2c8',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 16px 40px rgba(54, 72, 63, 0.08)',
}

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '14px',
}

const statCardStyle = {
  borderRadius: '18px',
  padding: '18px',
  background: '#fff',
  border: '1px solid #d7ddd6',
}

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(28, 36, 32, 0.38)',
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
  background: 'rgba(255, 252, 247, 0.98)',
  border: '1px solid #d4d2c8',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: '0 24px 70px rgba(28, 36, 32, 0.18)',
}

const secondaryButtonStyle = {
  border: '1px solid #285943',
  borderRadius: '999px',
  padding: '12px 18px',
  background: 'transparent',
  color: '#285943',
  fontWeight: 700,
  cursor: 'pointer',
}

const clientButtonStyle = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: '#285943',
  fontSize: 'inherit',
  fontFamily: 'inherit',
  fontWeight: 700,
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
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

function formatSheetName(work, monthKey) {
  const baseName = `${work?.number || 'obra'}-${monthKey}`
  return baseName.slice(0, 31)
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
      }

      const nextValue = (currentPerson.values[dayNumber - 1] ?? 0) + (Number(assignment.hours) || 0)
      currentPerson.values[dayNumber - 1] = Number(nextValue.toFixed(2))
      peopleMap.set(personKey, currentPerson)
    })
  })

  const peopleRows = Array.from(peopleMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(person => [person.name, ...person.values.map(value => value ?? '')])

  return {
    headers: ['Trabalhador', ...dayColumns],
    rows: peopleRows,
  }
}

function buildMonthlySummary(month, work) {
  const hourlyPrice = Number(work?.defaultHourlyCost) || 0
  const totalHours = Number(month.totalHours) || 0
  const totalValue = Number((totalHours * hourlyPrice).toFixed(2))

  return {
    hourlyPrice,
    totalHours,
    totalValue,
  }
}

function buildExcelDocument(months, work, workId) {
  const worksheets = months.map(month => {
    const grid = buildMonthlyGrid(month)
    const summary = buildMonthlySummary(month, work)
    const headerCells = grid.headers
      .map((header, index) => {
        const styleId = index > 0 && isWeekendDay(month.monthKey, Number(header)) ? 'headerWeekend' : 'header'
        return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`
      })
      .join('')

    const bodyRows = grid.rows.length > 0
      ? grid.rows.map(row => {
        const cells = row.map((cell, index) => {
          const styleId = index === 0 ? 'nameCell' : 'valueCell'
          const type = typeof cell === 'number' ? 'Number' : 'String'
          return `<Cell ss:StyleID="${styleId}"><Data ss:Type="${type}">${escapeXml(cell)}</Data></Cell>`
        }).join('')

        return `<Row>${cells}</Row>`
      }).join('')
      : `<Row><Cell ss:StyleID="emptyCell"><Data ss:Type="String">Sem registos para este mes.</Data></Cell></Row>`

    const summaryRows = `
      <Row ss:Height="8"/>
      <Row>
        <Cell ss:MergeAcross="25"/>
        <Cell ss:MergeAcross="3" ss:StyleID="summaryLabel"><Data ss:Type="String">Total horas</Data></Cell>
        <Cell ss:StyleID="summaryValue"><Data ss:Type="Number">${summary.totalHours}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="25"/>
        <Cell ss:MergeAcross="3" ss:StyleID="summaryLabel"><Data ss:Type="String">Preco hora</Data></Cell>
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
      : `<tr><td colspan="${grid.headers.length}">Sem registos para este mes.</td></tr>`

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
            <span>Preco hora</span>
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

export default function WorkDetailPage() {
  const params = useParams()
  const workId = Array.isArray(params.id) ? params.id[0] : params.id
  const [work, setWork] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [showClientModal, setShowClientModal] = useState(false)
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
        const [workResponse, assignmentsResponse] = await Promise.all([
          fetch(`/api/works/${workId}`),
          fetch(`/api/work-assignments?workId=${workId}`),
        ])

        const workData = await workResponse.json()
        const assignmentsData = await assignmentsResponse.json()

        if (!workResponse.ok) throw new Error(workData.error || 'Erro ao carregar obra')
        if (!assignmentsResponse.ok) throw new Error(assignmentsData.error || 'Erro ao carregar afetacoes')

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
    const totalHours = assignments.reduce((sum, assignment) => sum + (Number(assignment.hours) || 0), 0)
    const totalCost = assignments.reduce((sum, assignment) => sum + (Number(assignment.totalCost) || 0), 0)

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

      currentMonth.totalHours += Number(assignment.hours) || 0
      currentMonth.totalCost += Number(assignment.totalCost) || 0
      currentDay.totalHours += Number(assignment.hours) || 0
      currentDay.totalCost += Number(assignment.totalCost) || 0
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

  function openClientModal() {
    if (!client) return
    setShowClientModal(true)
  }

  function closeClientModal() {
    setShowClientModal(false)
  }

  async function exportExcel() {
    if (!work || assignmentsByMonth.length === 0) return

    setExporting('excel')

    try {
      const content = buildExcelDocument(assignmentsByMonth, work, workId)
      const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `obra-${work.number || workId}-mapa-mensal.xls`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setExporting('')
    }
  }

  function exportPdf() {
    if (!work || assignmentsByMonth.length === 0) return

    setExporting('pdf')

    try {
      const html = buildPrintDocument(assignmentsByMonth, work)
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
        <section style={panelStyle}>
          <Link href="/works" style={{ color: '#285943', textDecoration: 'none', fontWeight: 700 }}>
            ← Voltar a gestao de obra
          </Link>

          {loading && <p style={{ marginTop: '18px' }}>A carregar obra...</p>}
          {error && <p style={{ marginTop: '18px', color: '#b42318' }}>{error}</p>}

          {!loading && !error && work && (
            <>
              <p style={{ margin: '18px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: '#5f6f66' }}>
                Obra #{work.number}
              </p>
              <h1 style={{ margin: '10px 0 12px', fontSize: '44px', lineHeight: 1.05 }}>
                {work.name}
              </h1>
              <p style={{ margin: 0, maxWidth: '760px', color: '#4d5c55', fontSize: '17px', lineHeight: 1.7 }}>
                Consulta aqui o resumo completo da obra e todas as afetacoes relacionadas com esta obra.
              </p>
            </>
          )}
        </section>

        {!loading && !error && work && (
          <>
            <section style={statGridStyle}>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Estado</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{work.status}</div>
              </article>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Preco hora defeito</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{work.defaultHourlyCost || 0}/h</div>
              </article>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Horas totais</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{totals.totalHours}</div>
              </article>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Custo acumulado</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{totals.totalCost}</div>
              </article>
            </section>

            <section style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Informacao da obra</h2>
              <div style={{ display: 'grid', gap: '10px', color: '#4f5d56' }}>
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
                <p style={{ margin: 0 }}><strong>Localizacao:</strong> {work.location || 'Sem localizacao'}</p>
                <p style={{ margin: 0 }}><strong>Data de comeco:</strong> {work.startDate || 'Sem data'}</p>
                <p style={{ margin: 0 }}><strong>Data de finalizacao:</strong> {work.endDate || 'Em aberto'}</p>
                <p style={{ margin: 0 }}><strong>Orcamento:</strong> {work.budget || 0}</p>
                <p style={{ margin: 0 }}><strong>Notas:</strong> {work.notes || 'Sem notas'}</p>
              </div>
            </section>

            <section style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Afetacoes desta obra por mes</h2>
              {assignments.length === 0 && <p>Sem afetacoes registadas para esta obra.</p>}
              {assignments.length > 0 && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={exportExcel} style={secondaryButtonStyle} disabled={exporting === 'excel'}>
                      {exporting === 'excel' ? 'A exportar Excel...' : 'Exportar Excel'}
                    </button>
                    <button type="button" onClick={exportPdf} style={secondaryButtonStyle} disabled={exporting === 'pdf'}>
                      {exporting === 'pdf' ? 'A exportar PDF...' : 'Exportar PDF'}
                    </button>
                  </div>

                  {assignmentsByMonth.map(month => (
                    <details
                      key={month.monthKey}
                      open={assignmentsByMonth[0]?.monthKey === month.monthKey}
                      style={{
                        border: '1px solid #d7ddd6',
                        borderRadius: '18px',
                        padding: '16px',
                        background: '#fff',
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
                              border: '1px solid #e5e2d9',
                              borderRadius: '14px',
                              padding: '14px',
                              background: '#fcfaf6',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                              <strong>{day.date === 'Sem data' ? day.date : formatDateLabel(day.date)}</strong>
                              <span style={{ color: '#4f5d56' }}>
                                {day.totalHours}h | Total {day.totalCost}
                              </span>
                            </div>

                            <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
                              {day.people.map(assignment => (
                                <div
                                  key={assignment.id}
                                  style={{
                                    border: '1px solid #ebe7dd',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    background: '#fff',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                    <strong>{assignment.person?.name || `Pessoa ${assignment.personId}`}</strong>
                                    <strong>{assignment.hours}h</strong>
                                  </div>
                                  <p style={{ margin: '6px 0 0', color: '#4f5d56' }}>
                                    {assignment.hourlyCost}/h | Total {assignment.totalCost}
                                  </p>
                                  {assignment.notes && <p style={{ margin: '6px 0 0', color: '#6a756f' }}>{assignment.notes}</p>}
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
                <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: '#5f6f66' }}>
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

            <div style={{ display: 'grid', gap: '12px', marginTop: '22px', color: '#4f5d56' }}>
              <p style={{ margin: 0 }}><strong>NIF:</strong> {client.vatNumber || 'Sem NIF'}</p>
              <p style={{ margin: 0 }}><strong>Contacto:</strong> {client.contactName || 'Sem contacto'}</p>
              <p style={{ margin: 0 }}><strong>Email:</strong> {client.email || 'Sem email'}</p>
              <p style={{ margin: 0 }}><strong>Telefone:</strong> {client.phone || 'Sem telefone'}</p>
              <p style={{ margin: 0 }}><strong>Notas:</strong> {client.notes || 'Sem notas'}</p>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
