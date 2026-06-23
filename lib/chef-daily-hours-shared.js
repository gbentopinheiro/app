import {
  fetchChefDailyHoursData as fetchChefDailyHoursDataRequest,
  fetchChefWorkNotes as fetchChefWorkNotesRequest,
  saveChefWorkNote as saveChefWorkNoteRequest,
  submitChefEntries as submitChefEntriesRequest,
} from '../frontend/controllers/chef-daily-hours-controller.js'

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
  return fetchChefDailyHoursDataRequest({
    date,
    previewQuerySuffix,
    cache,
    loadErrorMessage,
  })
}

export async function fetchChefWorkNotes({ date, previewQuerySuffix = '', cache = undefined }) {
  return fetchChefWorkNotesRequest({ date, previewQuerySuffix, cache })
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
  return saveChefWorkNoteRequest({
    date,
    workId,
    note,
    saveErrorMessage,
  })
}

export async function submitChefEntries({
  entries,
  entryHours,
  updateErrorMessage = 'Não foi possível atualizar as horas.',
  submitErrorMessage = 'Não foi possível submeter as horas.',
}) {
  return submitChefEntriesRequest({
    entries,
    entryHours,
    updateErrorMessage,
    submitErrorMessage,
  })
}
