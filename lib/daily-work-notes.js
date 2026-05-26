import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { getWorkById } from './works.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const notesFilePath = join(dataDir, 'daily-work-notes.json')

export class DailyWorkNote {
  constructor(data) {
    this.id = data.id
    this.date = String(data.date || '').trim()
    this.workId = parseInt(data.workId)
    this.authorId = parseInt(data.authorId) || 0
    this.authorName = String(data.authorName || '').trim()
    this.note = String(data.note || '').trim()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }
}

export class DailyWorkNotesService {
  constructor(filePath = notesFilePath) {
    this.filePath = filePath
    this.notes = this.load()
  }

  ensureDataDir() {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  }

  load() {
    this.ensureDataDir()

    if (!existsSync(this.filePath)) {
      return []
    }

    try {
      const rawData = JSON.parse(readFileSync(this.filePath, 'utf8'))
      return normalizeNotes(rawData)
    } catch (error) {
      console.error('Error loading daily work notes:', error.message)
      return []
    }
  }

  save() {
    this.ensureDataDir()
    writeFileSync(this.filePath, JSON.stringify(this.notes, null, 2), 'utf8')
  }

  refresh() {
    this.notes = this.load()
    return this.notes
  }

  getAll(filters = {}) {
    return this.refresh()
      .filter(note => !filters.date || note.date === filters.date)
      .filter(note => !filters.workId || note.workId === parseInt(filters.workId))
      .filter(note => !filters.authorId || note.authorId === parseInt(filters.authorId))
      .map(enrichNote)
  }

  getNextId() {
    if (this.notes.length === 0) return 1
    return Math.max(...this.notes.map(note => note.id)) + 1
  }

  upsert(data) {
    this.refresh()
    validateNoteData(data)

    const date = String(data.date || '').trim()
    const workId = parseInt(data.workId)
    const authorId = parseInt(data.authorId) || 0
    const currentIndex = this.notes.findIndex(
      note => note.date === date && note.workId === workId && note.authorId === authorId,
    )

    const nextNote = new DailyWorkNote({
      ...data,
      id: currentIndex >= 0 ? this.notes[currentIndex].id : this.getNextId(),
      date,
      workId,
      authorId,
      updatedAt: new Date().toISOString(),
    })

    if (currentIndex >= 0) {
      this.notes[currentIndex] = nextNote
    } else {
      this.notes.push(nextNote)
    }

    this.save()
    return enrichNote(nextNote)
  }

  removeMany(ids = []) {
    this.refresh()

    const targetIds = new Set(
      (Array.isArray(ids) ? ids : [ids])
        .map(id => parseInt(id))
        .filter(id => Number.isInteger(id) && id > 0),
    )

    if (targetIds.size === 0) {
      return 0
    }

    const previousCount = this.notes.length
    this.notes = this.notes.filter(note => !targetIds.has(Number(note.id)))
    const removedCount = previousCount - this.notes.length

    if (removedCount > 0) {
      this.save()
    }

    return removedCount
  }
}

function normalizeNotes(list) {
  if (!Array.isArray(list)) return []

  return list
    .map((note, index) => new DailyWorkNote({
      ...note,
      id: note.id !== undefined ? parseInt(note.id) : index + 1,
    }))
    .filter(note => note.date && note.workId)
}

function validateNoteData(data) {
  const date = String(data.date || '').trim()
  const workId = parseInt(data.workId)

  if (!date || Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
    throw new Error('Data obrigatória.')
  }

  if (!workId || !getWorkById(workId)) {
    throw new Error('Obra obrigatória.')
  }
}

function enrichNote(note) {
  const work = getWorkById(note.workId)

  return {
    ...note,
    work: work
      ? {
          id: work.id,
          number: work.number,
          name: work.name,
        }
      : null,
  }
}

const dailyWorkNotesService = new DailyWorkNotesService()

export function getAllDailyWorkNotes(filters) {
  return dailyWorkNotesService.getAll(filters)
}

export function upsertDailyWorkNote(data) {
  return dailyWorkNotesService.upsert(data)
}

export function removeDailyWorkNotes(ids) {
  return dailyWorkNotesService.removeMany(ids)
}
