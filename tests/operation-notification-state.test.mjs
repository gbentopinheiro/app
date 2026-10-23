import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildPlanningConflictNotifications } from '../lib/operation-notifications.js'
import { deleteNotifications } from '../frontend/controllers/notifications-controller.js'
import {
  addNotificationDismissals, canRemoveNotification, filterDismissedNotifications,
  getNotificationDeleteSourceIds, getNotificationDismissalStorageKey,
  getNotificationVersion, readNotificationDismissals,
} from '../lib/operation-notification-state.js'

const workspace = { id: 1, companyId: 1, date: '2026-10-21' }
const assignments = [1, 2].map(workId => ({
  id: workId, workspaceId: 1, workId, personId: 3,
  person: { name: 'João', role: 'carpinteiro' },
  work: { name: `Obra ${workId}` }, updatedAt: '2026-10-21T09:00:00Z',
}))
const conflict = () => buildPlanningConflictNotifications([workspace], assignments)[0]
const note = { id: 'daily-note-42', sourceType: 'daily-note', sourceId: 42, deletable: true, sortTimestamp: 123 }
const document = { id: 'document-reminder-1', sourceType: 'document-reminder', deletable: false, sortTimestamp: 123 }

test('dismissing one notification updates the shared visible list/count without removing others or mutating planning', () => {
  const before = structuredClone(assignments)
  const notices = [conflict(), note, document]
  const dismissed = addNotificationDismissals({}, [notices[0]])
  assert.deepEqual(filterDismissedNotifications(notices, dismissed), [note, document])
  assert.equal(filterDismissedNotifications(notices, dismissed).length, 2)
  assert.deepEqual(assignments, before)
  assert.equal(buildPlanningConflictNotifications([workspace], assignments).length, 1, 'planning conflict stays active')
  assert.equal(canRemoveNotification(notices[0]), true)
  assert.equal(canRemoveNotification(document), false)
  assert.deepEqual(addNotificationDismissals({}, [document]), {})
})

test('dismissal survives storage roundtrip and identical refresh, including reordered assignments', () => {
  const key = getNotificationDismissalStorageKey('admin')
  const saved = JSON.stringify(addNotificationDismissals({}, [conflict()]))
  const storage = { getItem: name => name === key ? saved : null }
  const dismissed = readNotificationDismissals(storage, key)
  const refreshed = buildPlanningConflictNotifications([workspace], [...assignments].reverse())
  assert.equal(getNotificationVersion(refreshed[0]), getNotificationVersion(conflict()))
  assert.equal(filterDismissedNotifications(refreshed, dismissed).length, 0)
  assert.equal(filterDismissedNotifications([note], dismissed).length, 1)
})

test('new conflict membership or recurrence is visible again while resolved conflicts remain absent', () => {
  const dismissed = addNotificationDismissals({}, [conflict()])
  const changed = buildPlanningConflictNotifications([workspace], [assignments[0], { ...assignments[1], workId: 4 }])
  assert.equal(filterDismissedNotifications(changed, dismissed).length, 1, 'membership change works even at the same timestamp')
  assert.deepEqual(filterDismissedNotifications(buildPlanningConflictNotifications([workspace], [assignments[0]]), dismissed), [])
  const returned = buildPlanningConflictNotifications([workspace], [assignments[0], { ...assignments[1], id: 9, updatedAt: '2026-10-21T10:00:00Z' }])
  assert.equal(returned[0].id, conflict().id)
  assert.equal(filterDismissedNotifications(returned, dismissed).length, 1)
})

test('daily-note tombstones suppress stale props only; an updated note is visible and counts correctly', () => {
  const dismissed = addNotificationDismissals({}, [note])
  assert.deepEqual(filterDismissedNotifications([note, conflict()], dismissed), [conflict()])
  assert.equal(filterDismissedNotifications([{ ...note, sortTimestamp: 124 }, conflict()], dismissed).length, 2)
})

test('dismissal persistence is scoped to the user and malformed or unavailable storage is safe', () => {
  assert.equal(getNotificationDismissalStorageKey(' Admin '), getNotificationDismissalStorageKey('admin'))
  assert.notEqual(getNotificationDismissalStorageKey('admin'), getNotificationDismissalStorageKey('other'))
  for (const saved of ['bad', 'null', '[]', '1']) {
    assert.deepEqual(readNotificationDismissals({ getItem: () => saved }, 'key'), {})
  }
  assert.deepEqual(readNotificationDismissals({ getItem: () => { throw Error('blocked') } }, 'key'), {})
  assert.deepEqual(readNotificationDismissals({ getItem: () => '{"a":"123","b":1}' }, 'key'), { a: '123' })
})

test('only validated numeric daily-note source IDs reach the existing deletion endpoint', () => {
  assert.deepEqual(getNotificationDeleteSourceIds([conflict(), note, { ...note, sourceId: '42' }, document]), [42])
  assert.deepEqual(getNotificationDeleteSourceIds([conflict()]), [])
  for (const sourceId of ['daily-note-42', '', null, 0, -1, 1.5, 'NaN']) {
    assert.throws(() => getNotificationDeleteSourceIds([{ ...note, sourceId }]), /inválido/)
  }
})

test('mixed bulk dismissal removes only its targets and preserves other notices across reloads', () => {
  const otherNote = { ...note, id: 'daily-note-43', sourceId: 43 }
  const otherConflict = { ...conflict(), id: 'planning-conflict-1-2026-10-21-4' }
  const notices = [note, otherNote, conflict(), otherConflict, document]
  const targets = [note, conflict()]
  const dismissed = addNotificationDismissals({}, targets)
  assert.deepEqual(getNotificationDeleteSourceIds(targets), [42])
  const reloaded = readNotificationDismissals({ getItem: () => JSON.stringify(dismissed) }, 'key')
  const remaining = filterDismissedNotifications(notices, reloaded)
  assert.deepEqual(remaining, [otherNote, otherConflict, document])
  assert.equal(remaining.length, 3)
  assert.deepEqual(notices, [note, otherNote, conflict(), otherConflict, document])
})

test('sequential dismissals retain earlier dismissals and remove the unread bell indicator', () => {
  const notices = [conflict(), note]
  const seen = { [note.id]: getNotificationVersion(note) }
  const first = addNotificationDismissals({}, [notices[0]])
  const remaining = filterDismissedNotifications(notices, first)
  assert.equal(remaining.length, 1)
  assert.equal(remaining.some(item => seen[item.id] !== getNotificationVersion(item)), false)
  const second = addNotificationDismissals(readNotificationDismissals({ getItem: () => JSON.stringify(first) }, 'key'), [note])
  assert.deepEqual(filterDismissedNotifications(notices, second), [])
  assert.deepEqual(addNotificationDismissals(second, [note, notices[0]]), second, 'repeated dismissal must not add duplicate notices')
})

test('notification deletion calls the existing endpoint with numeric source IDs, never conflict IDs', async () => {
  const originalFetch = globalThis.fetch
  const requests = []
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), method: options.method, body: JSON.parse(options.body) })
    return new Response(JSON.stringify({ removedCount: 1 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  try {
    assert.deepEqual(await deleteNotifications(getNotificationDeleteSourceIds([conflict(), note, note])), { removedCount: 1 })
    assert.equal(requests.length, 1)
    assert.ok(requests[0].url.endsWith('/api/daily-work-notes'))
    assert.equal(requests[0].method, 'DELETE')
    assert.deepEqual(requests[0].body, { ids: [42] })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('failed deletion propagates the API error without changing notification or dismissal data', async () => {
  const originalFetch = globalThis.fetch
  const notices = [note, conflict()]
  const dismissed = {}
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Sem permissão para remover notas.' }), {
    status: 403, headers: { 'Content-Type': 'application/json' },
  })
  try {
    await assert.rejects(() => deleteNotifications(getNotificationDeleteSourceIds([note])), /Sem permissão/)
    assert.deepEqual(dismissed, {})
    assert.deepEqual(filterDismissedNotifications(notices, dismissed), notices)
  } finally {
    globalThis.fetch = originalFetch
  }
})
