import { NextResponse } from 'next/server'
import { getWorkAssignmentById, submitWorkAssignment } from '../../../../../lib/work-assignments.js'
import { canManageEntireApp } from '../../../../../lib/auth.js'
import { getServerSession } from '../../../../../lib/server-session.js'
import { ROLE_CHEF } from '../../../../../lib/roles.js'

function canAccessAssignment(session, assignment) {
  if (!session || !assignment) return false
  if (canManageEntireApp(session.role)) return true
  return session.workIds.includes(Number(assignment.workId))
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessão obrigatória.' }, { status: 401 })
    }

    const { id } = await params
    const currentAssignment = getWorkAssignmentById(id)

    if (!currentAssignment) {
      return NextResponse.json({ error: 'Afetação não encontrada' }, { status: 404 })
    }

    if (!canAccessAssignment(session, currentAssignment)) {
      return NextResponse.json({ error: 'Sem permissão para esta afetação.' }, { status: 403 })
    }

    if (session.role !== ROLE_CHEF) {
      return NextResponse.json(
        { error: 'Apenas chefes podem submeter horas.' },
        { status: 403 },
      )
    }

    if (currentAssignment.submitted) {
      return NextResponse.json(
        { error: 'Esta afetação já foi submetida e não pode ser modificada.' },
        { status: 400 },
      )
    }

    const assignment = submitWorkAssignment(id, session.name || session.id)

    if (!assignment) {
      return NextResponse.json({ error: 'Afetação não encontrada' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    const status = error.message.includes('não encontrado') ? 404 : 500
    return NextResponse.json({ error: error.message || 'Erro ao submeter horas' }, { status })
  }
}
