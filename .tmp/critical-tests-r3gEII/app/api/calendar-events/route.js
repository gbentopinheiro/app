import { NextResponse } from 'next/server'
import {
  createCalendarEventController,
  deleteCalendarEventController,
  getCalendarEventsController,
  updateCalendarEventController,
} from '../../../server/controllers/calendar-controller.js'
import { isHttpError } from '../../../server/errors/http-error.js'
import { toNextResponse } from '../../../server/responses/route-response.js'

function toCalendarErrorResponse(error, fallbackMessage, status = 400) {
  if (isHttpError(error)) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  if (!fallbackMessage) {
    throw error
  }

  return NextResponse.json(
    { message: String(error?.message || fallbackMessage).trim() || fallbackMessage },
    { status },
  )
}

export async function GET(request) {
  try {
    return toNextResponse(await getCalendarEventsController(request))
  } catch (error) {
    return toCalendarErrorResponse(error)
  }
}

export async function POST(request) {
  try {
    return toNextResponse(await createCalendarEventController(request))
  } catch (error) {
    return toCalendarErrorResponse(error, 'Nao foi possivel criar o evento.')
  }
}

export async function PUT(request) {
  try {
    return toNextResponse(await updateCalendarEventController(request))
  } catch (error) {
    return toCalendarErrorResponse(error, 'Nao foi possivel atualizar o evento.')
  }
}

export async function DELETE(request) {
  try {
    return toNextResponse(await deleteCalendarEventController(request))
  } catch (error) {
    return toCalendarErrorResponse(error, 'Nao foi possivel remover o evento.')
  }
}
