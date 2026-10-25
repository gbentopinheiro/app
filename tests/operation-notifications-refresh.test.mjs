import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { subscribeOperationNotificationsRefresh } from '../frontend/hooks/use-operation-notifications-refresh.js'
import { createNotificationsRefresh, listNotifications } from '../frontend/controllers/notifications-controller.js'
import { getNotificationsService } from '../server/services/notifications-service.js'
import { canAccessPath, canAccessPathByPermission } from '../lib/auth.js'
import { buildPlanningConflictNotifications } from '../lib/operation-notifications.js'
import { toCompactOperationNotifications, filterDismissedNotifications, addNotificationDismissals } from '../lib/operation-notification-state.js'

function environment() {
  const targetWindow = new EventTarget()
  const targetDocument = new EventTarget()
  targetDocument.visibilityState = 'visible'
  const timers = new Map()
  let nextId = 0
  targetWindow.setInterval = (fn, delay) => { const id = ++nextId; timers.set(id, { fn, delay }); return id }
  targetWindow.clearInterval = id => timers.delete(id)
  const channels = []
  class Channel {
    constructor(name) { this.name = name; this.closed = false; channels.push(this) }
    close() { this.closed = true }
  }
  return { targetWindow, targetDocument, Channel, timers, channels }
}

test('one shared subscription polls once every 30 seconds, never refreshes RSC, and cleans up', () => {
  const env = environment()
  let calls = 0
  const stop = subscribeOperationNotificationsRefresh({ ...env, onChange: () => calls++ })
  assert.equal(env.timers.size, 1)
  const timer = [...env.timers.values()][0]
  assert.equal(timer.delay, 30000)
  timer.fn(); timer.fn()
  assert.equal(calls, 2, '65 idle seconds require only two periodic refreshes')
  stop()
  assert.equal(env.timers.size, 0)
  assert.ok(env.channels.every(channel => channel.closed))
  env.targetWindow.dispatchEvent(new Event('focus'))
  env.targetDocument.dispatchEvent(new Event('visibilitychange'))
  assert.equal(calls, 2)
})

test('hidden tabs suspend reads; focus, visibility and cross-tab planning changes resume them', () => {
  const env = environment()
  let reads = 0
  const stop = subscribeOperationNotificationsRefresh({ ...env, onChange: () => reads++ })
  env.targetDocument.visibilityState = 'hidden'
  ;[...env.timers.values()][0].fn()
  env.channels[0].onmessage({ data: 'refresh' })
  assert.equal(reads, 0)
  env.targetDocument.visibilityState = 'visible'
  env.targetDocument.dispatchEvent(new Event('visibilitychange'))
  env.targetWindow.dispatchEvent(new Event('focus'))
  env.targetWindow.dispatchEvent(new Event('bentix:planning-updated'))
  env.channels[0].onmessage({ data: 'refresh' })
  assert.equal(reads, 4)
  stop()
})

test('dismissal events update local state and counters across tabs without another server read', () => {
  const env = environment()
  const conflict = { id: 'conflict-1', version: '1', dismissible: true }
  const note = { id: 'note-2', sortTimestamp: 1 }
  let storage = {}, visible = [conflict, note], reads = 0
  const stop = subscribeOperationNotificationsRefresh({ ...env,
    onChange: () => reads++, onDismiss: () => { visible = filterDismissedNotifications([conflict, note], storage) },
  })
  storage = addNotificationDismissals(storage, [conflict])
  env.targetWindow.dispatchEvent(new CustomEvent('bentix:planning-updated', { detail: 'dismiss' }))
  assert.deepEqual(visible, [note])
  assert.equal(visible.length, 1)
  env.channels[0].onmessage({ data: 'dismiss' })
  assert.deepEqual(visible, [note])
  assert.equal(reads, 0)
  assert.equal(filterDismissedNotifications([{ ...conflict, version: '2' }, note], storage).length, 2)
  stop()
})

test('focus, visibility and timer overlap share one in-flight request and publish one result', async () => {
  let resolve, loads = 0
  const values = [], errors = []
  const loader = createNotificationsRefresh(() => { loads++; return new Promise(done => { resolve = done }) }, data => values.push(data), error => errors.push(error))
  const first = loader.refresh(), second = loader.refresh(), third = loader.refresh()
  assert.equal(first, second)
  assert.equal(second, third)
  await Promise.resolve()
  assert.equal(loads, 1)
  resolve([{ id: 'one' }]); await first
  assert.deepEqual(values, [[{ id: 'one' }]])
  assert.deepEqual(errors, [])
  const next = loader.refresh(); await Promise.resolve(); resolve([]); await next
  assert.equal(loads, 2)
})

test('cancelled responses cannot replace another user or newer SSR data; failures retain the last snapshot', async () => {
  let resolve, signal
  const values = [], errors = []
  const loader = createNotificationsRefresh(options => { signal = options.signal; return new Promise(done => { resolve = done }) }, data => values.push(data), error => errors.push(error.message))
  const pending = loader.refresh(); await Promise.resolve(); loader.cancel()
  assert.equal(signal.aborted, true)
  resolve([{ id: 'stale' }]); await pending
  assert.deepEqual(values, [])
  assert.deepEqual(errors, [])
  const failing = createNotificationsRefresh(() => { throw Error('offline') }, data => values.push(data), error => errors.push(error.message))
  await failing.refresh()
  assert.deepEqual(values, [])
  assert.deepEqual(errors, ['offline'])
})

test('compact and full views preserve date, truncation and conflict versions from the same snapshot', () => {
  const full = { id: 'note', sourceType: 'daily-note', note: 'x'.repeat(100), date: '21 de outubro de 2026', shortDate: '21/10' }
  assert.deepEqual(toCompactOperationNotifications([full])[0], { ...full, date: '21/10', note: 'x'.repeat(92) + '...' })
  assert.equal(full.note.length, 100)
  const workspace = { id: 1, companyId: 1, date: '2026-10-21' }
  const assignments = [1, 2].map(workId => ({ id: workId, workspaceId: 1, personId: 1, workId, person: { name: 'Pessoa', role: 'carpinteiro' }, work: { name: `Obra ${workId}` } }))
  const old = buildPlanningConflictNotifications([workspace], assignments)
  const snapshot = buildPlanningConflictNotifications([workspace], assignments, { withYear: true, includeShortDate: true })
  assert.deepEqual(toCompactOperationNotifications(snapshot).map(({ shortDate, ...item }) => item), old)
  assert.deepEqual(filterDismissedNotifications(snapshot, addNotificationDismissals({}, old)), [])
})

test('notification API authenticates, checks the existing permission/flag and derives audience from the session', async () => {
  const reads = []
  const deps = { featureEnabled: async () => true, getNotifications: async options => { reads.push(options); return [] } }
  const admin = { role: 'admin', permissionKeys: ['notifications.read'] }
  const responsible = { role: 'responsavel', permissionKeys: ['notifications.read'] }
  await assert.rejects(getNotificationsService(null, deps), { status: 401 })
  await assert.rejects(getNotificationsService({ role: 'chef_primeira', permissionKeys: [] }, deps), { status: 403 })
  await assert.rejects(getNotificationsService(admin, { ...deps, featureEnabled: async () => false }), { status: 503 })
  assert.equal(reads.length, 0)
  assert.deepEqual(await getNotificationsService(admin, deps), [])
  assert.deepEqual(await getNotificationsService(responsible, deps), [])
  assert.deepEqual(reads.map(item => item.audience), ['admin', 'responsavel'])
  assert.ok(reads.every(item => item.withYear && item.includeShortDate))
  assert.equal(canAccessPath(responsible, '/api/notifications'), canAccessPath(responsible, '/notifications'))
  assert.equal(canAccessPathByPermission(admin, '/api/notifications'), canAccessPathByPermission(admin, '/notifications'))
})

test('the directed fetch propagates HTTP errors and explicitly avoids caching', async () => {
  const previousFetch = globalThis.fetch
  try {
    globalThis.fetch = async (url, options) => {
      assert.ok(String(url).endsWith('/api/notifications'))
      assert.equal(options.cache, 'no-store')
      return new Response(JSON.stringify({ error: 'Sem permissao' }), { status: 403 })
    }
    await assert.rejects(listNotifications(), { message: 'Sem permissao', status: 403 })
  } finally { globalThis.fetch = previousFetch }
})

test('Home and summary contain no timestamp invalidation; consumers share the sole refresh provider', () => {
  const source = path => readFileSync(new URL(path, import.meta.url), 'utf8')
  assert.doesNotMatch(source('../app/page.js'), /refreshVersion|Date\.now\(/)
  assert.doesNotMatch(source('../app/components/DashboardSummaryCards.js'), /refreshVersion|Date\.now\(|setInterval/)
  assert.doesNotMatch(source('../frontend/hooks/use-operation-notifications-refresh.js'), /router\.refresh|useRouter/)
  const provider = source('../frontend/hooks/use-operation-notification-state.js')
  assert.equal((provider.match(/useOperationNotificationsRefresh\(enabled/g) || []).length, 1)
  for (const path of ['../app/components/NotificationBell.js', '../app/components/DashboardNotifications.js', '../app/notifications/NotificationsClient.js']) {
    assert.doesNotMatch(source(path), /setInterval|useOperationNotificationsRefresh|router\.refresh/)
  }
  assert.doesNotMatch(source('../app/components/DashboardHero.js'), /getOperationNotifications/)
})
