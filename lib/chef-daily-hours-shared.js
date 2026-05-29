export function getTodayDate() {
  return new Intl.DateTimeFormat('sv-SE').format(new Date())
}

export function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatSubmittedTime(submittedAt) {
  if (!submittedAt) {
    return ''
  }

  const date = new Date(submittedAt)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function sortWorksByNumber(works = []) {
  return [...works].sort((left, right) => Number(left.number || 0) - Number(right.number || 0))
}

export function sortEntriesByPersonName(entries = []) {
  return [...entries].sort((left, right) =>
    String(left.person?.name || '').localeCompare(String(right.person?.name || '')),
  )
}

export function mapWorkNotesByWorkId(notes = []) {
  const nextWorkNotes = {}

  ;(Array.isArray(notes) ? notes : []).forEach(note => {
    nextWorkNotes[String(note.workId)] = note.note || ''
  })

  return nextWorkNotes
}

export async function fetchChefDailyHoursData({
  date,
  previewQuerySuffix = '',
  cache = undefined,
  loadErrorMessage = 'Não foi possível carregar os registos diários.',
}) {
  const requestOptions = cache ? { cache } : undefined
  const response = await fetch(
    `/api/work-assignments?includeDefaults=true&date=${encodeURIComponent(date)}${previewQuerySuffix}`,
    requestOptions,
  )
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || loadErrorMessage)
  }

  return {
    defaults: data.defaults || { works: [] },
    items: data.items || [],
  }
}

export async function fetchChefWorkNotes({ date, previewQuerySuffix = '', cache = undefined }) {
  const requestOptions = cache ? { cache } : undefined
  const response = await fetch(`/api/daily-work-notes?date=${encodeURIComponent(date)}${previewQuerySuffix}`, requestOptions)
  const data = await response.json().catch(() => [])

  return {
    ok: response.ok,
    unavailable: response.status === 503,
    items: Array.isArray(data) ? data : [],
    notesByWorkId: mapWorkNotesByWorkId(data),
  }
}

export function validateChefEntryHours(entries, entryHours) {
  const nextRowErrors = {}
  let hasErrors = false

  for (const entry of entries) {
    const rawValue = entryHours[String(entry.id)]
    const numericValue = Number(rawValue)

    if (rawValue === '' || Number.isNaN(numericValue) || numericValue < 0) {
      nextRowErrors[String(entry.id)] = 'Indica horas iguais ou maiores que 0.'
      hasErrors = true
    }
  }

  return {
    hasErrors,
    rowErrors: nextRowErrors,
  }
}

export async function saveChefWorkNote({
  date,
  workId,
  note,
  saveErrorMessage = 'Não foi possível guardar a nota da obra.',
}) {
  const response = await fetch('/api/daily-work-notes', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date,
      workId,
      note,
    }),
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || saveErrorMessage)
  }

  return data.note || ''
}

export async function submitChefEntries({
  entries,
  entryHours,
  updateErrorMessage = 'Não foi possível atualizar as horas.',
  submitErrorMessage = 'Não foi possível submeter as horas.',
}) {
  await Promise.all(
    entries.map(async entry => {
      const response = await fetch(`/api/work-assignments/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: Number(entryHours[String(entry.id)]) }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || updateErrorMessage)
      }
    }),
  )

  await Promise.all(
    entries.map(async entry => {
      const response = await fetch(`/api/work-assignments/${entry.id}/submit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || submitErrorMessage)
      }
    }),
  )
}
