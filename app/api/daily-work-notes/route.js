import { NextResponse } from 'next/server'
import { canManageEntireApp } from '../../../lib/auth.js'
import { buildChefPreviewSession, getChefPreviewIdentity } from '../../../lib/chef-preview.js'
import {
  getAllDailyWorkNotesData,
  removeDailyWorkNotesData,
  upsertDailyWorkNoteData,
} from '../../../lib/daily-work-notes.js'
import { isFeatureEnabled } from '../../../lib/feature-flags.js'
import { getServerSession } from '../../../lib/server-session.js'

function canAccessWork(session, workId) {
  if (!session) return false
  if (canManageEntireApp(session.role)) return true
  return session.workIds.includes(Number(workId))
}

async function resolvePreviewScopedSession(session, searchParams) {
  if (!session || !canManageEntireApp(session.role)) {
    return session
  }

  const previewPersonId = searchParams.get('previewPersonId')
  const previewChef = searchParams.get('previewChef')

  if (!previewPersonId && !previewChef) {
    return session
  }

  const previewIdentity = await getChefPreviewIdentity({
    personId: previewPersonId,
    username: previewChef,
  })

  return buildChefPreviewSession(previewIdentity) || session
}

function filterNotesForSession(notes, session) {
  if (!session) return []

  return notes.filter(note => {
    if (!canAccessWork(session, note.workId)) return false
    return true
  })
}

export async function GET(request) {
  try {
    if (!isFeatureEnabled('dailyWorkNotes')) {
      return NextResponse.json({ error: 'As notas diarias da obra estao desativadas.' }, { status: 503 })
    }

    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessão obrigatória.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scopedSession = await resolvePreviewScopedSession(session, searchParams)
    const filters = {
      date: searchParams.get('date'),
      workId: searchParams.get('workId'),
    }

    const notes = filterNotesForSession(await getAllDailyWorkNotesData(filters), scopedSession)
    return NextResponse.json(notes)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter notas.' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    if (!isFeatureEnabled('dailyWorkNotes')) {
      return NextResponse.json({ error: 'As notas diarias da obra estao desativadas.' }, { status: 503 })
    }

    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessão obrigatória.' }, { status: 401 })
    }

    const body = await request.json()
    const workId = Number(body.workId)

    if (!canAccessWork(session, workId)) {
      return NextResponse.json({ error: 'Sem permissão para esta obra.' }, { status: 403 })
    }

    const note = await upsertDailyWorkNoteData({
      date: body.date,
      workId,
      note: body.note,
      authorId: session.personId || session.userId,
      authorName: session.name,
    })

    return NextResponse.json(note)
  } catch (error) {
    const status = error.message?.includes('obrigatória') ? 400 : 500
    return NextResponse.json({ error: error.message || 'Erro ao guardar nota.' }, { status })
  }
}

export async function DELETE(request) {
  try {
    if (!isFeatureEnabled('dailyWorkNotes')) {
      return NextResponse.json({ error: 'As notas diarias da obra estao desativadas.' }, { status: 503 })
    }

    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'SessÃ£o obrigatÃ³ria.' }, { status: 401 })
    }

    if (!canManageEntireApp(session.role)) {
      return NextResponse.json({ error: 'Sem permissÃ£o para remover notas.' }, { status: 403 })
    }

    const body = await request.json()
    const ids = Array.isArray(body?.ids) ? body.ids : []
    const removedCount = await removeDailyWorkNotesData(ids)

    return NextResponse.json({ removedCount })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover notas.' }, { status: 500 })
  }
}
