import { NextResponse } from 'next/server'
import * as xlsx from 'xlsx'
import { existsSync } from 'fs'
import { join } from 'path'
import { replaceAllPeople } from '../../../lib/people.js'
import { pruneAccessIdentitiesByValidPersonIdsData } from '../../../lib/access-identities.js'

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

  for (let i = 6; i < data.length; i++) {
    const row = data[i]
    const name = row?.[2]
    const hourlyPrice = parseFloat(row?.[35]) || 0
    const monthlyPrice = parseFloat(row?.[36]) || 0

    if (name && typeof name === 'string' && name.trim()) {
      people.push({
        id: people.length + 1,
        name: name.trim(),
        price: hourlyPrice,
        monthlyPrice,
        isMonthlyBilling: monthlyPrice > 0
      })
    }
  }

  return {
    sheetName,
    total: people.length,
    people
  }
}

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'data', 'pessoas.xlsx')

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'Arquivo data/pessoas.xlsx não encontrado' }, { status: 404 })
    }

    const workbook = readFile(filePath)
    const result = parsePeopleSheet(workbook)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao ler o arquivo Excel:', error)
    return NextResponse.json({ error: 'Erro ao ler o arquivo Excel' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (
      file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
      file.type !== 'application/vnd.ms-excel'
    ) {
      return NextResponse.json({ error: 'Tipo de arquivo não suportado' }, { status: 400 })
    }

    const workbook = read(buffer, { type: 'buffer' })
    const result = parsePeopleSheet(workbook)
    const updatedPeople = replaceAllPeople(result.people)
    await pruneAccessIdentitiesByValidPersonIdsData(updatedPeople.map(person => person.id))

    return NextResponse.json({
      message: 'Dados atualizados com sucesso',
      sheetName: result.sheetName,
      total: updatedPeople.length,
      people: updatedPeople
    })
  } catch (error) {
    console.error('Erro ao processar o arquivo:', error)
    return NextResponse.json({ error: 'Erro ao processar o arquivo' }, { status: 500 })
  }
}
