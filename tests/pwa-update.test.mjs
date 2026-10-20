import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
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

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..')
const serviceWorkerSource = readFileSync(join(repoRoot, 'public', 'sw.js'), 'utf8')

function readPwaVersion(environment = {}) {
  // The module resolves its version at import time. Use a fresh process for each
  // environment without changing the CI environment of the rest of the suite.
  const moduleUrl = new URL('../lib/pwa-version.js', import.meta.url).href
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
    import { PWA_BUILD_VERSION, appendBuildVersion } from ${JSON.stringify(moduleUrl)}
    console.log(JSON.stringify({
      version: PWA_BUILD_VERSION,
      serviceWorkerUrl: appendBuildVersion('/sw.js'),
      urlWithQueryAndHash: appendBuildVersion('/sw.js?existing=1#section'),
    }))
  `], {
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      NEXT_PUBLIC_PWA_VERSION: '',
      GITHUB_SHA: '',
      VERCEL_GIT_COMMIT_SHA: '',
      SOURCE_VERSION: '',
      ...environment,
    },
  })
  return JSON.parse(output)
}

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
  const firstLoad = readPwaVersion()
  assert.equal(firstLoad.version, 'local-development')
  assert.equal(firstLoad.serviceWorkerUrl, '/sw.js?v=local-development')
  assert.deepEqual(readPwaVersion(), firstLoad)
})

test('PWA usa o commit do GitHub nos testes CI e no build de produção', () => {
  const commitSha = randomBytes(20).toString('hex')
  for (const nodeEnv of ['test', 'production']) {
    const result = readPwaVersion({ NODE_ENV: nodeEnv, GITHUB_SHA: commitSha })
    assert.equal(result.version, commitSha)
    assert.equal(result.serviceWorkerUrl, `/sw.js?v=${commitSha}`)
    assert.equal(result.urlWithQueryAndHash, `/sw.js?existing=1&v=${commitSha}#section`)
  }
})

test('versão PWA explícita tem prioridade sobre as versões dos fornecedores CI', () => {
  const result = readPwaVersion({
    NEXT_PUBLIC_PWA_VERSION: '  release-explicit  ',
    GITHUB_SHA: randomBytes(20).toString('hex'),
    VERCEL_GIT_COMMIT_SHA: randomBytes(20).toString('hex'),
    SOURCE_VERSION: 'source-build',
  })
  assert.equal(result.version, 'release-explicit')
  assert.equal(result.serviceWorkerUrl, '/sw.js?v=release-explicit')
})

test('PWA respeita a prioridade GitHub, Vercel e Source e ignora valores vazios', () => {
  const githubVersion = randomBytes(20).toString('hex')
  const vercelVersion = randomBytes(20).toString('hex')
  const environment = {
    NEXT_PUBLIC_PWA_VERSION: '  ',
    GITHUB_SHA: githubVersion,
    VERCEL_GIT_COMMIT_SHA: vercelVersion,
    SOURCE_VERSION: 'source-build',
  }
  assert.equal(readPwaVersion(environment).version, githubVersion)
  assert.equal(readPwaVersion({ ...environment, GITHUB_SHA: ' ' }).version, vercelVersion)
  assert.equal(readPwaVersion({
    ...environment, GITHUB_SHA: '', VERCEL_GIT_COMMIT_SHA: ' ',
  }).version, 'source-build')
})

test('PWA sem versão em produção usa o fallback unversioned', () => {
  const result = readPwaVersion({ NODE_ENV: 'production' })
  assert.equal(result.version, 'unversioned')
  assert.equal(result.serviceWorkerUrl, '/sw.js?v=unversioned')
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
