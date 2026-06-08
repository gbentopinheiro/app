import { NextResponse } from 'next/server'
import { isFeatureEnabled } from '../../../../../lib/feature-flags.js'
import { hasPermission } from '../../../../../lib/permissions.js'
import { getServerSession } from '../../../../../lib/server-session.js'
import { canAccessAssignment } from '../../../../../lib/work-assignment-policy.js'
import {
  getWorkAssignmentByIdData,
  updateWorkAssignmentData,
} from '../../../../../lib/work-assignments.js'

export async function PUT(request, { params }) {
  try {
    if (!isFeatureEnabled('hoursApproval')) {
      return NextResponse.json({ error: 'A aprovacao de horas esta desativada.' }, { status: 503 })
    }

    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'work_assignments.approve')) {
      return NextResponse.json(
        { error: 'Apenas administradores podem aprovar horas.' },
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

    const body = await request.json()
    const { approvedHours } = body

    if (approvedHours === undefined || Number(approvedHours) < 0) {
      return NextResponse.json(
        { error: 'approvedHours tem de ser 0 ou maior' },
        { status: 400 },
      )
    }

    const assignment = await updateWorkAssignmentData(id, {
      approvedHours: Number(approvedHours),
      adminApprovedAt: new Date().toISOString(),
      adminApprovedBy: session.name || session.username || session.userId,
    }, {
      actorSession: session,
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Afetacao nao encontrada' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    const status = String(error.message || '').includes('nao encontrado') ? 404 : 500
    return NextResponse.json({ error: error.message || 'Erro ao aprovar horas' }, { status })
  }
}
