function sanitizePdfText(value) {
  return String(value ?? '')
    .replaceAll('EUR', 'EUR')
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

function formatNumber(value) {
  return Number(value.toFixed(2)).toString()
}

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

function buildMetricRows(dashboard) {
  return [
    ['Ultimo login', formatDateTime(dashboard.highlights.latestLoginAt)],
    ['Ultima atividade', formatDateTime(dashboard.highlights.lastActivityAt)],
    ['Logins 7 dias', String(dashboard.loginSummary.loginsLast7Days)],
    ['Logins 30 dias', String(dashboard.loginSummary.loginsLast30Days)],
    ['Utilizadores ativos 30 dias', String(dashboard.loginSummary.activeUsersLast30Days)],
    ['Eventos recentes', String(dashboard.recentEvents.length)],
  ]
}

export function buildDeveloperDashboardPdf({ dashboard, developerName, exportedAt }) {
  const pageWidth = 595.28
  const pageHeight = 841.89
  const marginLeft = 30
  const marginRight = 30
  const objects = ['']
  const pageObjectIds = []

  function addObject(content) {
    objects.push(content)
    return objects.length - 1
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

  const commands = []
  let cursorY = 34
  const contentWidth = pageWidth - marginLeft - marginRight
  const loginColumns = [180, 150, contentWidth - 330]
  const loginTableWidth = loginColumns.reduce((sum, width) => sum + width, 0)
  const activityColumns = [110, 110, 220, contentWidth - 440]
  const activityTableWidth = activityColumns.reduce((sum, width) => sum + width, 0)
  const metricRows = buildMetricRows(dashboard)
  const loginRows = dashboard.loginSummary.recentLogins
  const activityRows = dashboard.recentEvents
  const exportLabel = formatDateTime(exportedAt)

  drawText(commands, 'Centro tecnico - exportacao recente', marginLeft, cursorY + 6, {
    font: 'F2',
    fontSize: 18,
    maxWidth: contentWidth,
    align: 'center',
  })
  drawText(commands, developerName || 'Programador', marginLeft, cursorY + 24, {
    font: 'F2',
    fontSize: 10.5,
    maxWidth: contentWidth,
    align: 'center',
  })
  drawText(commands, `Exportado em ${exportLabel}`, marginLeft, cursorY + 40, {
    fontSize: 9,
    maxWidth: contentWidth,
    align: 'center',
  })

  cursorY += 62

  drawText(commands, 'Resumo rapido', marginLeft, cursorY + 6, {
    font: 'F2',
    fontSize: 12,
    maxWidth: contentWidth,
  })
  cursorY += 18

  const metricColumns = [170, contentWidth - 170]
  metricRows.forEach(([label, value]) => {
    drawCell(commands, marginLeft, cursorY, metricColumns[0], 18, label, {
      fill: [0.95, 0.96, 0.98],
      font: 'F2',
      fontSize: 8.2,
    })
    drawCell(commands, marginLeft + metricColumns[0], cursorY, metricColumns[1], 18, value, {
      fontSize: 8.2,
    })
    cursorY += 18
  })

  cursorY += 18

  drawText(commands, 'Logins recentes', marginLeft, cursorY + 6, {
    font: 'F2',
    fontSize: 12,
    maxWidth: contentWidth,
  })
  cursorY += 18

  let loginX = marginLeft
  ;['Utilizador', 'Perfil e conta', 'Data'].forEach((label, columnIndex) => {
    drawCell(commands, loginX, cursorY, loginColumns[columnIndex], 20, label, {
      fill: [0.9, 0.92, 0.9],
      font: 'F2',
      fontSize: 8.5,
      align: columnIndex === 2 ? 'center' : 'left',
    })
    loginX += loginColumns[columnIndex]
  })
  cursorY += 20

  if (loginRows.length === 0) {
    drawCell(commands, marginLeft, cursorY, loginTableWidth, 18, 'Sem logins recentes.', {
      align: 'center',
      fontSize: 8.3,
    })
    cursorY += 18
  } else {
    loginRows.forEach(login => {
      let rowX = marginLeft
      const values = [
        `${login.name} - ${login.username}`,
        `${login.roleLabel} - ${login.accountTypeLabel}`,
        formatDateTime(login.loginAt),
      ]

      values.forEach((value, columnIndex) => {
        drawCell(commands, rowX, cursorY, loginColumns[columnIndex], 18, value, {
          fontSize: 8,
          align: columnIndex === 2 ? 'center' : 'left',
        })
        rowX += loginColumns[columnIndex]
      })

      cursorY += 18
    })
  }

  cursorY += 18

  drawText(commands, 'Atividade recente', marginLeft, cursorY + 6, {
    font: 'F2',
    fontSize: 12,
    maxWidth: contentWidth,
  })
  cursorY += 18

  let activityX = marginLeft
  ;['Tipo', 'Autor', 'Detalhe', 'Data'].forEach((label, columnIndex) => {
    drawCell(commands, activityX, cursorY, activityColumns[columnIndex], 20, label, {
      fill: [0.9, 0.92, 0.98],
      font: 'F2',
      fontSize: 8.5,
      align: columnIndex === 3 ? 'center' : 'left',
    })
    activityX += activityColumns[columnIndex]
  })
  cursorY += 20

  if (activityRows.length === 0) {
    drawCell(commands, marginLeft, cursorY, activityTableWidth, 18, 'Sem atividade recente.', {
      align: 'center',
      fontSize: 8.3,
    })
    cursorY += 18
  } else {
    activityRows.forEach(event => {
      let rowX = marginLeft
      const values = [
        event.type,
        event.actor,
        event.text,
        formatDateTime(event.date),
      ]

      values.forEach((value, columnIndex) => {
        drawCell(commands, rowX, cursorY, activityColumns[columnIndex], 18, value, {
          fontSize: 8,
          align: columnIndex === 3 ? 'center' : 'left',
        })
        rowX += activityColumns[columnIndex]
      })

      cursorY += 18
    })
  }

  drawText(commands, 'Pagina 1 de 1', marginLeft, pageHeight - 26, {
    fontSize: 8,
    maxWidth: contentWidth,
    align: 'center',
  })

  const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  const stream = commands.join('\n')
  const streamBytes = stringToPdfBytes(stream)
  const contentId = addObject(`<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`)
  const pagesId = addObject('')
  const pageId = addObject(
    `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${formatNumber(pageWidth)} ${formatNumber(pageHeight)}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`,
  )
  pageObjectIds.push(pageId)
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

  chunks.push(`trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)
  return stringToPdfBytes(chunks.join(''))
}
