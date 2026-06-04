import { NextResponse } from 'next/server'
import {
  getWorkAssignmentByIdData,
  updateWorkAssignmentData,
} from '../../../../../lib/work-assignments.js'
import { canApproveHours } from '../../../../../lib/auth.js'
import { isFeatureEnabled } from '../../../../../lib/feature-flags.js'
import { getServerSession } from '../../../../../lib/server-session.js'
import { canAccessAssignment } from '../../../../../lib/work-assignment-policy.js'

export async function PUT(request, { params }) {
  try {
    if (!isFeatureEnabled('hoursApproval')) {
      return NextResponse.json({ error: 'A aprovacao de horas esta desativada.' }, { status: 503 })
    }

    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessão obrigatória.' }, { status: 401 })
    }

    if (!canApproveHours(session.role)) {
      return NextResponse.json(
        { error: 'Apenas administradores podem aprovar horas.' },
        { status: 403 },
      )
    }

    const { id } = await params
    const currentAssignment = await getWorkAssignmentByIdData(id)

    if (!currentAssignment) {
      return NextResponse.json({ error: 'Afetação não encontrada' }, { status: 404 })
    }

    if (!canAccessAssignment(session, currentAssignment)) {
      return NextResponse.json({ error: 'Sem permissão para esta afetação.' }, { status: 403 })
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
      return NextResponse.json({ error: 'Afetação não encontrada' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    const status = error.message.includes('não encontrado') ? 404 : 500
    return NextResponse.json({ error: error.message || 'Erro ao aprovar horas' }, { status })
  }
}
