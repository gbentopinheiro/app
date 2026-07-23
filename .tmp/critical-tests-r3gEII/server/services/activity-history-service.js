import {
  buildGlobalActivityHistoryCsv,
  escapeCsvCell,
  formatActivityHistoryDateTime,
  getGlobalActivityHistoryData,
  normalizeActivityHistoryFilters,
} from '../../lib/activity-history.js'
import { getAllDailyWorkNotesData } from '../../lib/daily-work-notes.js'
import { isFeatureEnabled } from '../../lib/feature-flags.js'
import { getPersonByIdData } from '../../lib/people.js'
import { getAllWorkAssignmentsData } from '../../lib/work-assignments.js'

function buildPersonActivityHistoryRows(person, assignments, notes) {
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

export async function getPersonActivityHistoryDataService(id) {
  const person = await getPersonByIdData(id)

  if (!person) {
    return null
  }

  const [assignments, notes] = await Promise.all([
    getAllWorkAssignmentsData({ personId: id }),
    getAllDailyWorkNotesData({ authorId: person.id }),
  ])

  return {
    person,
    rows: buildPersonActivityHistoryRows(person, assignments, notes),
  }
}

export function buildPersonActivityHistoryCsvService(person, rows) {
  const header = ['Pessoa', 'Tipo', 'Data', 'Autor', 'Detalhe']
  const lines = [
    header,
    ...rows.map(row => [
      person.name,
      row.type,
      formatActivityHistoryDateTime(row.date),
      row.actor,
      row.detail,
    ]),
  ]

  return `\ufeff${lines.map(line => line.map(escapeCsvCell).join(';')).join('\n')}`
}

function sanitizePdfText(value) {
  return String(value ?? '')
    .replaceAll('?', 'EUR')
    .replaceAll('?', '-')
    .replaceAll('?', '-')
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

export function buildPersonActivityHistoryPdfService(person, rows) {
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
        formatActivityHistoryDateTime(row.date),
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

export function getPersonActivityHistorySafeNameService(person, id) {
  return String(person.name || `pessoa-${id}`)
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

export async function getGlobalActivityHistoryExportCsvService(searchParams) {
  const filters = normalizeActivityHistoryFilters(searchParams)
  const history = await getGlobalActivityHistoryData(filters)
  return buildGlobalActivityHistoryCsv(history.allEvents)
}

export async function isActivityHistoryFeatureEnabledService() {
  return isFeatureEnabled('activityHistory')
}

export function getGlobalActivityHistoryDateLabelService() {
  return new Date().toISOString().slice(0, 10)
}
