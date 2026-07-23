import { prisma } from '../prisma.js'
import {
  mapPersonRecord,
  mapWorkRecord,
  toPositiveInt,
} from './core-mappers.js'

function getWorkExtraAccessGrantIncludes() {
  return {
    person: true,
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

function normalizePositiveIntList(values = []) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [values])
        .map(value => toPositiveInt(value, null))
        .filter(value => Number.isInteger(value) && value > 0),
    ),
  )
}

function mapWorkExtraAccessGrantRecord(record) {
  if (!record) {
    return null
  }

  return {
    id: Number(record.id),
    personId: Number(record.personId),
    workId: Number(record.workId),
    createdAt: record.createdAt?.toISOString?.() || null,
    updatedAt: record.updatedAt?.toISOString?.() || null,
    person: record.person ? mapPersonRecord(record.person) : null,
    work: record.work ? mapWorkRecord(record.work) : null,
  }
}

export async function getAllWorkExtraAccessGrantsDb(filters = {}) {
  const personId = toPositiveInt(filters.personId, null)
  const workId = toPositiveInt(filters.workId, null)
  const personIds = normalizePositiveIntList(filters.personIds)
  const workIds = normalizePositiveIntList(filters.workIds)

  const grants = await prisma.workExtraAccessGrant.findMany({
    where: {
      ...(personId ? { personId } : {}),
      ...(workId ? { workId } : {}),
      ...(personIds.length > 0 ? { personId: { in: personIds } } : {}),
      ...(workIds.length > 0 ? { workId: { in: workIds } } : {}),
    },
    include: getWorkExtraAccessGrantIncludes(),
    orderBy: [{ personId: 'asc' }, { workId: 'asc' }, { id: 'asc' }],
  })

  return grants.map(mapWorkExtraAccessGrantRecord)
}

export async function replaceWorkExtraAccessSelectionsDb(selectionsByPersonId = {}) {
  const normalizedSelections = Object.fromEntries(
    Object.entries(selectionsByPersonId || {})
      .map(([personId, workIds]) => [
        toPositiveInt(personId, null),
        normalizePositiveIntList(workIds),
      ])
      .filter(([personId]) => Number.isInteger(personId) && personId > 0),
  )
  const personIds = Object.keys(normalizedSelections).map(value => Number(value))
  const nextGrants = personIds.flatMap(personId =>
    normalizedSelections[personId].map(workId => ({
      personId,
      workId,
    })),
  )

  await prisma.$transaction(async transaction => {
    if (personIds.length > 0) {
      await transaction.workExtraAccessGrant.deleteMany({
        where: {
          personId: {
            in: personIds,
          },
        },
      })
    }

    if (nextGrants.length > 0) {
      await transaction.workExtraAccessGrant.createMany({
        data: nextGrants,
        skipDuplicates: true,
      })
    }
  })

  if (personIds.length === 0) {
    return []
  }

  return getAllWorkExtraAccessGrantsDb({ personIds })
}
