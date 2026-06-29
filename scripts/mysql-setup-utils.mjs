export const MYSQL_SETUP_CONFIRM_FLAG = '--confirm-existing-data'
export const MYSQL_SETUP_CONFIRM_ENV = 'BENTIX_CONFIRM_MYSQL_IMPORT'

const TRUTHY_ENV_VALUES = new Set(['1', 'true', 'yes', 'on'])

export function readMysqlSetupConfirmation(argv = process.argv.slice(2), env = process.env) {
  if (argv.includes(MYSQL_SETUP_CONFIRM_FLAG)) {
    return {
      confirmed: true,
      source: `flag ${MYSQL_SETUP_CONFIRM_FLAG}`,
    }
  }

  const envValue = String(env[MYSQL_SETUP_CONFIRM_ENV] || '')
    .trim()
    .toLowerCase()

  if (TRUTHY_ENV_VALUES.has(envValue)) {
    return {
      confirmed: true,
      source: `env ${MYSQL_SETUP_CONFIRM_ENV}`,
    }
  }

  return {
    confirmed: false,
    source: null,
  }
}

export function summarizeMysqlCounts(countSnapshot = {}) {
  const nonEmptyEntries = Object.entries(countSnapshot).filter(([, value]) => Number(value) > 0)
  const totalRows = nonEmptyEntries.reduce((sum, [, value]) => sum + Number(value), 0)

  return {
    nonEmptyEntries,
    totalRows,
    hasExistingData: nonEmptyEntries.length > 0,
  }
}
