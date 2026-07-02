import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { test } from 'node:test'

import { shouldApplyNoCache } from '../lib/cache-policy.js'
import { buildPwaBootstrapScript, getPwaReloadGuardKey } from '../lib/pwa-bootstrap.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..')
const serviceWorkerSource = readFileSync(join(repoRoot, 'public', 'sw.js'), 'utf8')

test('bootstrap da PWA vigia updates e recarrega apenas uma vez por build', () => {
  const script = buildPwaBootstrapScript({ buildVersion: 'build-123' })

  assert.equal(getPwaReloadGuardKey('build-123'), 'bentix:pwa:reload:build-123')
  assert.match(script, /serviceWorker[\s\S]*\.register\(serviceWorkerUrl/)
  assert.match(script, /\/sw\.js\?v=build-123/)
  assert.match(script, /updatefound/)
  assert.match(script, /controllerchange/)
  assert.match(script, /sessionStorage/)
  assert.match(script, /location\.reload\(\)/)
  assert.match(script, /SKIP_WAITING/)
})

test('service worker limpa caches antigos e força network no-store para app shell', () => {
  assert.match(serviceWorkerSource, /self\.skipWaiting\(\)/)
  assert.match(serviceWorkerSource, /caches\.keys\(\)/)
  assert.match(serviceWorkerSource, /caches\.delete/)
  assert.match(serviceWorkerSource, /self\.clients\.claim\(\)/)
  assert.match(serviceWorkerSource, /cache:\s*'no-store'/)
  assert.match(serviceWorkerSource, /pathname === '\/manifest\.webmanifest'/)
  assert.match(serviceWorkerSource, /pathname === '\/mobile\/login'/)
  assert.match(serviceWorkerSource, /pathname\.startsWith\('\/mobile\/'\)/)
  assert.match(serviceWorkerSource, /pathname\.startsWith\('\/_next\/'\)/)
})

test('sw e manifest continuam marcados para no-cache no proxy', () => {
  assert.equal(shouldApplyNoCache('/sw.js'), true)
  assert.equal(shouldApplyNoCache('/manifest.webmanifest'), true)
  assert.equal(shouldApplyNoCache('/login'), true)
  assert.equal(shouldApplyNoCache('/mobile/chef'), true)
})
