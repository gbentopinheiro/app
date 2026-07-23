import { jsonResponse } from '../responses/route-response.js'
import { getDeveloperPermissionsCatalogService } from '../services/developer-permissions-service.js'
import { requireSessionPermissionService } from '../services/session-service.js'

export async function getDeveloperPermissionsController() {
  await requireSessionPermissionService(
    'developer.users.read',
    'Sem permissao para consultar permissoes.',
  )

  return jsonResponse({
    permissions: await getDeveloperPermissionsCatalogService(),
  })
}
