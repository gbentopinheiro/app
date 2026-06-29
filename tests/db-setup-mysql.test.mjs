import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MYSQL_SETUP_CONFIRM_ENV,
  MYSQL_SETUP_CONFIRM_FLAG,
  readMysqlSetupConfirmation,
  summarizeMysqlCounts,
} from '../scripts/mysql-setup-utils.mjs'

test('readMysqlSetupConfirmation aceita flag explicita', () => {
  const result = readMysqlSetupConfirmation([MYSQL_SETUP_CONFIRM_FLAG], {})

  assert.equal(result.confirmed, true)
  assert.equal(result.source, `flag ${MYSQL_SETUP_CONFIRM_FLAG}`)
})

test('readMysqlSetupConfirmation aceita variavel de ambiente truthy', () => {
  const result = readMysqlSetupConfirmation([], {
    [MYSQL_SETUP_CONFIRM_ENV]: 'true',
  })

  assert.equal(result.confirmed, true)
  assert.equal(result.source, `env ${MYSQL_SETUP_CONFIRM_ENV}`)
})

test('readMysqlSetupConfirmation recusa por defeito', () => {
  const result = readMysqlSetupConfirmation([], {})

  assert.equal(result.confirmed, false)
  assert.equal(result.source, null)
})

test('summarizeMysqlCounts devolve apenas entradas com dados', () => {
  const result = summarizeMysqlCounts({
    companies: 0,
    people: 7,
    users: 2,
  })

  assert.equal(result.hasExistingData, true)
  assert.equal(result.totalRows, 9)
  assert.deepEqual(result.nonEmptyEntries, [
    ['people', 7],
    ['users', 2],
  ])
})
