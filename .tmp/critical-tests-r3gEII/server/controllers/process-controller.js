import { NextResponse } from 'next/server'
import { isHttpError } from '../errors/http-error.js'
import {
  getLegacyProcessPreviewService,
  importLegacyProcessWorkbookService,
} from '../services/process-service.js'

function toProcessErrorResponse(error, fallbackMessage) {
  if (isHttpError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  if (String(error?.message || '').includes('ainda nao suporta MySQL')) {
    return NextResponse.json({ error: String(error.message).trim() }, { status: 409 })
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 })
}

export async function getLegacyProcessController() {
  try {
    return NextResponse.json(await getLegacyProcessPreviewService())
  } catch (error) {
    console.error('Erro ao ler o arquivo Excel:', error)
    return toProcessErrorResponse(error, 'Erro ao ler o arquivo Excel')
  }
}

export async function postLegacyProcessController(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    return NextResponse.json(await importLegacyProcessWorkbookService(file))
  } catch (error) {
    console.error('Erro ao processar o arquivo:', error)
    return toProcessErrorResponse(error, 'Erro ao processar o arquivo')
  }
}
