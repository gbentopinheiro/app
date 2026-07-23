import {
  deleteDailyWorkNotesController,
  getDailyWorkNotesController,
  upsertDailyWorkNoteController,
} from '../../../server/controllers/daily-work-notes-controller.js'
import { isHttpError } from '../../../server/errors/http-error.js'
import { toNextErrorResponse, toNextResponse } from '../../../server/responses/route-response.js'

function toDailyWorkNotesPutErrorResponse(error) {
  if (isHttpError(error)) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  }

  const message = String(error?.message || 'Erro ao guardar nota.').trim() || 'Erro ao guardar nota.'
  const status = message.includes('obrigatoria') ? 400 : 500

  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

export async function GET(request) {
  try {
    return toNextResponse(await getDailyWorkNotesController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter notas.')
  }
}

export async function PUT(request) {
  try {
    return toNextResponse(await upsertDailyWorkNoteController(request))
  } catch (error) {
    return toDailyWorkNotesPutErrorResponse(error)
  }
}

export async function DELETE(request) {
  try {
    return toNextResponse(await deleteDailyWorkNotesController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao remover notas.')
  }
}
