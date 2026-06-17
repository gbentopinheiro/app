import { NextResponse } from 'next/server'
import { getDeveloperUserDetail, updateDeveloperUserSettings } from '../../../../../lib/developer-management.js'
import { hasPermission } from '../../../../../lib/permissions.js'
import { getServerSession } from '../../../../../lib/server-session.js'

async function requireDeveloperUserPermission(permissionKey, errorMessage) {
  const session = await getServerSession()

  if (!session) {
    return { error: NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 }) }
  }

  if (!hasPermission(session, permissionKey)) {
    return { error: NextResponse.json({ error: errorMessage }, { status: 403 }) }
  }

  return { session }
}

export async function GET(request, { params }) {
  try {
    const auth = await requireDeveloperUserPermission(
      'developer.users.read',
      'Sem permissao para consultar a conta tecnica.',
    )
    if (auth.error) return auth.error

    const { id } = await params
    const payload = await getDeveloperUserDetail(id)

    if (!payload) {
      return NextResponse.json({ error: 'Utilizador nao encontrado.' }, { status: 404 })
    }

    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter detalhe do utilizador.' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await requireDeveloperUserPermission(
      'developer.users.reset_password',
      'Sem permissao para gerir a conta tecnica.',
    )
    if (auth.error) return auth.error

    const { id } = await params
    const body = await request.json()
    const payload = await updateDeveloperUserSettings(
      id,
      {
        accessProfileId: body.accessProfileId,
        active: body.active,
        unlockBlocked: body.unlockBlocked,
      },
      auth.session.username,
    )

    return NextResponse.json({
      ...payload,
      message: 'Conta tecnica atualizada com sucesso.',
    })
  } catch (error) {
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
}
