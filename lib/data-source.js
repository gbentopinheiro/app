export const DATA_SOURCE_JSON = 'json'
export const DATA_SOURCE_MYSQL = 'mysql'

export function getConfiguredDataSource() {
  const configuredDataSource = String(process.env.BENTIX_DATA_SOURCE || '').trim().toLowerCase()
  return configuredDataSource === DATA_SOURCE_MYSQL ? DATA_SOURCE_MYSQL : DATA_SOURCE_JSON
}

export function isMysqlDataSourceEnabled() {
  return getConfiguredDataSource() === DATA_SOURCE_MYSQL
}
