import { prisma } from '../prisma.js'
import {
  mapWorkRecord,
  toDateOnlyString,
  toDateOnlyValue,
  toDateTimeString,
  toPositiveInt,
  toRequiredString,
} from './core-mappers.js'

function getDailyWorkNoteIncludes() {
  return {
    work: {
      include: {
        company: true,
        client: true,
        workingDays: true,
        roleHourlyCosts: true,
        personHourlyCosts: true,
      },
    },
  }
}

function mapDailyWorkNoteRecord(record) {
  if (!record) {
    return null
  }

  return {
    id: Number(record.id),
    date: toDateOnlyString(record.date),
    workId: Number(record.workId),
    authorId: toPositiveInt(record.authorId, 0) || 0,
    authorName: toRequiredString(record.authorName) || '',
    note: toRequiredString(record.note),
    updatedAt: toDateTimeString(record.updatedAt),
    work: record.work ? mapWorkRecord(record.work) : null,
  }
}

export async function getAllDailyWorkNotesDb(filters = {}) {
  const workId = toPositiveInt(filters.workId)
  const authorId = toPositiveInt(filters.authorId)
  const date = filters.date ? toDateOnlyValue(filters.date) : null

  const notes = await prisma.dailyWorkNote.findMany({
    where: {
      ...(workId ? { workId } : {}),
      ...(authorId ? { authorId } : {}),
      ...(date ? { date } : {}),
    },
    include: getDailyWorkNoteIncludes(),
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
  })

  return notes.map(mapDailyWorkNoteRecord)
}

export async function upsertDailyWorkNoteDb(data) {
  const date = toDateOnlyValue(data?.date)
  const workId = toPositiveInt(data?.workId)
  const authorId = toPositiveInt(data?.authorId, null)
  const authorName = toRequiredString(data?.authorName) || null
  const note = toRequiredString(data?.note)

  if (!date) {
    throw new Error('Data obrigatoria.')
  }

  if (!workId) {
    throw new Error('Obra obrigatoria.')
  }

  const existingNote = await prisma.dailyWorkNote.findUnique({
    where: {
      date_workId: {
        date,
        workId,
      },
    },
  })

  const currentHighestId = existingNote
    ? { _max: { id: existingNote.id } }
    : await prisma.dailyWorkNote.aggregate({ _max: { id: true } })

  const savedNote = await prisma.dailyWorkNote.upsert({
    where: {
      date_workId: {
        date,
        workId,
      },
    },
    create: {
      id: existingNote?.id || (Number(currentHighestId._max.id) || 0) + 1,
      date,
      workId,
      authorId,
      authorName,
      note,
      updatedAt: new Date(),
    },
    update: {
      authorId,
      authorName,
      note,
      updatedAt: new Date(),
    },
    include: getDailyWorkNoteIncludes(),
  })

  return mapDailyWorkNoteRecord(savedNote)
}

export async function removeDailyWorkNotesDb(ids = []) {
  const normalizedIds = Array.from(
    new Set(
      (Array.isArray(ids) ? ids : [ids])
        .map(id => toPositiveInt(id, null))
        .filter(Boolean),
    ),
  )

  if (normalizedIds.length === 0) {
    return 0
  }

  const result = await prisma.dailyWorkNote.deleteMany({
    where: {
      id: { in: normalizedIds },
    },
  })

  return Number(result.count) || 0
}
