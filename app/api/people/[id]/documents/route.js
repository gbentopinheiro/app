import { NextResponse } from 'next/server'
import {
  createPersonDocumentReminder,
  getPersonDocumentReminders,
} from '../../../../../lib/person-document-reminders.js'
import { getPersonByIdData } from '../../../../../lib/people.js'
import { hasPermission } from '../../../../../lib/permissions.js'
import { getServerSession } from '../../../../../lib/server-session.js'

function getErrorStatus(error) {
  const message = String(error?.message || '')

  if (message.includes('obrigatorio') || message.includes('valida') || message.includes('valido')) {
    return 400
  }

  if (message.includes('nao encontrada')) {
    return 404
  }

  return 500
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'people.documents.read')) {
      return NextResponse.json({ error: 'Sem permissao para consultar documentos.' }, { status: 403 })
    }

    const { id } = await params
    const person = await getPersonByIdData(id)

    if (!person) {
      return NextResponse.json({ error: 'Pessoa nao encontrada.' }, { status: 404 })
    }

    return NextResponse.json(getPersonDocumentReminders(id))
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter documentos.' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'people.documents.write')) {
      return NextResponse.json({ error: 'Sem permissao para criar documentos.' }, { status: 403 })
    }

    const { id } = await params
    const person = await getPersonByIdData(id)

    if (!person) {
      return NextResponse.json({ error: 'Pessoa nao encontrada.' }, { status: 404 })
    }

    const body = await request.json()
    const documentReminder = createPersonDocumentReminder(id, body)

    return NextResponse.json(documentReminder, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar documento.' },
      { status: getErrorStatus(error) },
    )
  }
}
