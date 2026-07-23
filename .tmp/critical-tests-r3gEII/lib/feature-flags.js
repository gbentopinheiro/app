import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import {
  getAllFeatureFlagsDb,
  updateFeatureFlagDb,
} from './db/feature-flags-db.js'
import { isMysqlDataSourceEnabled } from './data-source.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const featureFlagsFilePath = join(dataDir, 'feature-flags.json')

export const FEATURE_FLAG_DEFINITIONS = [
  {
    key: 'activityHistory',
    title: 'Historico de atividades',
    description: 'Liga ou desliga a area de historico com horas submetidas, horas aprovadas e notas.',
  },
  {
    key: 'notificationsCenter',
    title: 'Central de notificacoes',
    description: 'Controla o acesso a pagina interna onde aparecem as notas recentes dos chefes.',
  },
  {
    key: 'calendarManagement',
    title: 'Calendario',
    description: 'Ativa ou desativa a pagina e a API de eventos do calendario interno.',
  },
  {
    key: 'dailyWorkNotes',
    title: 'Notas diarias da obra',
    description: 'Permite ou bloqueia a leitura e gravacao das notas diarias feitas pelos chefes.',
  },
  {
    key: 'hoursSubmission',
    title: 'Submissao de horas',
    description: 'Permite ou bloqueia a acao de submeter horas por parte dos chefes.',
  },
  {
    key: 'hoursApproval',
    title: 'Aprovacao de horas',
    description: 'Permite ou bloqueia a aprovacao de horas por administradores e responsaveis.',
  },
]

const DEFAULT_FEATURE_FLAGS = Object.freeze(
  FEATURE_FLAG_DEFINITIONS.reduce((accumulator, definition) => {
    accumulator[definition.key] = true
    return accumulator
  }, {}),
)

function ensureDataDir() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
}

function normalizeFeatureFlags(flags) {
  const nextFlags = { ...DEFAULT_FEATURE_FLAGS }

  if (!flags || typeof flags !== 'object') {
    return nextFlags
  }

  for (const definition of FEATURE_FLAG_DEFINITIONS) {
    if (flags[definition.key] !== undefined) {
      nextFlags[definition.key] = flags[definition.key] === true
    }
  }

  return nextFlags
}

function saveFeatureFlags(flags) {
  ensureDataDir()
  writeFileSync(featureFlagsFilePath, JSON.stringify(normalizeFeatureFlags(flags), null, 2), 'utf8')
}

function getFeatureFlagsJson() {
  ensureDataDir()

  if (!existsSync(featureFlagsFilePath)) {
    saveFeatureFlags(DEFAULT_FEATURE_FLAGS)
    return { ...DEFAULT_FEATURE_FLAGS }
  }

  try {
    const rawFlags = JSON.parse(readFileSync(featureFlagsFilePath, 'utf8'))
    const normalizedFlags = normalizeFeatureFlags(rawFlags)
    saveFeatureFlags(normalizedFlags)
    return normalizedFlags
  } catch (error) {
    console.error('Error loading feature flags:', error.message)
    saveFeatureFlags(DEFAULT_FEATURE_FLAGS)
    return { ...DEFAULT_FEATURE_FLAGS }
  }
}

function mapDbFeatureFlagsToObject(featureFlags) {
  return normalizeFeatureFlags(
    Object.fromEntries(
      (Array.isArray(featureFlags) ? featureFlags : [])
        .map(featureFlag => [featureFlag.key, featureFlag.enabled === true]),
    ),
  )
}

export async function getFeatureFlags() {
  if (!isMysqlDataSourceEnabled()) {
    return getFeatureFlagsJson()
  }

  const featureFlags = await getAllFeatureFlagsDb()
  return mapDbFeatureFlagsToObject(featureFlags)
}

export function getFeatureFlagDefinition(key) {
  return FEATURE_FLAG_DEFINITIONS.find(definition => definition.key === key) || null
}

export async function getFeatureFlagDefinitions() {
  const flags = await getFeatureFlags()

  return FEATURE_FLAG_DEFINITIONS.map(definition => ({
    ...definition,
    enabled: flags[definition.key] !== false,
  }))
}

export async function isFeatureEnabled(key) {
  const flags = await getFeatureFlags()
  return flags[key] !== false
}

function updateFeatureFlagJson(key, enabled) {
  const definition = getFeatureFlagDefinition(key)

  if (!definition) {
    throw new Error('Funcionalidade nao encontrada.')
  }

  const currentFlags = getFeatureFlagsJson()
  const nextFlags = {
    ...currentFlags,
    [key]: enabled === true,
  }

  saveFeatureFlags(nextFlags)
  return nextFlags
}

export async function updateFeatureFlag(key, enabled) {
  const definition = getFeatureFlagDefinition(key)

  if (!definition) {
    throw new Error('Funcionalidade nao encontrada.')
  }

  if (!isMysqlDataSourceEnabled()) {
    return updateFeatureFlagJson(key, enabled)
  }

  await updateFeatureFlagDb(key, enabled)
  return getFeatureFlags()
}
