import { NextResponse } from 'next/server'
import { hasPermission } from '../../lib/permissions.js'
import { getCurrentSessionService } from '../services/session-service.js'
import {
  getDeveloperFeatureFlagsService,
  updateDeveloperFeatureFlagService,
} from '../services/developer-feature-flags-service.js'

function buildForbiddenResponse() {
  return NextResponse.json(
    { error: 'Apenas o programador pode gerir estas funcionalidades.' },
    { status: 403 },
  )
}

export async function getDeveloperFeatureFlagsController() {
  const session = await getCurrentSessionService()

  if (!session) {
    return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
  }

  if (!hasPermission(session, 'developer.feature_flags.read')) {
    return buildForbiddenResponse()
  }

  return NextResponse.json({ flags: await getDeveloperFeatureFlagsService() })
}

export async function updateDeveloperFeatureFlagsController(request) {
  const session = await getCurrentSessionService()

  if (!session) {
    return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
  }

  if (!hasPermission(session, 'developer.feature_flags.manage')) {
    return buildForbiddenResponse()
  }

  try {
    const body = await request.json()
    const key = String(body?.key || '').trim()
    const enabled = body?.enabled === true

    if (!key) {
      return NextResponse.json({ error: 'Funcionalidade obrigatoria.' }, { status: 400 })
    }

    return NextResponse.json({
      flags: await updateDeveloperFeatureFlagService(key, enabled),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao atualizar funcionalidade.' },
      { status: 400 },
    )
  }
}
