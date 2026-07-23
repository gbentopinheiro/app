import { NextResponse } from 'next/server'
import { hasPermission } from '../../lib/permissions.js'
import { HttpError, isHttpError } from '../errors/http-error.js'
import { jsonResponse } from '../responses/route-response.js'
import {
  applyDeveloperUserPasswordResetService,
  getDeveloperUserDetailService,
  getDeveloperUsersOverviewService,
  prepareDeveloperUserPasswordResetService,
  updateDeveloperUserSettingsService,
} from '../services/developer-users-service.js'
import { getCurrentSessionService, requireSessionPermissionService } from '../services/session-service.js'

export async function getDeveloperUsersController() {
  await requireSessionPermissionService(
    'developer.users.read',
    'Apenas o programador pode aceder a esta informacao.',
  )

  return jsonResponse(await getDeveloperUsersOverviewService())
}

async function requireDeveloperUserPermission(permissionKey, forbiddenMessage) {
  const session = await getCurrentSessionService()

  if (!session) {
    throw new HttpError(401, 'Sessao obrigatoria.')
  }

  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, forbiddenMessage)
  }

  return session
}

function toDeveloperUserSettingsErrorResponse(error) {
  if (isHttpError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  const message = String(error?.message || 'Erro ao atualizar conta tecnica.').trim()
  const status = message.includes('acesso administrativo') && message.includes('developer')
    ? 409
    : message.includes('nao encontrado')
      ? 404
      : message.includes('invalido')
        ? 400
        : 500

  return NextResponse.json({ error: message }, { status })
}

export async function getDeveloperUserController(id) {
  try {
    await requireDeveloperUserPermission(
      'developer.users.read',
      'Sem permissao para consultar a conta tecnica.',
    )

    return NextResponse.json(await getDeveloperUserDetailService(id))
  } catch (error) {
    if (isHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Erro ao obter detalhe do utilizador.' }, { status: 500 })
  }
}

export async function updateDeveloperUserController(request, id) {
  try {
    const session = await requireDeveloperUserPermission(
      'developer.users.reset_password',
      'Sem permissao para gerir a conta tecnica.',
    )
    const body = await request.json()
    const payload = await updateDeveloperUserSettingsService(id, body, session.username)

    return NextResponse.json({
      ...payload,
      message: 'Conta tecnica atualizada com sucesso.',
    })
  } catch (error) {
    return toDeveloperUserSettingsErrorResponse(error)
  }
}

export async function resetDeveloperUserPasswordController(request) {
  const session = await getCurrentSessionService()

  if (!session) {
    return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
  }

  if (!hasPermission(session, 'developer.users.reset_password')) {
    return NextResponse.json({ error: 'Apenas o programador pode fazer isto.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const resetContext = await prepareDeveloperUserPasswordResetService(body)

    try {
      return NextResponse.json(await applyDeveloperUserPasswordResetService(resetContext))
    } catch (error) {
      if (isHttpError(error)) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }

      console.error('Error updating password:', error.message)
      return NextResponse.json({ error: 'Erro ao redefinir palavra-passe.' }, { status: 500 })
    }
  } catch (error) {
    if (isHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Error in reset password endpoint:', error.message)
    return NextResponse.json({ error: 'Erro ao processar pedido.' }, { status: 500 })
  }
}
