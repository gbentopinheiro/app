import { getEntityRoleLabel } from './roles.js'

export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

export function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateString

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function getExportDateLabel() {
  return new Intl.DateTimeFormat('sv-SE').format(new Date())
}

export function getCurrentMonthKey() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
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

export function getPeopleExportRows(people) {
  return people.map(person => ({
    ID: person.id,
    Nome: person.name || '',
    'Preco hora': Number(person.price) || 0,
    'Preco mensal': Number(person.monthlyPrice) || 0,
    Tipo: person.isMonthlyBilling ? 'Mensal' : 'Horaria',
    Role: person.roleLabel || getEntityRoleLabel(person),
  }))
}

export function buildPeopleHoursGrid(monthKey, people, assignments) {
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

      const dayIndex = Number(String(assignment.date).slice(8, 10)) - 1
      if (dayIndex < 0 || dayIndex >= values.length) {
        return
      }

      const currentValue = Number(values[dayIndex]) || 0
      const hours = Number(assignment.hours) || 0
      values[dayIndex] = currentValue + hours
      totalHours += hours
    })

    const numericPrice = Number(person.isMonthlyBilling ? person.monthlyPrice : person.price) || 0
    const totalValue = person.isMonthlyBilling ? numericPrice : totalHours * numericPrice

    return {
      id: person.id,
      name: person.name || '',
      values: values.map(formatHourCell),
      totalHours: formatTotalHours(totalHours),
      price: formatCurrency(numericPrice),
      total: formatCurrency(totalValue),
    }
  })

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    yearLabel: String(monthKey || '').split('-')[0] || '',
    dayColumns,
    rows,
  }
}

export function buildPeoplePrintDocument(rows, summary, exportDateLabel, hoursGrid) {
  const tableRows = rows
    .map(
      row => `
        <tr>
          <td>${escapeHtml(row.ID)}</td>
          <td>${escapeHtml(row.Nome)}</td>
          <td>${escapeHtml(row.Tipo)}</td>
          <td>${escapeHtml(row.Role)}</td>
          <td>${formatCurrency(row['Preco hora'])}</td>
          <td>${formatCurrency(row['Preco mensal'])}</td>
        </tr>`,
    )
    .join('')

  const hoursWeekdays = hoursGrid.dayColumns
    .map(
      column =>
        `<th class="${column.isSunday ? 'sunday' : column.isWeekend ? 'weekend' : ''}">${escapeHtml(
          column.weekdayLabel,
        )}</th>`,
    )
    .join('')

  const hoursDays = hoursGrid.dayColumns
    .map(
      column =>
        `<th class="${column.isSunday ? 'sunday' : column.isWeekend ? 'weekend' : ''}">${escapeHtml(
          String(column.dayNumber),
        )}</th>`,
    )
    .join('')

  const hoursRows = hoursGrid.rows
    .map(
      row => `
        <tr>
          <td>${escapeHtml(String(row.id))}</td>
          <td class="name-cell">${escapeHtml(row.name)}</td>
          ${row.values
            .map((value, index) => {
              const column = hoursGrid.dayColumns[index]
              const cellValue = column.isSunday ? 'X' : value || ''
              const className = column.isSunday ? 'sunday' : column.isWeekend ? 'weekend' : ''
              return `<td class="${className}">${escapeHtml(cellValue)}</td>`
            })
            .join('')}
          <td class="total-hours">${escapeHtml(row.totalHours)}</td>
          <td class="price">${escapeHtml(row.price)}</td>
          <td class="total">${escapeHtml(row.total)}</td>
        </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <title>Lista de pessoas</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 28px;
        color: #1f2937;
        background: #ffffff;
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      .sheet {
        display: grid;
        gap: 18px;
      }

      .sheet + .sheet {
        page-break-before: always;
      }

      .hero {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }

      .hero-copy {
        display: grid;
        gap: 6px;
      }

      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 11px;
        color: #7b6a58;
        font-weight: 700;
      }

      .hero h1 {
        font-size: 28px;
      }

      .hero-note {
        font-size: 13px;
        color: #6b7280;
      }

      .summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .summary-card {
        border: 1px solid #d7c8b5;
        border-radius: 16px;
        padding: 16px;
        background: #faf5ee;
      }

      .summary-card strong {
        display: block;
        margin-top: 8px;
        font-size: 24px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        border: 1px solid #d8d8d8;
        padding: 10px 12px;
        text-align: left;
        font-size: 12px;
      }

      thead th {
        background: #f2ece4;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 11px;
      }

      tbody tr:nth-child(even) td {
        background: #fcfaf7;
      }

      .hours-sheet {
        gap: 12px;
      }

      .hours-sheet table {
        font-size: 10px;
      }

      .hours-sheet th,
      .hours-sheet td {
        border: 1px solid #333333;
        padding: 4px 5px;
        text-align: center;
        white-space: nowrap;
      }

      .hours-sheet .title-row th {
        font-size: 14px;
        background: #ffffff;
        border: none;
        text-align: center;
        padding: 0 0 8px;
      }

      .hours-sheet .head th {
        background: #f2ece4;
        font-style: italic;
      }

      .hours-sheet .name-head,
      .hours-sheet .number-head {
        font-style: normal;
      }

      .hours-sheet .day-cell {
        min-width: 26px;
      }

      .hours-sheet .weekend {
        background: #f8efe8;
      }

      .hours-sheet .sunday {
        background: #f3dccf;
        font-weight: 700;
      }

      .hours-sheet .name-cell {
        text-align: left;
        min-width: 220px;
      }

      .hours-sheet .total-hours {
        color: #0f4c81;
        font-weight: 700;
      }

      .hours-sheet .price {
        background: #eef6f0;
        font-weight: 700;
      }

      .hours-sheet .total {
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <section class="sheet">
      <div class="hero">
        <div class="hero-copy">
          <span class="eyebrow">Gestao de pessoas</span>
          <h1>Lista completa de pessoas</h1>
          <p class="hero-note">Exportado em ${escapeHtml(exportDateLabel)}</p>
        </div>
      </div>

      <div class="summary">
        <article class="summary-card">
          <span>Pessoas totais</span>
          <strong>${escapeHtml(String(summary.total))}</strong>
        </article>
        <article class="summary-card">
          <span>Mensais</span>
          <strong>${escapeHtml(String(summary.monthly))}</strong>
        </article>
        <article class="summary-card">
          <span>Horarias</span>
          <strong>${escapeHtml(String(summary.hourly))}</strong>
        </article>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Role</th>
            <th>Preco hora</th>
            <th>Preco mensal</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </section>

    <section class="sheet hours-sheet">
      <div class="hero-copy">
        <span class="eyebrow">Folha mensal de horas</span>
        <h2>${escapeHtml(hoursGrid.monthLabel)}</h2>
      </div>

      <table>
        <thead>
          <tr class="title-row">
            <th colspan="${hoursGrid.dayColumns.length + 5}">ANO : ${escapeHtml(hoursGrid.yearLabel)}</th>
          </tr>
          <tr class="head">
            <th class="number-head">NUMERO</th>
            <th class="name-head">NOME</th>
            ${hoursWeekdays}
            <th>HORAS</th>
            <th>PRECO</th>
            <th>TOTAL</th>
          </tr>
          <tr class="head">
            <th></th>
            <th></th>
            ${hoursDays}
            <th></th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>${hoursRows}</tbody>
      </table>
    </section>
  </body>
</html>`
}

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function escapeHtml(value) {
  return escapeXml(value)
}

function buildExcelCell(value, styleId, type = 'String') {
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`
}

export function buildPeopleExcelDocument(rows, summary, exportDateLabel, hoursGrid) {
  const listRows = rows
    .map(
      row => `
      <Row>
        ${buildExcelCell(row.ID, 'cell')}
        ${buildExcelCell(row.Nome, 'cell')}
        ${buildExcelCell(row.Tipo, 'cell')}
        ${buildExcelCell(row.Role, 'cell')}
        ${buildExcelCell(formatCurrency(row['Preco hora']), 'currency')}
        ${buildExcelCell(formatCurrency(row['Preco mensal']), 'currency')}
      </Row>`,
    )
    .join('')

  const hoursWeekdays = hoursGrid.dayColumns
    .map(column => buildExcelCell(column.weekdayLabel, column.isSunday ? 'sundayHeader' : 'header'))
    .join('')
  const hoursDays = hoursGrid.dayColumns
    .map(column => buildExcelCell(column.dayNumber, column.isSunday ? 'sundayHeader' : 'header'))
    .join('')
  const hoursRows = hoursGrid.rows
    .map(
      row => `
      <Row>
        ${buildExcelCell(row.id, 'cell')}
        ${buildExcelCell(row.name, 'nameCell')}
        ${row.values
          .map((value, index) => {
            const column = hoursGrid.dayColumns[index]
            return buildExcelCell(column.isSunday ? 'X' : value || '', column.isSunday ? 'sundayCell' : 'dayCell')
          })
          .join('')}
        ${buildExcelCell(row.totalHours, 'totalHours')}
        ${buildExcelCell(row.price, 'priceCell')}
        ${buildExcelCell(row.total, 'totalCell')}
      </Row>`,
    )
    .join('')

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Borders/>
      <Font ss:FontName="Inter" ss:Size="10"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="title">
      <Font ss:FontName="Inter" ss:Size="14" ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="subtitle">
      <Font ss:FontName="Inter" ss:Size="10" ss:Italic="1"/>
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="header">
      <Font ss:FontName="Inter" ss:Size="10" ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#F2ECE4" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="cell">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="currency">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="summaryLabel">
      <Font ss:FontName="Inter" ss:Size="10" ss:Bold="1"/>
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="summaryValue">
      <Font ss:FontName="Inter" ss:Size="10" ss:Bold="1"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="nameCell">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="dayCell">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="sundayHeader">
      <Font ss:FontName="Inter" ss:Size="10" ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#F3DCCF" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="sundayCell">
      <Font ss:FontName="Inter" ss:Size="10" ss:Bold="1"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Interior ss:Color="#F3DCCF" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="totalHours">
      <Font ss:FontName="Inter" ss:Size="10" ss:Bold="1" ss:Color="#0F4C81"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="priceCell">
      <Font ss:FontName="Inter" ss:Size="10" ss:Bold="1"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Interior ss:Color="#EEF6F0" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="totalCell">
      <Font ss:FontName="Inter" ss:Size="10" ss:Bold="1"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
  </Styles>
  <Worksheet ss:Name="Pessoas">
    <Table>
      <Column ss:Width="60"/>
      <Column ss:Width="240"/>
      <Column ss:Width="90"/>
      <Column ss:Width="110"/>
      <Column ss:Width="90"/>
      <Column ss:Width="110"/>
      <Row ss:Height="26">
        <Cell ss:MergeAcross="5" ss:StyleID="title"><Data ss:Type="String">Lista de pessoas</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="5" ss:StyleID="subtitle"><Data ss:Type="String">${escapeXml(`Exportado em ${exportDateLabel}`)}</Data></Cell>
      </Row>
      <Row ss:Height="8"/>
      <Row>
        ${buildExcelCell('ID', 'header')}
        ${buildExcelCell('Nome', 'header')}
        ${buildExcelCell('Tipo', 'header')}
        ${buildExcelCell('Role', 'header')}
        ${buildExcelCell('Preco hora', 'header')}
        ${buildExcelCell('Preco mensal', 'header')}
      </Row>
      ${listRows}
      <Row ss:Height="8"/>
      <Row>
        <Cell ss:MergeAcross="4" ss:StyleID="summaryLabel"><Data ss:Type="String">Pessoas totais</Data></Cell>
        <Cell ss:StyleID="summaryValue"><Data ss:Type="String">${escapeXml(summary.total)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="4" ss:StyleID="summaryLabel"><Data ss:Type="String">Mensais</Data></Cell>
        <Cell ss:StyleID="summaryValue"><Data ss:Type="String">${escapeXml(summary.monthly)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="4" ss:StyleID="summaryLabel"><Data ss:Type="String">Horarias</Data></Cell>
        <Cell ss:StyleID="summaryValue"><Data ss:Type="String">${escapeXml(summary.hourly)}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
  <Worksheet ss:Name="${escapeXml(`Horas-${hoursGrid.monthKey}`.slice(0, 31))}">
    <Table>
      <Column ss:Width="60"/>
      <Column ss:Width="260"/>
      ${hoursGrid.dayColumns.map(() => '<Column ss:Width="26"/>').join('')}
      <Column ss:Width="55"/>
      <Column ss:Width="80"/>
      <Column ss:Width="90"/>
      <Row ss:Height="26">
        <Cell ss:MergeAcross="${hoursGrid.dayColumns.length + 4}" ss:StyleID="title"><Data ss:Type="String">${escapeXml(`ANO : ${hoursGrid.yearLabel}`)}</Data></Cell>
      </Row>
      <Row>
        ${buildExcelCell('NUMERO', 'header')}
        ${buildExcelCell('NOME', 'header')}
        ${hoursWeekdays}
        ${buildExcelCell('HORAS', 'header')}
        ${buildExcelCell('PRECO', 'header')}
        ${buildExcelCell('TOTAL', 'header')}
      </Row>
      <Row>
        ${buildExcelCell('', 'header')}
        ${buildExcelCell('', 'header')}
        ${hoursDays}
        ${buildExcelCell('', 'header')}
        ${buildExcelCell('', 'header')}
        ${buildExcelCell('', 'header')}
      </Row>
      ${hoursRows}
    </Table>
  </Worksheet>
</Workbook>`
}


