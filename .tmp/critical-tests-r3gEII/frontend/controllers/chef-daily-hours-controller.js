import { apiFetchJson } from '../api/api-client.js'
import { saveWorkAssignment, submitWorkAssignment } from './work-assignments-controller.js'
import {
  fetchDailyWorkNotes,
  saveDailyWorkNote,
} from './daily-work-notes-controller.js'

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.append(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

function buildPreviewParams(previewQuerySuffix = '') {
  const normalizedPreviewQuery = String(previewQuerySuffix || '').replace(/^[?&]+/, '')

  if (!normalizedPreviewQuery) {
    return {}
  }

  const previewParams = {}
  new URLSearchParams(normalizedPreviewQuery).forEach((value, key) => {
    previewParams[key] = value
  })

  return previewParams
}

function mapWorkNotesByWorkId(notes = []) {
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
  const params = {
    includeDefaults: true,
    date,
    ...buildPreviewParams(previewQuerySuffix),
  }
  const requestOptions = cache ? { cache } : undefined
  const { response, data } = await apiFetchJson(`/api/work-assignments${buildQueryString(params)}`, requestOptions)

  if (!response.ok) {
    throw new Error(data.error || loadErrorMessage)
  }

  return {
    defaults: data.defaults || { works: [] },
    items: data.items || [],
  }
}

export async function fetchChefWorkNotes({
  date,
  previewQuerySuffix = '',
  cache = undefined,
}) {
  const requestOptions = cache ? { cache } : undefined
  const { response, data } = await fetchDailyWorkNotes(
    {
      date,
      ...buildPreviewParams(previewQuerySuffix),
    },
    requestOptions,
  )

  return {
    ok: response.ok,
    unavailable: response.status === 503,
    items: Array.isArray(data) ? data : [],
    notesByWorkId: mapWorkNotesByWorkId(data),
  }
}

export async function saveChefWorkNote({
  date,
  workId,
  note,
  saveErrorMessage = 'Não foi possível guardar a nota da obra.',
}) {
  const data = await saveDailyWorkNote(
    {
      date,
      workId,
      note,
    },
    saveErrorMessage,
  )

  return data.note || ''
}

export async function submitChefEntries({
  entries,
  entryHours,
  updateErrorMessage = 'Não foi possível atualizar as horas.',
  submitErrorMessage = 'Não foi possível submeter as horas.',
}) {
  await Promise.all(
    entries.map(entry =>
      saveWorkAssignment(
        entry.id,
        { hours: Number(entryHours[String(entry.id)]) },
        updateErrorMessage,
      ),
    ),
  )

  await Promise.all(
    entries.map(entry =>
      submitWorkAssignment(entry.id, undefined, submitErrorMessage),
    ),
  )
}
