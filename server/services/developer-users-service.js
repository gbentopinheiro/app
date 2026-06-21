import { isMysqlDataSourceEnabled } from '../../lib/data-source.js'
import {
  getDeveloperUserDetail,
  updateDeveloperUserSettings,
} from '../../lib/developer-management.js'
import { getUserByIdData, updateUserPasswordData } from '../../lib/users.js'
import { HttpError } from '../errors/http-error.js'
import { getDeveloperUsersOverviewMysql } from './identity-catalog-service.js'

export async function getDeveloperUsersOverviewService() {
  if (isMysqlDataSourceEnabled()) {
    return getDeveloperUsersOverviewMysql()
  }

  const { getDeveloperUsersOverview } = await import('../../lib/developer-management.js')
  return getDeveloperUsersOverview()
}

function toDeveloperUserSettingsError(error, fallbackMessage = 'Erro ao atualizar conta tecnica.') {
  const message = String(error?.message || fallbackMessage).trim() || fallbackMessage
  const status = message.includes('acesso administrativo') && message.includes('developer')
    ? 409
    : message.includes('nao encontrado')
      ? 404
      : message.includes('invalido')
        ? 400
        : 500

  return new HttpError(status, message)
}

function generateTemporaryPassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*'

  let chars =
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    special[Math.floor(Math.random() * special.length)]

  const all = uppercase + lowercase + numbers + special
  for (let i = 0; i < 8; i++) {
    chars += all[Math.floor(Math.random() * all.length)]
  }

  return chars
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

export async function getDeveloperUserDetailService(userId) {
  const payload = await getDeveloperUserDetail(userId)

  if (!payload) {
    throw new HttpError(404, 'Utilizador nao encontrado.')
  }

  return payload
}

export async function updateDeveloperUserSettingsService(userId, payload = {}, actorUsername = 'developer') {
  try {
    return await updateDeveloperUserSettings(
      userId,
      {
        accessProfileId: payload?.accessProfileId,
        active: payload?.active,
        unlockBlocked: payload?.unlockBlocked,
      },
      actorUsername,
    )
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toDeveloperUserSettingsError(error)
  }
}

export async function prepareDeveloperUserPasswordResetService(payload = {}) {
  const { userId, type } = payload

  if (!userId || !type || !['admin', 'developer', 'operational'].includes(type)) {
    throw new HttpError(400, 'Parametros invalidos.')
  }

  const user = await getUserByIdData(userId, { accountType: type })

  if (!user) {
    throw new HttpError(404, 'Utilizador nao encontrado.')
  }

  return {
    user,
    type,
    temporaryPassword: generateTemporaryPassword(),
  }
}

export async function applyDeveloperUserPasswordResetService(resetContext) {
  const updatedUser = await updateUserPasswordData(
    resetContext?.user?.id,
    resetContext?.temporaryPassword,
    {
      enforcePolicy: false,
      accountType: resetContext?.type,
    },
  )

  if (!updatedUser) {
    throw new HttpError(404, 'Utilizador nao encontrado.')
  }

  return {
    message: 'Palavra-passe redefenida com sucesso.',
    temporaryPassword: resetContext.temporaryPassword,
    note: 'Esta palavra-passe e temporaria e deve ser alterada no proximo login. Nao e segura para uso prolongado.',
  }
}
