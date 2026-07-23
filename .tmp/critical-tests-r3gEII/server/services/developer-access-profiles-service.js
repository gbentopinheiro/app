import { isMysqlDataSourceEnabled } from '../../lib/data-source.js'
import {
  getDeveloperAccessProfileDetail,
  updateDeveloperAccessProfilePermissions,
} from '../../lib/developer-management.js'
import { HttpError } from '../errors/http-error.js'
import { getDeveloperAccessProfilesOverviewMysql } from './identity-catalog-service.js'

export async function getDeveloperAccessProfilesOverviewService() {
  if (isMysqlDataSourceEnabled()) {
    return getDeveloperAccessProfilesOverviewMysql()
  }

  const { getDeveloperAccessProfilesOverview } = await import('../../lib/developer-management.js')
  return getDeveloperAccessProfilesOverview()
}

function toDeveloperAccessProfilePermissionsError(
  error,
  fallbackMessage = 'Erro ao atualizar permissoes do perfil.',
) {
  const message = String(error?.message || fallbackMessage).trim() || fallbackMessage
  const status = message.includes('acesso administrativo') && message.includes('developer')
    ? 409
    : message.includes('nao encontrado')
      ? 404
      : message.includes('invalido') || message.includes('Permissoes invalidas')
        ? 400
        : 500

  return new HttpError(status, message)
}

export async function getDeveloperAccessProfileDetailService(profileId) {
  const profile = await getDeveloperAccessProfileDetail(profileId)

  if (!profile) {
    throw new HttpError(404, 'Perfil nao encontrado.')
  }

  return profile
}

export async function updateDeveloperAccessProfilePermissionsService(
  profileId,
  permissionKeys = [],
  actorUsername = 'developer',
) {
  try {
    return await updateDeveloperAccessProfilePermissions(profileId, permissionKeys, actorUsername)
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw toDeveloperAccessProfilePermissionsError(error)
  }
}
