import { spawnSync } from 'child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..')
const sandboxParentRoot = join(repoRoot, '.tmp')
const copiedEntries = ['app', 'config', 'data', 'frontend', 'lib', 'package.json', 'tests']
const sandboxPrefix = 'critical-tests-'

function removePathRobustly(targetPath) {
  rmSync(targetPath, {
    recursive: true,
    force: true,
    maxRetries: 20,
    retryDelay: 100,
  })
}

function cleanupLegacySandboxes() {
  mkdirSync(sandboxParentRoot, { recursive: true })

  readdirSync(sandboxParentRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .filter(entry => entry.name === 'critical-tests' || entry.name.startsWith(sandboxPrefix))
    .forEach(entry => {
      try {
        removePathRobustly(join(sandboxParentRoot, entry.name))
      } catch {
        // Best effort cleanup only. A stale sandbox must not block the next run.
      }
    })
}

function createSandbox() {
  mkdirSync(sandboxParentRoot, { recursive: true })
  return mkdtempSync(join(sandboxParentRoot, sandboxPrefix))
}

function copySandboxEntries(sandboxRoot) {
  copiedEntries.forEach(entry => {
    const sourcePath = join(repoRoot, entry)

    if (!existsSync(sourcePath)) {
      return
    }

    cpSync(sourcePath, join(sandboxRoot, entry), { recursive: true })
  })
}

cleanupLegacySandboxes()

const sandboxRoot = createSandbox()
copySandboxEntries(sandboxRoot)

const testProcess = spawnSync(
  process.execPath,
  [
    '--test',
    '--test-concurrency=1',
    'tests/critical-flows.test.mjs',
    'tests/cors-proxy.test.mjs',
    'tests/public-app-config.test.mjs',
    'tests/session-cookie-options.test.mjs',
  ],
  {
    cwd: sandboxRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      BENTIX_DATA_SOURCE: 'json',
      DATABASE_URL: '',
    },
  },
)

if (testProcess.status === 0) {
  try {
    removePathRobustly(sandboxRoot)
  } catch (error) {
    console.warn(`Critical test sandbox cleanup skipped: ${error?.code || error?.message || 'unknown error'}`)
  }
} else {
  console.error(`Critical test sandbox kept at ${sandboxRoot}`)
}

process.exit(testProcess.status ?? 1)
