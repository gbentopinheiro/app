import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { test } from 'node:test'

import { shouldApplyNoCache } from '../lib/cache-policy.js'
import {
  bootstrapPwa,
  getPwaReloadGuardKey,
  shouldEnablePwaBootstrap,
} from '../lib/pwa-bootstrap.js'
import { PWA_BUILD_VERSION, appendBuildVersion } from '../lib/pwa-version.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..')
const serviceWorkerSource = readFileSync(join(repoRoot, 'public', 'sw.js'), 'utf8')

test('bootstrap da PWA vigia updates e recarrega apenas uma vez por build', () => {
  const bootstrapSource = bootstrapPwa.toString()

  assert.equal(getPwaReloadGuardKey('build-123'), 'bentix:pwa:reload:build-123')
  assert.match(bootstrapSource, /appendBuildVersion\(serviceWorkerPath, buildVersion\)/)
  assert.match(bootstrapSource, /navigator\.serviceWorker\.addEventListener\('controllerchange', reloadOnce\)/)
  assert.match(bootstrapSource, /navigator\.serviceWorker[\s\S]*\.register\(serviceWorkerUrl/)
  assert.match(bootstrapSource, /updatefound/)
  assert.match(bootstrapSource, /window\.location\.reload\(\)/)
  assert.match(bootstrapSource, /bootstrapState\.initialized && bootstrapState\.fingerprint === fingerprint/)
})

test('PWA fica desativada em localhost e em next dev para evitar reloads locais', () => {
  assert.equal(shouldEnablePwaBootstrap({ hostname: 'localhost', nodeEnv: 'development' }), false)
  assert.equal(shouldEnablePwaBootstrap({ hostname: '127.0.0.1', nodeEnv: 'production' }), false)
  assert.equal(shouldEnablePwaBootstrap({ hostname: 'dev.bentixapp.com', nodeEnv: 'production' }), true)
})

test('fallback local da versão PWA é estável e não muda a cada reload', () => {
  assert.equal(PWA_BUILD_VERSION, 'local-development')
  assert.equal(appendBuildVersion('/sw.js'), '/sw.js?v=local-development')
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
