import { NextResponse } from 'next/server'
import { isFeatureEnabled } from '../../../../../lib/feature-flags.js'
import { hasPermission } from '../../../../../lib/permissions.js'
import { isChefRole } from '../../../../../lib/roles.js'
import { getServerSession } from '../../../../../lib/server-session.js'
import { canAccessAssignment } from '../../../../../lib/work-assignment-policy.js'
import {
  getWorkAssignmentByIdData,
  submitWorkAssignmentData,
} from '../../../../../lib/work-assignments.js'

export async function PATCH(request, { params }) {
  try {
    if (!isFeatureEnabled('hoursSubmission')) {
      return NextResponse.json({ error: 'A submissao de horas esta desativada.' }, { status: 503 })
    }

    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'work_assignments.submit')) {
      return NextResponse.json(
        { error: 'Apenas chefes podem submeter horas.' },
        { status: 403 },
      )
    }

    const { id } = await params
    const currentAssignment = await getWorkAssignmentByIdData(id)

    if (!currentAssignment) {
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    if (!canAccessAssignment(session, currentAssignment)) {
      return NextResponse.json({ error: 'Sem permissao para esta afetacao.' }, { status: 403 })
    }

    if (!isChefRole(session.role)) {
      return NextResponse.json(
        { error: 'Apenas chefes podem submeter horas.' },
        { status: 403 },
      )
    }

    if (currentAssignment.submitted) {
      return NextResponse.json(
        { error: 'Esta afetacao ja foi submetida e nao pode ser modificada.' },
        { status: 400 },
      )
    }

    const assignment = await submitWorkAssignmentData(id, session.name || session.id, {
      actorSession: session,
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    const status = String(error.message || '').includes('nao encontrado') ? 404 : 500
    return NextResponse.json({ error: error.message || 'Erro ao submeter horas' }, { status })
  }
}
