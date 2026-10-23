import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getPlanningAssignmentConflicts } from '../lib/planning-conflicts.js'
import { buildPlanningConflictNotifications } from '../lib/operation-notifications.js'
import { filterPlanningClients, getPlanningDateFromSearch, groupPlanningClients } from '../app/daily-plan/planning-board-view.js'

const works = [
  { id: 1, name: 'Obra A', clientId: 10, clientName: 'Cliente A' },
  { id: 2, name: 'Obra B', clientId: 20, clientName: 'Cliente B' },
  { id: 3, name: 'Obra C', clientId: 10, clientName: 'Cliente A' },
]
const workspace = { id: 1, companyId: 1, date: '2026-10-21', state: 'draft' }
const assignment = (personId, workId, role = 'carpinteiro', extra = {}) => ({
  id: personId * 10 + workId, workspaceId: 1, personId, workId,
  person: { id: personId, name: `Pessoa ${personId}`, role }, work: works.find(work => work.id === workId),
  updatedAt: '2026-10-20T10:00:00Z', ...extra,
})

test('existing rule flags only non-chefs in distinct works, including responsible people', () => {
  const items = [assignment(1, 1), assignment(1, 1), assignment(2, 1, 'chef_primeira'), assignment(2, 2, 'chef_primeira'),
    assignment(3, 1, 'chef_segunda'), assignment(3, 2, 'chef_segunda'), assignment(4, 1, 'responsavel'), assignment(4, 2, 'responsavel'),
    assignment(5, 1), assignment(5, 2), assignment(5, 3), assignment(null, 1), assignment(null, 2)]
  const before = structuredClone(items)
  const conflicts = getPlanningAssignmentConflicts(items)
  assert.deepEqual(conflicts.map(person => person.personId), ['4', '5'])
  assert.deepEqual(conflicts[1].workIds, ['1', '2', '3'])
  assert.deepEqual(conflicts[1].workNames, ['Obra A', 'Obra B', 'Obra C'])
  assert.deepEqual(items, before)
})

test('client flags use the same conflict IDs, once per affected client, also across clients and search filters', () => {
  const items = [assignment(1, 1), assignment(1, 2), assignment(2, 1), assignment(2, 3)]
  const ids = new Set(getPlanningAssignmentConflicts(items).map(person => person.personId))
  const groups = works.map(work => ({ workId: work.id, assignments: items.filter(item => item.workId === work.id) }))
  const clients = groupPlanningClients(groups, works, [], ids)
  assert.deepEqual(clients.map(client => client.hasConflicts), [true, true])
  assert.equal(filterPlanningClients(clients, 'Obra A')[0].hasConflicts, true)
  assert.ok(groupPlanningClients(groups, works, [], new Set()).every(client => !client.hasConflicts))
})

test('one stable notification per person/day/company, preserving work names, date and current Draft state', () => {
  const items = [assignment(1, 1), assignment(1, 2), assignment(1, 3)]
  const first = buildPlanningConflictNotifications([workspace], items)
  assert.equal(first.length, 1)
  assert.deepEqual(buildPlanningConflictNotifications([workspace], items), first, 'refresh cannot duplicate or change the notice')
  assert.equal(first[0].id, 'planning-conflict-1-2026-10-21-1')
  assert.equal(first[0].deletable, false)
  assert.equal(first[0].dismissible, true)
  assert.equal(first[0].title, 'Conflito de afetação')
  assert.match(first[0].note, /Pessoa 1.*21\/10\/2026.*Obra A, Obra B, Obra C/)
  assert.equal(first[0].href, '/daily-plan?date=2026-10-21#planning-conflicts')
  assert.deepEqual(buildPlanningConflictNotifications([{ ...workspace, state: 'published' }], items), first)
})

test('resolution removes notice, recurrence restores a single updated version, without stale published conflicts', () => {
  const first = buildPlanningConflictNotifications([workspace], [assignment(1, 1), assignment(1, 2)])[0]
  assert.deepEqual(buildPlanningConflictNotifications([workspace], [assignment(1, 1)]), [])
  const returned = buildPlanningConflictNotifications([workspace], [assignment(1, 1), assignment(1, 3, 'carpinteiro', { updatedAt: '2026-10-20T12:00:00Z' })])
  assert.equal(returned.length, 1)
  assert.equal(returned[0].id, first.id)
  assert.ok(returned[0].sortTimestamp > first.sortTimestamp, 'existing bell version logic can detect the recurrence')
})

test('different days/workspaces never create a false conflict; real simultaneous conflicts stay separate', () => {
  const second = { ...workspace, id: 2, date: '2026-10-22' }
  assert.deepEqual(buildPlanningConflictNotifications([workspace, second], [assignment(1, 1), assignment(1, 2, 'carpinteiro', { workspaceId: 2 })]), [])
  const items = [assignment(1, 1), assignment(1, 2), assignment(1, 1, 'carpinteiro', { workspaceId: 2 }), assignment(1, 2, 'carpinteiro', { workspaceId: 2 })]
  assert.equal(new Set(buildPlanningConflictNotifications([workspace, second], items).map(item => item.id)).size, 2)
  assert.equal(new Set(buildPlanningConflictNotifications([workspace, { ...second, companyId: 2, date: workspace.date }], items).map(item => item.id)).size, 2)
})

test('access-only assignments and orphan assignments do not enter the notification planning view', () => {
  assert.deepEqual(buildPlanningConflictNotifications([workspace], [assignment(1, 1), assignment(1, 2, 'carpinteiro', { assignmentPurpose: 'access' })]), [])
  assert.deepEqual(buildPlanningConflictNotifications([], [assignment(1, 1), assignment(1, 2)]), [])
  assert.deepEqual(getPlanningAssignmentConflicts([]), [])
})

test('notification links accept only real date-only values and preserve the default for invalid or absent dates', () => {
  assert.equal(getPlanningDateFromSearch('?date=2026-10-21'), '2026-10-21')
  assert.equal(getPlanningDateFromSearch('?date=2028-02-29'), '2028-02-29')
  for (const search of ['', '?date=2026-02-30', '?date=2026-13-01', '?date=no', '?date=2026-10-21T12:00:00Z']) {
    assert.equal(getPlanningDateFromSearch(search), null)
  }
})
