import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  getExpiredSessionCookieOptions,
  getSessionCookieBaseOptions,
  getSessionCookieOptions,
  SESSION_MAX_AGE_SECONDS,
} from '../lib/auth.js'

test('mantem cookie host-only e SameSite=Lax em desenvolvimento local', () => {
  assert.deepEqual(getSessionCookieBaseOptions({ nodeEnv: 'development', rawDomain: '' }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
  })
})

test('mantem cookie seguro em producao mesmo sem domain partilhado', () => {
  assert.deepEqual(getSessionCookieOptions({ nodeEnv: 'production', rawDomain: '' }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
})

test('usa domain partilhado e SameSite=None quando SESSION_COOKIE_DOMAIN esta definido', () => {
  assert.deepEqual(
    getSessionCookieOptions({
      nodeEnv: 'development',
      rawDomain: '.bentixapp.com',
    }),
    {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      domain: '.bentixapp.com',
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  )
})

test('expira o cookie reutilizando o mesmo conjunto base de opcoes', () => {
  const expiredOptions = getExpiredSessionCookieOptions({
    nodeEnv: 'development',
    rawDomain: '.bentixapp.com',
  })

  assert.equal(expiredOptions.httpOnly, true)
  assert.equal(expiredOptions.sameSite, 'none')
  assert.equal(expiredOptions.secure, true)
  assert.equal(expiredOptions.path, '/')
  assert.equal(expiredOptions.domain, '.bentixapp.com')
  assert.ok(expiredOptions.expires instanceof Date)
  assert.equal(expiredOptions.expires.getTime(), 0)
})
