import { NextResponse } from 'next/server'
import { updateDeveloperAccessProfilePermissions } from '../../../../../../lib/developer-management.js'
import { hasPermission } from '../../../../../../lib/permissions.js'
import { getServerSession } from '../../../../../../lib/server-session.js'

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'developer.feature_flags.manage')) {
      return NextResponse.json({ error: 'Sem permissao para gerir permissoes do perfil.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const profile = await updateDeveloperAccessProfilePermissions(
      id,
      body.permissionKeys,
      session.username,
    )

    return NextResponse.json({
      profile,
      message: 'Permissoes do perfil atualizadas com sucesso.',
    })
  } catch (error) {
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
}
