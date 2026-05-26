import { NextResponse } from 'next/server'
import { getAccessIdentityById, updateAccessIdentity } from '../../../../lib/access-identities.js'
import { getAdminById, updateAdminPassword } from '../../../../lib/admins.js'
import { getDeveloperById, updateDeveloperPassword } from '../../../../lib/developers.js'
import { readProtectedRequestJson } from '../../../../lib/login-transport.js'
import { getPasswordPolicyError, verifyPassword } from '../../../../lib/passwords.js'
import { isDeveloperRole } from '../../../../lib/roles.js'
import { getServerSession } from '../../../../lib/server-session.js'

function validatePasswordPayload({ currentPassword, newPassword, confirmPassword }) {
  if (!currentPassword || !newPassword || !confirmPassword) {
    return 'Preenche todos os campos.'
  }

  const policyError = getPasswordPolicyError(newPassword)

  if (policyError) {
    return policyError
  }

  if (newPassword !== confirmPassword) {
    return 'A confirmacao nao corresponde a nova palavra-passe.'
  }

  if (currentPassword === newPassword) {
    return 'A nova palavra-passe deve ser diferente da atual.'
  }

  return ''
}

export async function PATCH(request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    const body = await readProtectedRequestJson(request)
    const currentPassword = String(body.currentPassword || '')
    const newPassword = String(body.newPassword || '')
    const confirmPassword = String(body.confirmPassword || '')
    const validationError = validatePasswordPayload({ currentPassword, newPassword, confirmPassword })

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    if (isDeveloperRole(session.role)) {
      const developer = getDeveloperById(session.userId)

      if (!developer) {
        return NextResponse.json({ error: 'Conta nao encontrada.' }, { status: 404 })
      }

      if (!(await verifyPassword(currentPassword, developer.password))) {
        return NextResponse.json({ error: 'A palavra-passe atual esta incorreta.' }, { status: 400 })
      }

      updateDeveloperPassword(developer.id, newPassword)
      return NextResponse.json({ message: 'Palavra-passe atualizada com sucesso.' })
    }

    const accessIdentity = session.personId ? getAccessIdentityById(session.userId) : null

    if (accessIdentity) {
      if (!(await verifyPassword(currentPassword, accessIdentity.password))) {
        return NextResponse.json({ error: 'A palavra-passe atual esta incorreta.' }, { status: 400 })
      }

      updateAccessIdentity(accessIdentity.id, { password: newPassword })
      return NextResponse.json({ message: 'Palavra-passe atualizada com sucesso.' })
    }

    const admin = getAdminById(session.userId)

    if (!admin) {
      return NextResponse.json({ error: 'Conta nao encontrada.' }, { status: 404 })
    }

    if (!(await verifyPassword(currentPassword, admin.password))) {
      return NextResponse.json({ error: 'A palavra-passe atual esta incorreta.' }, { status: 400 })
    }

    updateAdminPassword(admin.id, newPassword)
    return NextResponse.json({ message: 'Palavra-passe atualizada com sucesso.' })
  } catch (error) {
    if (error.message?.includes('protecao') || error.message?.includes('protegido')) {
      return NextResponse.json({ error: 'Pedido sensível não protegido.' }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Erro ao atualizar palavra-passe.' }, { status: 500 })
  }
}
