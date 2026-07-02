import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..')
const dockerfilePath = join(repoRoot, 'infra', 'docker', 'app', 'Dockerfile')
const dockerfileSource = readFileSync(dockerfilePath, 'utf8')

test('Dockerfile copia public para o builder e para a imagem final', () => {
  assert.match(dockerfileSource, /^COPY public \.\/public$/m)
  assert.match(dockerfileSource, /^COPY --from=builder \/app\/public \.\/public$/m)
})
