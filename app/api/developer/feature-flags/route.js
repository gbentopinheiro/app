import { NextResponse } from 'next/server'
import { getFeatureFlagDefinitions, updateFeatureFlag } from '../../../../lib/feature-flags.js'
import { isDeveloperRole } from '../../../../lib/roles.js'
import { getServerSession } from '../../../../lib/server-session.js'

function buildForbiddenResponse() {
  return NextResponse.json({ error: 'Apenas o programador pode gerir estas funcionalidades.' }, { status: 403 })
}

export async function GET() {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
  }

  if (!isDeveloperRole(session.role)) {
    return buildForbiddenResponse()
  }

  return NextResponse.json({ flags: getFeatureFlagDefinitions() })
}

export async function PUT(request) {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
  }

  if (!isDeveloperRole(session.role)) {
    return buildForbiddenResponse()
  }

  try {
    const body = await request.json()
    const key = String(body.key || '').trim()
    const enabled = body.enabled === true

    if (!key) {
      return NextResponse.json({ error: 'Funcionalidade obrigatoria.' }, { status: 400 })
    }

    updateFeatureFlag(key, enabled)
    return NextResponse.json({ flags: getFeatureFlagDefinitions() })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar funcionalidade.' }, { status: 400 })
  }
}
