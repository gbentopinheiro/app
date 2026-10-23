import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  DailyHoursValidationError,
  DAILY_HOURS_INPUT_PROPS,
  isValidDailyHours,
  normalizeDailyHoursValue,
  validateDailyHoursFields,
} from '../lib/daily-hours-validation.js'
import { validateChefEntryHours } from '../lib/chef-daily-hours-shared.js'
import { submitChefEntries } from '../frontend/controllers/chef-daily-hours-controller.js'

for (const hours of [0, 0.5, 1, 1.5, 7.5, 8, 23.5, 24]) {
  test(`aceita ${hours} h sem alterar o valor`, () => {
    assert.equal(isValidDailyHours(hours), true)
    assert.equal(normalizeDailyHoursValue(hours), hours)
    assert.equal(normalizeDailyHoursValue(String(hours)), hours)
    assert.equal(validateChefEntryHours([{ id: 1 }], { 1: String(hours) }).hasErrors, false)
  })
}

for (const hours of [-1, 0.1, 0.91, 0.92, 1.25, 7.2, 7.75, 23.9, 24.5]) {
  test(`rejeita ${hours} h sem arredondar`, () => {
    assert.equal(isValidDailyHours(hours), false)
    assert.throws(() => normalizeDailyHoursValue(hours), DailyHoursValidationError)
    const validation = validateChefEntryHours([{ id: 1 }], { 1: String(hours) })
    assert.equal(validation.hasErrors, true)
    assert.match(validation.rowErrors['1'], /incrementos de 0,5/)
  })
}

test('não converte campos vazios, tipos inválidos ou valores não finitos em zero', () => {
  for (const value of ['', ' ', undefined, null, true, false, [], {}, NaN, Infinity, '7.5-inválido']) {
    assert.equal(isValidDailyHours(value), false)
    assert.throws(() => normalizeDailyHoursValue(value), DailyHoursValidationError)
  }
})

test('aceita os 49 incrementos e rejeita decimais intermédios sem tolerância ou arredondamento', () => {
  assert.deepEqual(DAILY_HOURS_INPUT_PROPS, { min: 0, max: 24, step: 0.5 })
  for (let index = 0; index <= 48; index += 1) {
    const hours = index / 2
    assert.equal(normalizeDailyHoursValue(hours), hours)
    if (index < 48) assert.throws(() => normalizeDailyHoursValue(hours + 0.01), DailyHoursValidationError)
  }
  for (const hours of [-Number.EPSILON, Number.MIN_VALUE, 0.5 - Number.EPSILON,
    0.5 + Number.EPSILON, 24 - Number.EPSILON * 16, 24 + Number.EPSILON * 16]) {
    assert.throws(() => normalizeDailyHoursValue(hours), DailyHoursValidationError)
  }
})

test('a regra central protege os três campos de horas sem modificar o payload', () => {
  for (const field of ['hours', 'dailyHours', 'approvedHours']) {
    for (const value of [0.1, 0.91, 0.92, 1.25, 7.2, 7.75, 23.9, 24.5, '0.91', '7.2']) {
      const payload = { [field]: value }
      assert.throws(() => validateDailyHoursFields(payload), DailyHoursValidationError)
      assert.deepEqual(payload, { [field]: value })
    }
  }
})

test('submissão valida separadamente horas e proposta, incluindo valores herdados', () => {
  assert.throws(() => validateDailyHoursFields({ submitted: true }, { hours: 0.91, dailyHours: 8 }), DailyHoursValidationError)
  assert.throws(() => validateDailyHoursFields({ submitted: true }, { hours: 8, dailyHours: 0.92 }), DailyHoursValidationError)
  assert.doesNotThrow(() => validateDailyHoursFields({ hours: 7.5, submitted: true }, { hours: 0.91, dailyHours: 0.92 }))
  assert.throws(() => validateDailyHoursFields({ hours: 7.5, dailyHours: 7.2, submitted: true }), DailyHoursValidationError)
})

test('valida apenas campos escritos e permite limpar a aprovação sem corrigir o histórico', () => {
  const historical = { hours: 7.75, dailyHours: 7.2, approvedHours: 1.25 }
  const before = { ...historical }
  assert.doesNotThrow(() => validateDailyHoursFields({ notes: 'Nota' }, historical))
  assert.doesNotThrow(() => validateDailyHoursFields({ approvedHours: null }, historical))
  assert.throws(() => validateDailyHoursFields({ submitted: true }, historical), /incrementos de 0,5/)
  assert.doesNotThrow(() => validateDailyHoursFields({ hours: 7.5, submitted: true }, historical))
  assert.deepEqual(historical, before)
})

test('submissão partilhada valida todas as linhas antes de enviar qualquer pedido', async () => {
  const originalFetch = globalThis.fetch
  let requests = 0
  globalThis.fetch = async () => { requests += 1; throw new Error('Não devia enviar pedidos') }
  try {
    await assert.rejects(() => submitChefEntries({ entries: [{ id: 1 }, { id: 2 }], entryHours: { 1: '8', 2: '7.75' } }), /incrementos de 0,5/)
    assert.equal(requests, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('validação do chefe ignora linhas já submetidas sem validar de novo o seu histórico', () => {
  const result = validateChefEntryHours([{ id: 1, submitted: true }, { id: 2, submitted: false }], { 1: '0.91', 2: '7.5' })
  assert.equal(result.hasErrors, false)
  assert.deepEqual(result.rowErrors, {})
})

test('submissão de uma obra envia apenas linhas pendentes, preservando as já submetidas', async () => {
  const originalFetch = globalThis.fetch
  const requests = []
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), method: options.method, body: options.body })
    return new Response(JSON.stringify({ id: 1 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  try {
    await submitChefEntries({ entries: [{ id: 1, submitted: false }, { id: 2, submitted: true }], entryHours: { 1: '7.5', 2: '0.91' } })
    assert.equal(requests.length, 2)
    assert.match(requests[0].url, /\/work-assignments\/1$/)
    assert.deepEqual(JSON.parse(requests[0].body), { hours: 7.5 })
    assert.match(requests[1].url, /\/work-assignments\/1\/submit$/)
  } finally {
    globalThis.fetch = originalFetch
  }
})
