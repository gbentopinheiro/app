import { FEATURE_FLAG_DEFINITIONS, getFeatureFlagDefinition } from '../../lib/feature-flags.js'
import { getAllFeatureFlagsDb, updateFeatureFlagDb } from '../../lib/db/feature-flags-db.js'

function mapFeatureFlagsToDefinitions(featureFlags) {
  const featureFlagsByKey = new Map(
    (Array.isArray(featureFlags) ? featureFlags : []).map(featureFlag => [
      String(featureFlag?.key || '').trim(),
      featureFlag?.enabled === true,
    ]),
  )

  return FEATURE_FLAG_DEFINITIONS.map(definition => ({
    ...definition,
    enabled: featureFlagsByKey.get(definition.key) !== false,
  }))
}

export async function getDeveloperFeatureFlagsService() {
  return mapFeatureFlagsToDefinitions(await getAllFeatureFlagsDb())
}

export async function updateDeveloperFeatureFlagService(key, enabled) {
  const definition = getFeatureFlagDefinition(key)

  if (!definition) {
    throw new Error('Funcionalidade nao encontrada.')
  }

  await updateFeatureFlagDb(key, enabled === true)
  return getDeveloperFeatureFlagsService()
}
