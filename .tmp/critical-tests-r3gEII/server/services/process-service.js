import * as xlsx from 'xlsx'
import { existsSync } from 'fs'
import { join } from 'path'
import { pruneAccessIdentitiesByValidPersonIdsData } from '../../lib/access-identities.js'
import { replaceAllPeopleData } from '../../lib/people.js'
import { HttpError } from '../errors/http-error.js'

const { read, readFile, utils } = xlsx

function parsePeopleSheet(workbook) {
  let sheetIndex = 0

  if (workbook.SheetNames.length >= 3) {
    sheetIndex = 2
  }

  const sheetName = workbook.SheetNames[sheetIndex]
  const sheet = workbook.Sheets[sheetName]
  const data = utils.sheet_to_json(sheet, { header: 1 })
  const people = []

  for (let index = 6; index < data.length; index += 1) {
    const row = data[index]
    const name = row?.[2]
    const hourlyPrice = parseFloat(row?.[35]) || 0
    const monthlyPrice = parseFloat(row?.[36]) || 0

    if (name && typeof name === 'string' && name.trim()) {
      people.push({
        id: people.length + 1,
        name: name.trim(),
        price: hourlyPrice,
        monthlyPrice,
        isMonthlyBilling: monthlyPrice > 0,
      })
    }
  }

  return {
    sheetName,
    total: people.length,
    people,
  }
}

export async function getLegacyProcessPreviewService() {
  const filePath = join(process.cwd(), 'data', 'pessoas.xlsx')

  if (!existsSync(filePath)) {
    throw new HttpError(404, 'Arquivo data/pessoas.xlsx n\u00e3o encontrado')
  }

  const workbook = readFile(filePath)
  return parsePeopleSheet(workbook)
}

export async function importLegacyProcessWorkbookService(file) {
  if (!file) {
    throw new HttpError(400, 'Nenhum arquivo enviado')
  }

  if (
    file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
    file.type !== 'application/vnd.ms-excel'
  ) {
    throw new HttpError(400, 'Tipo de arquivo n\u00e3o suportado')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const workbook = read(buffer, { type: 'buffer' })
  const result = parsePeopleSheet(workbook)
  const updatedPeople = await replaceAllPeopleData(result.people)

  await pruneAccessIdentitiesByValidPersonIdsData(updatedPeople.map(person => person.id))

  return {
    message: 'Dados atualizados com sucesso',
    sheetName: result.sheetName,
    total: updatedPeople.length,
    people: updatedPeople,
  }
}
