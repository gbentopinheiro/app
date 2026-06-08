import { NextResponse } from 'next/server'
import { deletePersonDocumentReminder } from '../../../../../../lib/person-document-reminders.js'
import { getPersonByIdData } from '../../../../../../lib/people.js'
import { hasPermission } from '../../../../../../lib/permissions.js'
import { getServerSession } from '../../../../../../lib/server-session.js'

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'people.documents.delete')) {
      return NextResponse.json({ error: 'Sem permissao para remover documentos.' }, { status: 403 })
    }

    const { id, documentId } = await params
    const person = await getPersonByIdData(id)

    if (!person) {
      return NextResponse.json({ error: 'Pessoa nao encontrada.' }, { status: 404 })
    }

    const deleted = deletePersonDocumentReminder(id, documentId)

    if (!deleted) {
      return NextResponse.json({ error: 'Documento nao encontrado.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Documento removido com sucesso.' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover documento.' }, { status: 500 })
  }
}
