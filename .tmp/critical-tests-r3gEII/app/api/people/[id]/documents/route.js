import { NextResponse } from 'next/server'
import {
  createPeopleDocumentController,
  getPeopleDocumentsController,
} from '../../../../../server/controllers/people-documents-controller.js'
import { isHttpError } from '../../../../../server/errors/http-error.js'
import { toNextErrorResponse, toNextResponse } from '../../../../../server/responses/route-response.js'

function getErrorStatus(error) {
  const message = String(error?.message || '')

  if (message.includes('obrigatorio') || message.includes('valida') || message.includes('valido')) {
    return 400
  }

  if (message.includes('nao encontrada')) {
    return 404
  }

  return 500
}

function toMutationErrorResponse(error, fallbackMessage) {
  if (isHttpError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  return NextResponse.json(
    { error: error?.message || fallbackMessage },
    { status: getErrorStatus(error) },
  )
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await getPeopleDocumentsController(id))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter documentos.')
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params
    return toNextResponse(await createPeopleDocumentController(request, id))
  } catch (error) {
    return toMutationErrorResponse(error, 'Erro ao criar documento.')
  }
}
