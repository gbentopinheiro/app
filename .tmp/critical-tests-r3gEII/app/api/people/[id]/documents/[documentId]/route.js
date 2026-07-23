import { NextResponse } from 'next/server'
import {
  deletePeopleDocumentController,
  updatePeopleDocumentController,
} from '../../../../../../server/controllers/people-documents-controller.js'
import { isHttpError } from '../../../../../../server/errors/http-error.js'
import { toNextErrorResponse, toNextResponse } from '../../../../../../server/responses/route-response.js'

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

export async function PUT(request, { params }) {
  try {
    const { id, documentId } = await params
    return toNextResponse(await updatePeopleDocumentController(request, id, documentId))
  } catch (error) {
    return toMutationErrorResponse(error, 'Erro ao atualizar documento.')
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id, documentId } = await params
    return toNextResponse(await deletePeopleDocumentController(id, documentId))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao remover documento.')
  }
}
