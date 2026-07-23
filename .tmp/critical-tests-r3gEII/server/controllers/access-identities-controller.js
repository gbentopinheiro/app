import { jsonResponse } from '../responses/route-response.js'
import { getAccessIdentitiesResponseService } from '../services/access-identities-service.js'
import { requireSessionPermissionService } from '../services/session-service.js'

export async function getAccessIdentitiesController(request) {
  await requireSessionPermissionService(
    'access_identities.read',
    'Sem permissao para consultar acessos.',
  )

  const { searchParams } = new URL(request.url)
  const includeWorks = searchParams.get('includeWorks') === 'true'

  return jsonResponse(
    await getAccessIdentitiesResponseService({ includeWorks }),
  )
}
