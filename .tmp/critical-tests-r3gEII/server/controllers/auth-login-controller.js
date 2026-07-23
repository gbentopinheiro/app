import { NextResponse } from 'next/server'
import { readProtectedRequestJson } from '../../lib/login-transport.js'
import { isHttpError } from '../errors/http-error.js'
import { loginService } from '../services/auth-login-service.js'

function isProtectedRequestError(error) {
  return error?.message?.includes('protecao') || error?.message?.includes('protegido')
}

function toLoginErrorResponse(error) {
  if (isProtectedRequestError(error)) {
    return NextResponse.json({ error: 'Pedido de login nao protegido.' }, { status: 400 })
  }

  if (isHttpError(error)) {
    const response = NextResponse.json({ error: error.message }, { status: error.status })

    if (error.retryAfterSeconds) {
      response.headers.set('Retry-After', String(error.retryAfterSeconds))
    }

    return response
  }

  return NextResponse.json({ error: 'Erro ao iniciar sessao.' }, { status: 500 })
}

export async function postAuthLoginController(request) {
  try {
    const body = await readProtectedRequestJson(request)
    const result = await loginService(body, {
      userAgent: request.headers.get('user-agent') || '',
    })
    const response = NextResponse.json(result.body)

    response.cookies.set(result.cookieName, result.sessionToken, result.cookieOptions)
    return response
  } catch (error) {
    return toLoginErrorResponse(error)
  }
}
