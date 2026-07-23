import { inferAccountType } from '../../lib/account-types.js'
import { getPasswordPolicyError, verifyPassword } from '../../lib/passwords.js'
import { hasPermission } from '../../lib/permissions.js'
import { getUserByUsernameData, updateUserPasswordData } from '../../lib/users.js'
import { HttpError } from '../errors/http-error.js'

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

export async function changeOwnPasswordService(session, body) {
  if (!session) {
    throw new HttpError(401, 'Sessao obrigatoria.')
  }

  if (!hasPermission(session, 'account.password.change_self')) {
    throw new HttpError(403, 'Sem permissao para alterar a palavra-passe.')
  }

  const currentPassword = String(body?.currentPassword || '')
  const newPassword = String(body?.newPassword || '')
  const confirmPassword = String(body?.confirmPassword || '')
  const validationError = validatePasswordPayload({ currentPassword, newPassword, confirmPassword })
  const accountType = inferAccountType(session)

  if (validationError) {
    throw new HttpError(400, validationError)
  }

  const user = await getUserByUsernameData(session.username)

  if (!user) {
    throw new HttpError(404, 'Conta nao encontrada.')
  }

  if (!(await verifyPassword(currentPassword, user.passwordHash || user.password))) {
    throw new HttpError(400, 'A palavra-passe atual esta incorreta.')
  }

  const updatedUser = await updateUserPasswordData(user.id, newPassword, { accountType })

  if (!updatedUser) {
    throw new HttpError(404, 'Conta nao encontrada.')
  }

  return { message: 'Palavra-passe atualizada com sucesso.' }
}
