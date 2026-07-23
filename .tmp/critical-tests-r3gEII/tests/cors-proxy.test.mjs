import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  API_CORS_ALLOWED_METHODS,
  applyApiCorsHeaders,
  resolveAllowedApiCorsOrigins,
  resolveApiCorsAllowedHeaders,
  resolveApiCorsOrigin,
} from '../lib/api-cors.js'

test('usa origins por defeito para o frontend separado em DEV e localhost', () => {
  assert.deepEqual(resolveAllowedApiCorsOrigins(''), [
    'https://dev.bentixapp.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ])
})

test('aceita lista configurada de origins CORS e remove espacos e duplicados', () => {
  assert.deepEqual(
    resolveAllowedApiCorsOrigins(' https://dev.bentixapp.com, https://dev.bentixapp.com , https://foo.example '),
    ['https://dev.bentixapp.com', 'https://foo.example'],
  )
})

test('resolve apenas o origin exato permitido', () => {
  const allowedOrigins = 'https://dev.bentixapp.com,https://foo.example'

  assert.equal(
    resolveApiCorsOrigin('https://dev.bentixapp.com/', allowedOrigins),
    'https://dev.bentixapp.com',
  )
  assert.equal(resolveApiCorsOrigin('https://bar.example', allowedOrigins), null)
})

test('ecoa headers pedidos no preflight e cai para defaults quando necessario', () => {
  assert.equal(
    resolveApiCorsAllowedHeaders('content-type, x-trace-id, content-type'),
    'content-type, x-trace-id',
  )
  assert.equal(resolveApiCorsAllowedHeaders(''), 'Accept, Authorization, Content-Type')
})

test('aplica headers CORS completos quando o origin e permitido', () => {
  const response = new Response(null, { status: 204 })
  const applied = applyApiCorsHeaders(response, {
    origin: 'https://dev.bentixapp.com',
    requestHeaders: 'content-type',
  })

  assert.equal(applied, true)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://dev.bentixapp.com')
  assert.equal(response.headers.get('Access-Control-Allow-Credentials'), 'true')
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), API_CORS_ALLOWED_METHODS)
  assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'content-type')
  assert.equal(response.headers.get('Access-Control-Max-Age'), '86400')
  assert.match(
    response.headers.get('Vary'),
    /Origin, Access-Control-Request-Method, Access-Control-Request-Headers/,
  )
})

test('nao aplica headers CORS quando o origin nao e permitido', () => {
  const response = new Response(null, { status: 204 })
  const applied = applyApiCorsHeaders(response, {
    origin: 'https://bar.example',
    requestHeaders: 'content-type',
    rawAllowedOrigins: 'https://dev.bentixapp.com',
  })

  assert.equal(applied, false)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null)
})
