import { NextResponse } from 'next/server'
import { inferAccountType } from '../../../../lib/account-types.js'
import { readProtectedRequestJson } from '../../../../lib/login-transport.js'
import { getPasswordPolicyError, verifyPassword } from '../../../../lib/passwords.js'
import { getServerSession } from '../../../../lib/server-session.js'
import { getUserByUsernameData, updateUserPasswordData } from '../../../../lib/users.js'

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
    const accountType = inferAccountType(session)

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const user = await getUserByUsernameData(session.username)

    if (!user) {
      return NextResponse.json({ error: 'Conta nao encontrada.' }, { status: 404 })
    }

    if (!(await verifyPassword(currentPassword, user.passwordHash || user.password))) {
      return NextResponse.json({ error: 'A palavra-passe atual esta incorreta.' }, { status: 400 })
    }

    const updatedUser = await updateUserPasswordData(user.id, newPassword, { accountType })

    if (!updatedUser) {
      return NextResponse.json({ error: 'Conta nao encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Palavra-passe atualizada com sucesso.' })
  } catch (error) {
    if (error.message?.includes('protecao') || error.message?.includes('protegido')) {
      return NextResponse.json({ error: 'Pedido sensivel nao protegido.' }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Erro ao atualizar palavra-passe.' }, { status: 500 })
  }
}
