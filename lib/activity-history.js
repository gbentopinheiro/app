import { getAllDailyWorkNotesData } from './daily-work-notes.js'
import { getAllWorkAssignmentsData } from './work-assignments.js'

export const ACTIVITY_HISTORY_PERIOD_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
]

function normalizeQueryValue(value) {
  if (Array.isArray(value)) {
    return value[0] || ''
  }

  return value || ''
}

function normalizePositiveInt(value) {
  const normalizedValue = String(normalizeQueryValue(value)).trim()

  if (!normalizedValue) {
    return null
  }

  const parsedValue = Number(normalizedValue)
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
}

function normalizeDateOnly(value) {
  const rawValue = String(normalizeQueryValue(value)).trim()

  if (!rawValue) {
    return ''
  }

  const matchedDate = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (matchedDate) {
    return `${matchedDate[1]}-${matchedDate[2]}-${matchedDate[3]}`
  }

  const parsedDate = new Date(rawValue)

  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  return parsedDate.toISOString().slice(0, 10)
}

function parseDateOnly(value) {
  const normalizedDate = normalizeDateOnly(value)

  if (!normalizedDate) {
    return null
  }

  const parsedDate = new Date(`${normalizedDate}T12:00:00`)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

function getIsoWeekKey(date) {
  const normalizedDate = new Date(date.getTime())
  const weekDay = normalizedDate.getDay() || 7

  normalizedDate.setDate(normalizedDate.getDate() + 4 - weekDay)

  const yearStart = new Date(normalizedDate.getFullYear(), 0, 1)
  const weekNumber = Math.ceil((((normalizedDate - yearStart) / 86400000) + 1) / 7)

  return `${normalizedDate.getFullYear()}-${String(weekNumber).padStart(2, '0')}`
}

function matchesPeriod(eventDate, filters) {
  if (filters.period === 'all') {
    return true
  }

  const parsedEventDate = parseDateOnly(eventDate)
  const parsedReferenceDate = parseDateOnly(filters.referenceDate)

  if (!parsedEventDate || !parsedReferenceDate) {
    return false
  }

  if (filters.period === 'day') {
    return normalizeDateOnly(parsedEventDate.toISOString()) === normalizeDateOnly(parsedReferenceDate.toISOString())
  }

  if (filters.period === 'week') {
    return getIsoWeekKey(parsedEventDate) === getIsoWeekKey(parsedReferenceDate)
  }

  if (filters.period === 'month') {
    return (
      parsedEventDate.getFullYear() === parsedReferenceDate.getFullYear() &&
      parsedEventDate.getMonth() === parsedReferenceDate.getMonth()
    )
  }

  if (filters.period === 'year') {
    return parsedEventDate.getFullYear() === parsedReferenceDate.getFullYear()
  }

  return true
}

export function formatActivityHistoryDateTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Sem data'
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function escapeCsvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export function normalizeActivityHistoryFilters(searchParams = {}) {
  const rawPeriod = String(normalizeQueryValue(searchParams.period)).trim().toLowerCase()
  const period = ACTIVITY_HISTORY_PERIOD_OPTIONS.some(option => option.value === rawPeriod) ? rawPeriod : 'all'
  const referenceDate = normalizeDateOnly(searchParams.referenceDate) || getTodayDate()

  return {
    period,
    referenceDate,
    personId: normalizePositiveInt(searchParams.personId),
    workId: normalizePositiveInt(searchParams.workId),
  }
}

function sortEvents(events) {
  return events.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
}

function buildActivityHistoryRows(assignments, notes) {
  return sortEvents([
    ...assignments
      .filter(assignment => assignment.submitted && assignment.submittedAt)
      .map(assignment => ({
        id: `submitted-${assignment.id}`,
        kind: 'submitted',
        title: 'Horas submetidas',
        date: assignment.submittedAt,
        actor: assignment.submittedBy || 'Chef',
        text: `${assignment.person?.name || 'Pessoa'} - ${assignment.work?.name || `Obra ${assignment.workId}`} - ${assignment.hours}h`,
        personId: assignment.personId || null,
        personName: assignment.person?.name || '',
        workId: assignment.workId || null,
        workName: assignment.work?.name || '',
      })),
    ...assignments
      .filter(assignment => assignment.approvedHours !== null && assignment.approvedHours !== undefined)
      .map(assignment => ({
        id: `approved-${assignment.id}`,
        kind: 'approved',
        title: 'Horas aprovadas',
        date: assignment.submittedAt || assignment.date,
        actor: 'Administrador',
        text: `${assignment.person?.name || 'Pessoa'} - ${assignment.work?.name || `Obra ${assignment.workId}`} - ${assignment.approvedHours}h`,
        personId: assignment.personId || null,
        personName: assignment.person?.name || '',
        workId: assignment.workId || null,
        workName: assignment.work?.name || '',
      })),
    ...notes
      .filter(note => note.note)
      .map(note => ({
        id: `note-${note.id}`,
        kind: 'note',
        title: 'Notas da obra',
        date: note.updatedAt,
        actor: note.authorName || 'Chef',
        text: `${note.work?.name || `Obra ${note.workId}`} - ${note.note}`,
        personId: note.authorId || null,
        personName: note.authorName || '',
        workId: note.workId || null,
        workName: note.work?.name || '',
      })),
  ])
}

function filterActivityHistoryRows(rows, filters) {
  return rows.filter(row => {
    if (filters.personId && Number(row.personId) !== Number(filters.personId)) {
      return false
    }

    if (filters.workId && Number(row.workId) !== Number(filters.workId)) {
      return false
    }

    return matchesPeriod(row.date, filters)
  })
}

export async function getGlobalActivityHistoryData(filters = {}, options = {}) {
  const normalizedFilters = normalizeActivityHistoryFilters(filters)
  const limitPerSection = options.limitPerSection ?? null
  const [assignments, notes] = await Promise.all([
    getAllWorkAssignmentsData(),
    getAllDailyWorkNotesData(),
  ])

  const allRows = filterActivityHistoryRows(
    buildActivityHistoryRows(assignments, notes),
    normalizedFilters,
  )

  const sliceRows = rows => (limitPerSection ? rows.slice(0, limitPerSection) : rows)
  const submittedEvents = sliceRows(allRows.filter(row => row.kind === 'submitted'))
  const approvedEvents = sliceRows(allRows.filter(row => row.kind === 'approved'))
  const noteEvents = sliceRows(allRows.filter(row => row.kind === 'note'))

  return {
    filters: normalizedFilters,
    allEvents: allRows,
    submittedEvents,
    approvedEvents,
    noteEvents,
    summary: {
      total: allRows.length,
      submitted: allRows.filter(row => row.kind === 'submitted').length,
      approved: allRows.filter(row => row.kind === 'approved').length,
      notes: allRows.filter(row => row.kind === 'note').length,
    },
  }
}

export function buildGlobalActivityHistoryCsv(rows) {
  const header = ['Tipo', 'Data', 'Autor', 'Pessoa', 'Obra', 'Detalhe']
  const lines = [
    header,
    ...rows.map(row => [
      row.title,
      formatActivityHistoryDateTime(row.date),
      row.actor,
      row.personName,
      row.workName,
      row.text,
    ]),
  ]

  return `\ufeff${lines.map(line => line.map(escapeCsvCell).join(';')).join('\n')}`
}
