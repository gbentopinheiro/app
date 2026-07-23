import devAppConfig from './app.dev.js'
import localAppConfig from './app.local.js'
import productionAppConfig from './app.prod.js'

const DEFAULT_PUBLIC_APP_ENV = 'local'

const PUBLIC_APP_CONFIGS = Object.freeze({
  local: localAppConfig,
  dev: devAppConfig,
  prod: productionAppConfig,
})

function normalizePublicAppEnv(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function normalizeApiBaseUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '')
}

export function getSupportedPublicAppEnvs() {
  return Object.keys(PUBLIC_APP_CONFIGS)
}

export function resolvePublicAppEnv(env = process.env) {
  const configuredAppEnv = normalizePublicAppEnv(env?.NEXT_PUBLIC_APP_ENV)

  if (!configuredAppEnv) {
    return DEFAULT_PUBLIC_APP_ENV
  }

  if (PUBLIC_APP_CONFIGS[configuredAppEnv]) {
    return configuredAppEnv
  }

  throw new Error(
    `Unsupported NEXT_PUBLIC_APP_ENV "${env?.NEXT_PUBLIC_APP_ENV}". Supported values: ${getSupportedPublicAppEnvs().join(', ')}.`,
  )
}

export function resolvePublicAppConfig(env = process.env) {
  const appEnv = resolvePublicAppEnv(env)
  const configuredProfile = PUBLIC_APP_CONFIGS[appEnv] || PUBLIC_APP_CONFIGS[DEFAULT_PUBLIC_APP_ENV]
  const apiBaseUrlOverride = normalizeApiBaseUrl(env?.NEXT_PUBLIC_API_BASE_URL)
  const apiBaseUrl = apiBaseUrlOverride || normalizeApiBaseUrl(configuredProfile.apiBaseUrl)

  return Object.freeze({
    appEnv,
    apiBaseUrl,
    apiBaseUrlSource: apiBaseUrlOverride
      ? 'NEXT_PUBLIC_API_BASE_URL'
      : `config/app.${appEnv}.js`,
  })
}
