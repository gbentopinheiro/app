import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { Prisma } from '@prisma/client'
import { getAccessIdentityWorkRelationsDb } from '../lib/db/access-identities-db.js'

const previous = { source: process.env.BENTIX_DATA_SOURCE, url: process.env.DATABASE_URL, prisma: globalThis.prisma }
let getAllAccessIdentitiesData, getAccessIdentityByPersonIdData
before(async () => {
  process.env.BENTIX_DATA_SOURCE = 'mysql'
  process.env.DATABASE_URL = 'mysql://test:test@localhost/test'
  ;({ getAllAccessIdentitiesData, getAccessIdentityByPersonIdData } = await import('../lib/access-identities.js'))
})
after(() => {
  for (const [key, value] of [['BENTIX_DATA_SOURCE', previous.source], ['DATABASE_URL', previous.url]]) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  globalThis.prisma = previous.prisma
})

const work = (id, name = `Obra ${id}`) => ({ id, number: id, name, clientId: 1 })
const user = (id, role = 'chef_primeira') => ({
  id, personId: id, username: `user-${id}`, role, passwordHash: 'test-only',
  person: { id, companyId: 1, name: `Pessoa ${id}`, role },
})
const assignment = (id, personId, workId, date = '2026-10-21', extra = {}) => ({
  id, personId, workId, workPlanId: Number(date.replaceAll('-', '')),
  planningVisible: true, assignmentPurpose: 'work',
  person: { role: 'chef_primeira' }, work: work(workId),
  workPlan: { date: new Date(`${date}T00:00:00Z`) }, ...extra,
})

function installDb(users, assignments = [], grants = []) {
  const calls = { users: 0, assignments: [], grants: [] }
  // The real Prisma wrapper checks that the cached client has all delegates.
  const db = Object.fromEntries(Object.values(Prisma.ModelName).map(name => [name[0].toLowerCase() + name.slice(1), {}]))
  db.user = {
    findMany: async () => { calls.users++; return users },
    findFirst: async ({ where }) => users.find(item => item.personId === where.personId) || null,
  }
  db.workAssignment = { findMany: async args => {
    calls.assignments.push(args)
    return assignments.filter(item => args.where.personId.in.includes(item.personId))
  } }
  db.workExtraAccessGrant = { findMany: async args => {
    calls.grants.push(args)
    return grants.filter(item => args.where.personId.in.includes(item.personId))
  } }
  globalThis.prisma = db
  return { db, calls }
}

for (const count of [1, 14, 100]) {
  test(`${count} scoped identities use one assignment query and one extra-access query`, async () => {
    const users = Array.from({ length: count }, (_, index) => user(index + 1))
    const { calls } = installDb(users, users.map(item => assignment(item.id, item.id, 1)))
    const result = await getAllAccessIdentitiesData()
    assert.equal(result.length, count)
    assert.ok(result.every(item => item.works.length === 1 && item.works[0].id === 1))
    assert.equal(calls.users, 1)
    assert.equal(calls.assignments.length, 1)
    assert.equal(calls.grants.length, 1)
    assert.equal(calls.assignments[0].where.personId.in.length, count)
    assert.equal(calls.assignments[0].include, undefined)
    assert.equal(calls.assignments[0].select.hours, undefined)
    assert.equal(calls.assignments[0].select.hourlyCost, undefined)
    assert.deepEqual(calls.assignments[0].select.work.select, { id: true, number: true, name: true, clientId: true })
  })
}

test('Admin, Responsável and unattached identities neither gain scoped works nor load assignments', async () => {
  const users = [user(1, 'admin'), user(2, 'responsavel'), { ...user(3), personId: null, person: null }]
  const { calls } = installDb(users, [assignment(1, 1, 1)])
  const result = await getAllAccessIdentitiesData()
  assert.deepEqual(result.map(item => item.works), [[], [], []])
  assert.deepEqual(result.map(item => item.role), ['admin', 'responsavel', 'chef_primeira'])
  assert.equal(calls.assignments.length, 0)
  assert.equal(calls.grants.length, 0)
})

test('latest date, multiple works, visibility, access-only, extra grants and no history preserve access', async () => {
  installDb([user(1), user(2), user(3)], [
    assignment(1, 1, 9, '2026-10-20'),
    assignment(2, 1, 2), assignment(3, 1, 1), assignment(4, 1, 1),
    assignment(5, 1, 7, '2026-10-22', { planningVisible: false }),
    assignment(6, 1, 8, '2026-10-23', { assignmentPurpose: 'access' }),
    assignment(7, 2, 3, '2026-10-20'),
    assignment(8, 2, 4, '2026-10-21', { person: { role: 'carpinteiro' } }),
  ], [{ personId: 1, work: work(2) }, { personId: 1, work: work(6) }, { personId: 3, work: work(5) }])
  const result = await getAllAccessIdentitiesData()
  assert.deepEqual(result.map(item => item.works.map(work => work.id)), [[1, 2, 6], [3], [5]])
  for (const item of result) assert.deepEqual(await getAccessIdentityByPersonIdData(item.personId), item)
})

test('no history returns no works; errors propagate rather than silently dropping access', async () => {
  installDb([user(1)])
  assert.deepEqual((await getAllAccessIdentitiesData())[0].works, [])
  globalThis.prisma.workAssignment.findMany = async () => { throw new Error('DB unavailable') }
  await assert.rejects(getAllAccessIdentitiesData(), /DB unavailable/)
})

test('batch relations normalize duplicate IDs and skip empty batches', async () => {
  const { db, calls } = installDb([])
  assert.deepEqual(await getAccessIdentityWorkRelationsDb([], db), { assignments: [], extraGrants: [] })
  await getAccessIdentityWorkRelationsDb([1, '1', 2, null, 0], db)
  assert.deepEqual(calls.assignments[0].where.personId.in, [1, 2])
})
