import { isMysqlDataSourceEnabled } from '../../lib/data-source.js'
import { getPermissionsCatalogMysql } from './identity-catalog-service.js'

export async function getDeveloperPermissionsCatalogService() {
  if (isMysqlDataSourceEnabled()) {
    return getPermissionsCatalogMysql()
  }

  const { getDeveloperPermissionsCatalog } = await import('../../lib/developer-management.js')
  return getDeveloperPermissionsCatalog()
}
