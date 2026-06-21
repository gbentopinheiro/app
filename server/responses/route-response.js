import { NextResponse } from 'next/server'
import { isHttpError } from '../errors/http-error.js'

export function jsonResponse(body, status = 200) {
  return {
    body,
    status,
  }
}

export function toNextResponse(result) {
  return NextResponse.json(result?.body ?? null, {
    status: Number(result?.status) || 200,
  })
}

export function toNextErrorResponse(error, fallbackMessage) {
  if (isHttpError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  return NextResponse.json(
    { error: String(fallbackMessage || 'Erro interno.').trim() || 'Erro interno.' },
    { status: 500 },
  )
}
