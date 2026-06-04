import { spawnSync } from 'child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..')
const sandboxRoot = join(repoRoot, '.tmp', 'critical-tests')
const copiedEntries = ['app', 'data', 'lib', 'package.json', 'tests']

function resetSandbox() {
  rmSync(sandboxRoot, { recursive: true, force: true })
  mkdirSync(sandboxRoot, { recursive: true })
}

function copySandboxEntries() {
  copiedEntries.forEach(entry => {
    const sourcePath = join(repoRoot, entry)

    if (!existsSync(sourcePath)) {
      return
    }

    cpSync(sourcePath, join(sandboxRoot, entry), { recursive: true })
  })
}

resetSandbox()
copySandboxEntries()

const testProcess = spawnSync(
  process.execPath,
  ['--test', '--test-concurrency=1', 'tests/critical-flows.test.mjs'],
  {
    cwd: sandboxRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  },
)

if (testProcess.status === 0) {
  rmSync(sandboxRoot, { recursive: true, force: true })
} else {
  console.error(`Critical test sandbox kept at ${sandboxRoot}`)
}

process.exit(testProcess.status ?? 1)
