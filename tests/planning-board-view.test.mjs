import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterPlanningClients,
  filterUnassignedPeople,
  getAdjacentPlanningDate,
  groupPlanningClients,
} from '../app/daily-plan/planning-board-view.js'

const works = [
  { id: 1, name: 'Edifício Norte', number: 10, clientId: 1, clientName: 'Cliente Árvore' },
  { id: 2, name: 'Edifício Sul', number: 20, clientId: 1, clientName: 'Cliente Árvore' },
  { id: 3, name: 'Pavilhão', number: 30, clientId: 2, clientName: 'Cliente Árvore' },
]
const assignment = (id, personId, role, name) => ({ id, personId, person: { id: personId, role, name } })
const groupedAssignments = [
  {
    workId: 1, workName: works[0].name,
    assignments: [assignment(1, 1, 'chef_primeira', 'Chefe Teste'), assignment(2, 2, 'carpinteiro', 'João Teste')],
  },
  { workId: 2, workName: works[1].name, assignments: [assignment(3, 2, 'carpinteiro', 'João Teste')] },
]

test('client groups preserve works and every assignment, counting each worker once per client', () => {
  const before = structuredClone({ works, groupedAssignments })
  const clients = groupPlanningClients(groupedAssignments, works, [works[2]])
  assert.equal(clients.length, 2, 'different client IDs must remain separate even with equal names')
  const client = clients.find(item => item.key === '1')
  assert.equal(client.workCount, 2)
  assert.equal(client.workerCount, 1, 'the chef is preserved but does not become an extra worker')
  assert.deepEqual(client.works.flatMap(work => work.assignments), groupedAssignments.flatMap(group => group.assignments))
  assert.equal(clients.find(item => item.key === '2').works[0].unplanned, true)
  assert.deepEqual({ works, groupedAssignments }, before, 'grouping must not mutate source data')
})

test('search handles accents, work numbers and names, retaining the entire matching work and real totals', () => {
  const clients = groupPlanningClients(groupedAssignments, works, [works[2]])
  assert.equal(filterPlanningClients(clients, 'arvore')[0].works.length, 2)
  const result = filterPlanningClients(clients, 'joao norte')
  assert.equal(result.length, 1)
  assert.equal(result[0].works.length, 1)
  assert.equal(result[0].works[0].assignments.length, 2, 'search must preserve coworkers and the chef')
  assert.equal(result[0].workCount, 2, 'client totals must not change with a presentation filter')
  assert.equal(filterPlanningClients(clients, '30')[0].key, '2')
  assert.deepEqual(filterPlanningClients(clients, 'no match'), [])
  assert.equal(filterPlanningClients(clients, '  '), clients)
  assert.equal(clients[0].works.length, 2)
})

test('missing metadata keeps the work visible without inventing a client or a worker role', () => {
  const clients = groupPlanningClients([
    { workId: 9, assignments: [{ id: 9, personId: 9, person: null, work: { id: 9, name: 'Obra sem cliente' } }] },
  ], [])
  assert.equal(clients.length, 1)
  assert.equal(clients[0].name, 'Cliente não identificado')
  assert.equal(clients[0].works[0].workId, 9)
  assert.equal(clients[0].workerCount, 0)
  assert.deepEqual(groupPlanningClients([], [], []), [])
})

test('day navigation crosses months, leap years and daylight-saving dates without shifting the selected day', () => {
  for (const [date, offset, expected] of [
    ['2026-01-01', -1, '2025-12-31'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2028-02-29', 1, '2028-03-01'],
    ['2026-03-29', -1, '2026-03-28'],
    ['2026-10-25', 1, '2026-10-26'],
  ]) assert.equal(getAdjacentPlanningDate(date, offset), expected)
  assert.equal(getAdjacentPlanningDate('', 1), '')
})


test('unassigned search combines real names and role labels without accents, while preserving people and order', () => {
  const people = [
    { id: 1, name: 'João Silva', role: 'carpinteiro' },
    { id: 2, name: 'José Silva', role: 'ferrajeiro' },
    { id: 3, name: 'Ana Costa', role: 'carpinteiro' },
    { id: 4, name: 'Pessoa sem função' },
  ]
  const before = structuredClone(people)
  assert.equal(filterUnassignedPeople(people), people)
  assert.deepEqual(filterUnassignedPeople(people, { query: '  joAO  ' }).map(p => p.id), [1])
  assert.deepEqual(filterUnassignedPeople(people, { role: 'carpinteiro' }).map(p => p.id), [1, 3])
  assert.deepEqual(filterUnassignedPeople(people, { query: 'silva carpinteiro', role: 'carpinteiro' }).map(p => p.id), [1])
  assert.deepEqual(filterUnassignedPeople(people, { query: 'silva', role: 'ferrajeiro' }).map(p => p.id), [2])
  assert.deepEqual(filterUnassignedPeople(people, { query: 'joao', role: 'ferrajeiro' }), [])
  assert.deepEqual(filterUnassignedPeople(people, { query: 'pessoa sem funcao' }).map(p => p.id), [4])
  assert.deepEqual(filterUnassignedPeople([], { query: 'joao' }), [])
  assert.deepEqual(people, before)
})

test('unassigned filters retain every match for the full list, independent of the compact preview limit', () => {
  const people = Array.from({ length: 67 }, (_, id) => ({ id: id + 1, name: 'Trabalhador ' + (id + 1), role: id % 2 ? 'ferrajeiro' : 'carpinteiro' }))
  assert.equal(filterUnassignedPeople(people).length, 67)
  assert.equal(filterUnassignedPeople(people, { role: 'carpinteiro' }).length, 34)
  assert.equal(filterUnassignedPeople(people, { query: 'trabalhador' }).length, 67)
  assert.equal(filterUnassignedPeople(people, { query: 'trabalhador' }).slice(0, 8).length, 8)
  assert.deepEqual(filterUnassignedPeople(people, { query: 'trabalhador 67' }).map(p => p.id), [67])
})
