import { NextResponse } from 'next/server'
import { hasPermission } from '../../../../../lib/permissions.js'
import { getAllDailyWorkNotes } from '../../../../../lib/daily-work-notes.js'
import { getPersonByIdData } from '../../../../../lib/people.js'
import { getServerSession } from '../../../../../lib/server-session.js'
import { getAllWorkAssignments } from '../../../../../lib/work-assignments.js'

function formatDateTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Sem data'
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function escapeCsvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function buildRows(person, assignments) {
  const notes = getAllDailyWorkNotes({ authorId: person.id })

  return [
    ...assignments
      .filter(assignment => assignment.submitted && assignment.submittedAt)
      .map(assignment => ({
        type: 'Horas submetidas',
        date: assignment.submittedAt,
        actor: assignment.submittedBy || person.name,
        detail: `${assignment.work?.name || `Obra ${assignment.workId}`} - ${assignment.hours}h submetidas`,
      })),
    ...assignments
      .filter(assignment => assignment.approvedHours !== null && assignment.approvedHours !== undefined)
      .map(assignment => ({
        type: 'Horas aprovadas',
        date: assignment.submittedAt || assignment.date,
        actor: 'Administrador',
        detail: `${assignment.work?.name || `Obra ${assignment.workId}`} - ${assignment.approvedHours}h aprovadas`,
      })),
    ...notes
      .filter(note => note.note)
      .map(note => ({
        type: 'Notas da obra',
        date: note.updatedAt,
        actor: note.authorName || person.name,
        detail: `${note.work?.name || `Obra ${note.workId}`} - ${note.note}`,
      })),
  ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
}

function buildCsv(person, rows) {
  const header = ['Pessoa', 'Tipo', 'Data', 'Autor', 'Detalhe']
  const lines = [
    header,
    ...rows.map(row => [
      person.name,
      row.type,
      formatDateTime(row.date),
      row.actor,
      row.detail,
    ]),
  ]

  return `\ufeff${lines.map(line => line.map(escapeCsvCell).join(';')).join('\n')}`
}

function sanitizePdfText(value) {
  return String(value ?? '')
    .replaceAll('â‚¬', 'EUR')
    .replaceAll('â€“', '-')
    .replaceAll('â€”', '-')
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

function buildActivityHistoryPdf(person, rows) {
  const pageWidth = 595.28
  const pageHeight = 841.89
  const marginLeft = 30
  const marginRight = 30
  const marginTop = 34
  const marginBottom = 34
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
      fontSize = 8.5,
      align = 'left',
      rgb = '0 0 0',
      paddingX = 4,
      borderWidth = 0.8,
    } = options

    if (fill) {
      drawFilledRect(commands, x, top, width, height, fill)
    }

    drawRect(commands, x, top, width, height, borderWidth)

    if (text !== '' && text !== null && text !== undefined) {
      const textMaxWidth = Math.max(width - paddingX * 2, 0)
      const baselineTop = top + height * 0.66
      drawText(commands, text, x + paddingX, baselineTop, {
        font,
        fontSize,
        rgb,
        maxWidth: textMaxWidth,
        align,
      })
    }
  }

  function drawPageNumber(commands, pageNumber, totalPages) {
    drawText(commands, `Pagina ${pageNumber} de ${totalPages}`, marginLeft, pageHeight - marginBottom + 6, {
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
  const columns = [86, 92, 94, 263]
  const tableWidth = columns.reduce((sum, width) => sum + width, 0)
  const tableStartX = marginLeft + (pageWidth - marginLeft - marginRight - tableWidth) / 2
  const headerHeight = 22
  const rowHeight = 20
  const rowsPerPage = 28
  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage))
  const exportLabel = new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const pageRows = rows.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage)
    const commands = []
    let cursorY = marginTop

    drawText(commands, 'Historico de atividades', marginLeft, cursorY + 6, {
      font: 'F2',
      fontSize: 17,
      maxWidth: pageWidth - marginLeft - marginRight,
      align: 'center',
    })
    drawText(commands, person.name || `Pessoa ${person.id}`, marginLeft, cursorY + 24, {
      font: 'F2',
      fontSize: 10.5,
      maxWidth: pageWidth - marginLeft - marginRight,
      align: 'center',
    })
    drawText(commands, `Exportado em ${exportLabel}`, marginLeft, cursorY + 40, {
      fontSize: 9,
      maxWidth: pageWidth - marginLeft - marginRight,
      align: 'center',
    })
    drawText(commands, `${rows.length} registo(s)`, marginLeft, cursorY + 54, {
      fontSize: 8.5,
      maxWidth: pageWidth - marginLeft - marginRight,
      align: 'center',
    })

    cursorY += 76

    const headers = ['Tipo', 'Data', 'Autor', 'Detalhe']
    let cursorX = tableStartX
    headers.forEach((label, columnIndex) => {
      drawCell(commands, cursorX, cursorY, columns[columnIndex], headerHeight, label, {
        fill: [0.9, 0.92, 0.9],
        font: 'F2',
        fontSize: 8.5,
        align: columnIndex === 3 ? 'left' : 'center',
      })
      cursorX += columns[columnIndex]
    })

    cursorY += headerHeight

    pageRows.forEach(row => {
      let rowX = tableStartX
      const values = [
        row.type,
        formatDateTime(row.date),
        row.actor,
        row.detail,
      ]

      values.forEach((value, columnIndex) => {
        drawCell(commands, rowX, cursorY, columns[columnIndex], rowHeight, value, {
          fontSize: 8.3,
          align: columnIndex === 3 ? 'left' : 'center',
        })
        rowX += columns[columnIndex]
      })

      cursorY += rowHeight
    })

    if (pageRows.length === 0) {
      drawCell(commands, tableStartX, cursorY, tableWidth, rowHeight, 'Sem atividade registada.', {
        align: 'center',
        fontSize: 8.5,
      })
    }

    drawPageNumber(commands, pageIndex + 1, totalPages)
    addPage(commands)
  }

  objects[pagesId] = `<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)

  const chunks = ['%PDF-1.4\n%\xE2\xE3\xCF\xD3\n']
  const offsets = [0]
  let currentLength = chunks[0].length

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = currentLength
    const chunk = `${index} 0 obj\n${objects[index]}\nendobj\n`
    chunks.push(chunk)
    currentLength += chunk.length
  }

  const xrefOffset = currentLength
  chunks.push(`xref\n0 ${objects.length}\n`)
  chunks.push('0000000000 65535 f \n')

  for (let index = 1; index < objects.length; index += 1) {
    chunks.push(`${String(offsets[index]).padStart(10, '0')} 00000 n \n`)
  }

  chunks.push(
    `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  )

  return stringToPdfBytes(chunks.join(''))
}

export async function GET(request, { params }) {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: 'SessÃ£o obrigatÃ³ria.' }, { status: 401 })
  }

  if (!hasPermission(session, 'people.activity_history.read')) {
    return NextResponse.json({ error: 'Sem permissÃ£o.' }, { status: 403 })
  }

  const { id } = await params
  const person = await getPersonByIdData(id)

  if (!person) {
    return NextResponse.json({ error: 'Pessoa nÃ£o encontrada.' }, { status: 404 })
  }

  const assignments = getAllWorkAssignments({ personId: id })
  const rows = buildRows(person, assignments)
  const format = String(new URL(request.url).searchParams.get('format') || 'pdf').toLowerCase()
  const safeName = String(person.name || `pessoa-${id}`).replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-+|-+$/g, '')

  if (format === 'csv') {
    const csv = buildCsv(person, rows)

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="historico-atividades-${safeName || id}.csv"`,
      },
    })
  }

  const pdf = buildActivityHistoryPdf(person, rows)

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="historico-atividades-${safeName || id}.pdf"`,
    },
  })
}


