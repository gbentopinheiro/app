import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPlanningMessagePreview, comparePlanningMessageAssignments, getPlanningPersonChangeStatus, PLANNING_CHANGE_LABELS } from '../lib/planning-message.js'
import { getPreviousPlanningDateValue } from '../lib/planning-date.js'
import { getAdjacentPlanningDate } from '../app/daily-plan/planning-board-view.js'

const date = '2030-02-10'
const previousDate = '2030-02-09'
const row = (personId, workId, extra = {}) => ({
  personId, workId, person: { id: personId, name: `Pessoa ${personId}` },
  work: { id: workId, name: `Obra ${workId}` }, ...extra,
})
const compare = (assignments, previous, snapshotDate = previousDate) => comparePlanningMessageAssignments({
  planningDate: date, assignments, previousDaySnapshot: { date: snapshotDate, state: 'published', assignments: previous },
})

test('previous calendar date handles month/year boundaries, leap years and daylight saving dates', () => {
  for (const [input, expected] of [
    ['2030-01-01', '2029-12-31'], ['2028-03-01', '2028-02-29'], ['2026-03-30', '2026-03-29'],
    ['2026-10-26', '2026-10-25'], ['invalid', ''], ['2030-02-30', ''],
  ]) assert.equal(getPreviousPlanningDateValue(input), expected)
})

for (const [selectedDate, referenceDate] of [
  ['2026-10-20', '2026-10-19'],
  ['2026-10-21', '2026-10-20'],
  ['2026-10-22', '2026-10-21'],
  ['2026-10-25', '2026-10-24'],
  ['2026-11-01', '2026-10-31'],
  ['2027-01-01', '2026-12-31'],
]) {
  test(`selected ${selectedDate} compares only with ${referenceDate}, including visual and copied indicators`, () => {
    assert.equal(getPreviousPlanningDateValue(selectedDate), referenceDate)
    const current = [row(1, 20), row(2, 10), row(3, 20)]
    const changes = comparePlanningMessageAssignments({
      planningDate: selectedDate, assignments: current,
      previousDaySnapshot: { date: referenceDate, assignments: [row(1, 10), row(2, 10), row(4, 10)] },
    })
    assert.equal(getPlanningPersonChangeStatus(changes, 1), 'changed')
    assert.equal(getPlanningPersonChangeStatus(changes, 2), '')
    assert.equal(getPlanningPersonChangeStatus(changes, 3), 'new')
    assert.deepEqual(changes.removedAssignments.map(a => a.personId), [1, 4])
    const copied = buildPlanningMessagePreview({
      planningDate: selectedDate,
      groupedAssignments: [{ workId: 20, workName: 'Obra 20', assignments: current }],
      selectedWorkIds: ['20'], changes,
    })
    assert.match(copied, /Pessoa 1 \[ALTERADO\]/)
    assert.match(copied, /Pessoa 3 \[NOVO\]/)
    assert.match(copied, /Pessoa 4 \[REMOVIDO\]/)
    assert.ok(copied.split('\n').includes('- Pessoa 2'))
    assert.ok(copied.startsWith(`Plano do dia ${selectedDate}\n`))
    const staleReference = comparePlanningMessageAssignments({
      planningDate: selectedDate, assignments: current,
      previousDaySnapshot: { date: selectedDate, assignments: [] },
    })
    assert.equal(staleReference.changedPersonIds.size + staleReference.newPersonIds.size + staleReference.removedAssignments.length, 0)
  })
}

test('reference date never reads the current clock', () => {
  const RealDate = globalThis.Date
  try {
    globalThis.Date = class extends RealDate {
      constructor(...args) {
        assert.notEqual(args.length, 0, 'comparison must not construct today')
        super(...args)
      }
      static now() { throw new Error('comparison must not read today') }
    }
    for (const [selectedDate, referenceDate] of [
      ['2026-10-21', '2026-10-20'], ['2026-10-22', '2026-10-21'],
      ['2026-10-25', '2026-10-24'], ['2026-11-01', '2026-10-31'],
      ['2027-01-01', '2026-12-31'],
    ]) {
      assert.equal(getPreviousPlanningDateValue(selectedDate), referenceDate)
      const changes = comparePlanningMessageAssignments({
        planningDate: selectedDate, assignments: [row(1, 20)],
        previousDaySnapshot: { date: referenceDate, assignments: [row(1, 10)] },
      })
      assert.deepEqual([...changes.changedPersonIds], ['1'])
    }
  } finally {
    globalThis.Date = RealDate
  }
})

test('previous/next navigation replaces the comparison rather than retaining the prior selected day', () => {
  const plans = new Map([
    ['2026-10-20', [row(1, 10), row(2, 10)]],
    ['2026-10-21', [row(1, 20), row(2, 10), row(3, 20)]],
    ['2026-10-22', [row(1, 20), row(2, 10)]],
  ])
  const inspect = selectedDate => comparePlanningMessageAssignments({
    planningDate: selectedDate, assignments: plans.get(selectedDate),
    previousDaySnapshot: { date: getPreviousPlanningDateValue(selectedDate), assignments: plans.get(getPreviousPlanningDateValue(selectedDate)) },
  })
  const selected = '2026-10-21'
  const next = getAdjacentPlanningDate(selected, 1)
  assert.equal(next, '2026-10-22')
  assert.deepEqual([...inspect(selected).changedPersonIds], ['1'])
  assert.deepEqual([...inspect(selected).newPersonIds], ['3'])
  const changes = inspect(next)
  assert.equal(changes.changedPersonIds.size + changes.newPersonIds.size, 0)
  assert.deepEqual(changes.removedAssignments.map(item => item.personId), [3])
  const text = buildPlanningMessagePreview({ planningDate: next, changes,
    groupedAssignments: [{ workId: 20, workName: 'Obra 20', assignments: plans.get(next) }], selectedWorkIds: ['20'] })
  assert.doesNotMatch(text, /\[ALTERADO\]|\[NOVO\]/)
  assert.match(text, /Pessoa 3 \[REMOVIDO\]/)
  assert.deepEqual(inspect(getAdjacentPlanningDate(next, -1)), inspect(selected))
  assert.equal(getPreviousPlanningDateValue(getAdjacentPlanningDate('2026-10-31', 1)), '2026-10-31')
  assert.equal(getPreviousPlanningDateValue(getAdjacentPlanningDate('2026-12-31', 1)), '2026-12-31')
})

test('no previous-day plan means no highlights; same-day and older plans must not be used', () => {
  const result = comparePlanningMessageAssignments({ planningDate: date, assignments: [row(1, 10)], previousDaySnapshot: null })
  assert.equal(result.changedPersonIds.size, 0)
  assert.equal(result.newPersonIds.size, 0)
  assert.deepEqual(result.removedAssignments, [])
  for (const otherDate of [date, '2030-02-08']) {
    const changes = compare([row(1, 10)], [], otherDate)
    assert.equal(changes.changedPersonIds.size, 0)
    assert.equal(changes.newPersonIds.size, 0)
  }
})

test('same work stays normal despite different row IDs, names, roles, prices, notes or hours', () => {
  const result = compare(
    [row('1', '10', { id: 9, person: { name: 'Renamed', role: 'chef_primeira' }, hourlyCost: 99,
      notes: 'Changed instruction', manualHourlyCost: true, hasWorkAccess: true, hours: 8, submitted: true })],
    [row(1, 10, { id: 1 })],
  )
  assert.equal(result.changedPersonIds.size, 0)
  assert.equal(result.newPersonIds.size, 0)
  assert.deepEqual(result.removedAssignments, [])
})

test('moving A to B highlights only the moved person and records the removed membership', () => {
  const before = [row(1, 10), row(2, 10)]
  const current = [row(1, 20), row(2, 10)]
  const copy = structuredClone({ before, current })
  const result = compare(current, before)
  assert.deepEqual([...result.changedPersonIds], ['1'])
  assert.equal(result.newPersonIds.size, 0)
  assert.deepEqual(result.removedAssignments.map(a => [a.personId, a.workId]), [[1, 10]])
  assert.deepEqual({ before, current }, copy)
})

test('new workers are Novo rather than Alterado, including after an empty previous-day plan', () => {
  const result = compare([row(1, 10), row(2, 20)], [row(1, 10)])
  assert.deepEqual([...result.newPersonIds], ['2'])
  assert.equal(result.changedPersonIds.size, 0)
  assert.deepEqual([...compare([row(1, 10)], []).newPersonIds], ['1'])
})

test('removed workers remain available for display even with an empty current message', () => {
  const result = compare([], [row(1, 10), row(2, 20)])
  assert.equal(result.changedPersonIds.size, 0)
  assert.equal(result.newPersonIds.size, 0)
  assert.deepEqual(result.removedAssignments.map(a => a.personId), [1, 2])
  assert.equal(buildPlanningMessagePreview({ planningDate: date, groupedAssignments: [], selectedWorkIds: [] }), '')
})

test('multiple works compare complete memberships independent of order', () => {
  const previous = [row(1, 10), row(1, 20), row(2, 20)]
  assert.equal(compare([row(2, 20), row(1, 20), row(1, 10)], previous).changedPersonIds.size, 0)
  for (const current of [
    [row(1, 20), row(1, 30), row(2, 20)],
    [row(1, 20), row(2, 20)],
    [row(1, 10), row(1, 20), row(1, 30), row(2, 20)],
  ]) {
    const result = compare(current, previous)
    assert.deepEqual([...result.changedPersonIds], ['1'])
    assert.equal(result.newPersonIds.size, 0)
  }
})

test('access-only entries and invalidated history are excluded', () => {
  const result = compare([row(2, 20, { assignmentPurpose: 'access' })], [
    row(1, 10, { planningVisible: false }), row(2, 20, { assignmentPurpose: 'access' }),
  ])
  assert.equal(result.changedPersonIds.size, 0)
  assert.equal(result.newPersonIds.size, 0)
  assert.deepEqual(result.removedAssignments, [])
})

test('message without comparison data keeps its original plain text format', () => {
  const message = buildPlanningMessagePreview({
    planningDate: date,
    groupedAssignments: [
      { workId: 20, workName: 'Obra 20', assignments: [row(1, 20)] },
      { workId: 10, workName: 'Obra 10', assignments: [row(2, 10), row(3, 10, { assignmentPurpose: 'access' })] },
    ],
    selectedWorkIds: ['20', '10'],
  })
  assert.equal(message, 'Plano do dia 2030-02-10\n\nObra 20\n- Pessoa 1\n\nObra 10\n- Pessoa 2')
  assert.doesNotMatch(message, /Alterado|Novo|Removido|<span|style=/)
})

test('copied message uses the same changed, new and unchanged statuses as the visual preview', () => {
  const current = [row(1, 20), row(2, 10), row(3, 20)]
  const changes = compare(current, [row(1, 10), row(2, 10), row(4, 10)])
  const before = structuredClone(changes)
  const message = buildPlanningMessagePreview({
    planningDate: date,
    groupedAssignments: [
      { workId: 20, workName: 'Obra 20', assignments: [current[0], current[2]] },
      { workId: 10, workName: 'Obra 10', assignments: [current[1]] },
    ],
    selectedWorkIds: ['20', '10'], changes,
  })
  assert.equal(message, [
    'Plano do dia 2030-02-10',
    'Obra 20\n- Pessoa 1 [ALTERADO]\n- Pessoa 3 [NOVO]',
    'Obra 10\n- Pessoa 2',
    'Removidos de obras face ao dia anterior\n- Pessoa 1 [REMOVIDO] · Removido de Obra 10\n- Pessoa 4 [REMOVIDO] · Removido de Obra 10',
  ].join('\n\n'))
  for (const assignment of current) {
    // Both the visual name component and copied text use this shared status resolver.
    const visualLabel = PLANNING_CHANGE_LABELS[getPlanningPersonChangeStatus(changes, assignment.personId)]
    const line = message.split('\n').find(line => line.startsWith(`- Pessoa ${assignment.personId}`))
    assert.equal(line, `- Pessoa ${assignment.personId}${visualLabel ? ` [${visualLabel.toUpperCase()}]` : ''}`)
  }
  assert.doesNotMatch(message, /<span|style=/)
  assert.deepEqual(changes, before, 'formatting must not modify comparison results')
})

test('unselected works remain out of copied current assignments while displayed removals are retained', () => {
  const changes = compare([row(1, 20), row(2, 10)], [row(1, 10)])
  const message = buildPlanningMessagePreview({
    planningDate: date,
    groupedAssignments: [
      { workId: 20, workName: 'Obra 20', assignments: [row(1, 20)] },
      { workId: 10, workName: 'Obra 10', assignments: [row(2, 10)] },
    ],
    selectedWorkIds: ['10'], changes,
  })
  assert.match(message, /Pessoa 2 \[NOVO\]/)
  assert.doesNotMatch(message, /Pessoa 1 \[ALTERADO\]|Obra 20/)
  assert.match(message, /Pessoa 1 \[REMOVIDO\]/)
})

test('removed-only preview can be copied with REMOVIDO and its former work', () => {
  const message = buildPlanningMessagePreview({
    planningDate: date, changes: compare([], [row(1, 10)]),
  })
  assert.equal(message, 'Plano do dia 2030-02-10\n\nRemovidos de obras face ao dia anterior\n- Pessoa 1 [REMOVIDO] · Removido de Obra 10')
})

test('missing previous-day plan adds no indicators to copied names', () => {
  const changes = comparePlanningMessageAssignments({ planningDate: date, assignments: [row(1, 10)] })
  const message = buildPlanningMessagePreview({
    planningDate: date, groupedAssignments: [{ workId: 10, workName: 'Obra 10', assignments: [row(1, 10)] }],
    selectedWorkIds: ['10'], changes,
  })
  assert.equal(message, 'Plano do dia 2030-02-10\n\nObra 10\n- Pessoa 1')
})
