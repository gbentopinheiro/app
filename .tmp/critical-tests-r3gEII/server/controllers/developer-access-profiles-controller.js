import { NextResponse } from 'next/server'
import { hasPermission } from '../../lib/permissions.js'
import { HttpError, isHttpError } from '../errors/http-error.js'
import { jsonResponse } from '../responses/route-response.js'
import {
  getDeveloperAccessProfileDetailService,
  getDeveloperAccessProfilesOverviewService,
  updateDeveloperAccessProfilePermissionsService,
} from '../services/developer-access-profiles-service.js'
import { getCurrentSessionService, requireSessionPermissionService } from '../services/session-service.js'

export async function getDeveloperAccessProfilesController() {
  await requireSessionPermissionService(
    'developer.users.read',
    'Sem permissao para consultar perfis.',
  )

  return jsonResponse({
    profiles: await getDeveloperAccessProfilesOverviewService(),
  })
}

async function requireDeveloperAccessProfilesPermission(permissionKey, forbiddenMessage) {
  const session = await getCurrentSessionService()

  if (!session) {
    throw new HttpError(401, 'Sessao obrigatoria.')
  }

  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, forbiddenMessage)
  }

  return session
}

function toDeveloperAccessProfilePermissionsErrorResponse(error) {
  if (isHttpError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  const message = String(error?.message || 'Erro ao atualizar permissoes do perfil.').trim()
  const status = message.includes('acesso administrativo') && message.includes('developer')
    ? 409
    : message.includes('nao encontrado')
      ? 404
      : message.includes('invalido') || message.includes('Permissoes invalidas')
        ? 400
        : 500

  return NextResponse.json({ error: message }, { status })
}

export async function getDeveloperAccessProfileController(id) {
  try {
    await requireDeveloperAccessProfilesPermission(
      'developer.users.read',
      'Sem permissao para consultar o perfil.',
    )

    return NextResponse.json({
      profile: await getDeveloperAccessProfileDetailService(id),
    })
  } catch (error) {
    if (isHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Erro ao obter o perfil.' }, { status: 500 })
  }
}

export async function updateDeveloperAccessProfilePermissionsController(request, id) {
  try {
    const session = await requireDeveloperAccessProfilesPermission(
      'developer.feature_flags.manage',
      'Sem permissao para gerir permissoes do perfil.',
    )
    const body = await request.json()
    const profile = await updateDeveloperAccessProfilePermissionsService(
      id,
      body?.permissionKeys,
      session.username,
    )

    return NextResponse.json({
      profile,
      message: 'Permissoes do perfil atualizadas com sucesso.',
    })
  } catch (error) {
    return toDeveloperAccessProfilePermissionsErrorResponse(error)
  }
}
