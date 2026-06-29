import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveApiUrl } from '../frontend/api/api-client.js'
import { getSupportedPublicAppEnvs, resolvePublicAppConfig, resolvePublicAppEnv } from '../config/app.public.js'

function withEnv(patch, callback) {
  const originalValues = new Map()

  Object.keys(patch).forEach(key => {
    originalValues.set(key, process.env[key])

    if (patch[key] === undefined) {
      delete process.env[key]
      return
    }

    process.env[key] = patch[key]
  })

  try {
    return callback()
  } finally {
    originalValues.forEach((value, key) => {
      if (value === undefined) {
        delete process.env[key]
        return
      }

      process.env[key] = value
    })
  }
}

test('suporta perfis publicos esperados para a app', () => {
  assert.deepEqual(getSupportedPublicAppEnvs(), ['local', 'dev', 'prod'])
})

test('usa perfil local por defeito e mantem urls relativas sem override', () => {
  withEnv(
    {
      NEXT_PUBLIC_APP_ENV: undefined,
      NEXT_PUBLIC_API_BASE_URL: undefined,
    },
    () => {
      assert.equal(resolvePublicAppEnv(), 'local')
      assert.deepEqual(resolvePublicAppConfig(), {
        appEnv: 'local',
        apiBaseUrl: '',
        apiBaseUrlSource: 'config/app.local.js',
      })
      assert.equal(resolveApiUrl('/api/auth/session'), '/api/auth/session')
    },
  )
})

test('usa o perfil dev para apontar o frontend para a API de DEV', () => {
  withEnv(
    {
      NEXT_PUBLIC_APP_ENV: 'dev',
      NEXT_PUBLIC_API_BASE_URL: undefined,
    },
    () => {
      assert.deepEqual(resolvePublicAppConfig(), {
        appEnv: 'dev',
        apiBaseUrl: 'https://api-dev.bentixapp.com',
        apiBaseUrlSource: 'config/app.dev.js',
      })
      assert.equal(resolveApiUrl('/api/auth/login'), 'https://api-dev.bentixapp.com/api/auth/login')
    },
  )
})

test('usa o perfil prod para apontar o frontend para a API de PROD', () => {
  withEnv(
    {
      NEXT_PUBLIC_APP_ENV: 'prod',
      NEXT_PUBLIC_API_BASE_URL: undefined,
    },
    () => {
      assert.equal(resolvePublicAppEnv(), 'prod')
      assert.deepEqual(resolvePublicAppConfig(), {
        appEnv: 'prod',
        apiBaseUrl: 'https://api.bentixapp.com',
        apiBaseUrlSource: 'config/app.prod.js',
      })
    },
  )
})

test('rejeita perfis publicos antigos ou nao suportados', () => {
  withEnv(
    {
      NEXT_PUBLIC_APP_ENV: 'staging',
      NEXT_PUBLIC_API_BASE_URL: undefined,
    },
    () => {
      assert.throws(
        () => resolvePublicAppEnv(),
        /Unsupported NEXT_PUBLIC_APP_ENV "staging"/,
      )
    },
  )
})

test('mantem compatibilidade com NEXT_PUBLIC_API_BASE_URL quando definido', () => {
  withEnv(
    {
      NEXT_PUBLIC_APP_ENV: 'dev',
      NEXT_PUBLIC_API_BASE_URL: 'https://custom-api.bentixapp.com/',
    },
    () => {
      assert.deepEqual(resolvePublicAppConfig(), {
        appEnv: 'dev',
        apiBaseUrl: 'https://custom-api.bentixapp.com',
        apiBaseUrlSource: 'NEXT_PUBLIC_API_BASE_URL',
      })
      assert.equal(resolveApiUrl('/api/people'), 'https://custom-api.bentixapp.com/api/people')
    },
  )
})

test('nao altera urls absolutas passadas diretamente ao api client', () => {
  withEnv(
    {
      NEXT_PUBLIC_APP_ENV: 'dev',
      NEXT_PUBLIC_API_BASE_URL: undefined,
    },
    () => {
      assert.equal(resolveApiUrl('https://files.bentixapp.com/export.xlsx'), 'https://files.bentixapp.com/export.xlsx')
    },
  )
})
