import { NextResponse } from 'next/server'
import { readProtectedRequestJson } from '../../lib/login-transport.js'
import { isHttpError } from '../errors/http-error.js'
import { getCurrentSessionService } from '../services/session-service.js'
import { changeOwnPasswordService } from '../services/account-password-service.js'

function isProtectedRequestError(error) {
  return error?.message?.includes('protecao') || error?.message?.includes('protegido')
}

export async function patchAccountPasswordController(request) {
  try {
    const session = await getCurrentSessionService()
    const body = await readProtectedRequestJson(request)
    return NextResponse.json(await changeOwnPasswordService(session, body))
  } catch (error) {
    if (isProtectedRequestError(error)) {
      return NextResponse.json({ error: 'Pedido sensivel nao protegido.' }, { status: 400 })
    }

    if (isHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      { error: error?.message || 'Erro ao atualizar palavra-passe.' },
      { status: 500 },
    )
  }
}
