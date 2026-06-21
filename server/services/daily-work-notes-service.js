import {
  getAllDailyWorkNotesData,
  removeDailyWorkNotesData,
  upsertDailyWorkNoteData,
} from '../../lib/daily-work-notes.js'
import { isFeatureEnabled } from '../../lib/feature-flags.js'
import { hasPermission } from '../../lib/permissions.js'
import {
  canAccessWork,
  resolvePreviewScopedSession,
} from '../../lib/work-assignment-policy.js'
import { HttpError } from '../errors/http-error.js'

async function ensureDailyWorkNotesPermission(session, permissionKey, message) {
  if (!(await isFeatureEnabled('dailyWorkNotes'))) {
    throw new HttpError(503, 'As notas diarias da obra estao desativadas.')
  }

  if (!session) {
    throw new HttpError(401, 'Sessao obrigatoria.')
  }

  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, message)
  }
}

function filterNotesForSession(notes, session) {
  if (!session) {
    return []
  }

  return notes.filter(note => canAccessWork(session, note.workId))
}

export async function getDailyWorkNotesService(session, searchParams) {
  await ensureDailyWorkNotesPermission(session, 'daily_work_notes.read', 'Sem permissao para consultar notas.')

  const scopedSession = await resolvePreviewScopedSession(session, searchParams)
  const scopedFilters = {
    date: searchParams.get('date'),
    workId: searchParams.get('workId'),
  }

  return filterNotesForSession(await getAllDailyWorkNotesData(scopedFilters), scopedSession)
}

export async function upsertDailyWorkNoteService(session, body) {
  await ensureDailyWorkNotesPermission(session, 'daily_work_notes.write', 'Sem permissao para guardar notas.')

  const workId = Number(body?.workId)

  if (!canAccessWork(session, workId)) {
    throw new HttpError(403, 'Sem permissao para esta obra.')
  }

  return upsertDailyWorkNoteData({
    date: body?.date,
    workId,
    note: body?.note,
    authorId: session.personId || session.userId,
    authorName: session.name,
  })
}

export async function deleteDailyWorkNotesService(session, body) {
  await ensureDailyWorkNotesPermission(session, 'daily_work_notes.delete', 'Sem permissao para remover notas.')

  const ids = Array.isArray(body?.ids) ? body.ids : []
  return {
    removedCount: await removeDailyWorkNotesData(ids),
  }
}
