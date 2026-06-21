import { NextResponse } from 'next/server'
import {
  classifyDeveloperOverrideError,
} from '../../lib/developer-override-events.js'
import { isHttpError } from '../errors/http-error.js'
import {
  auditDeveloperWorkAssignmentOverrideFailure,
  createDeveloperOverrideWorkAssignmentService,
  deleteDeveloperOverrideWorkAssignmentService,
  getDeveloperOverrideWorkAssignmentService,
  normalizeDeveloperWorkAssignmentOverrideReason,
  readDeveloperWorkAssignmentOverrideBody,
  recordDeveloperWorkAssignmentOverrideSuccess,
  updateDeveloperOverrideWorkAssignmentService,
} from '../services/developer-work-assignments-overrides-service.js'
import { getCurrentSessionService } from '../services/session-service.js'

function toOverrideErrorResponse(error, fallbackMessage) {
  if (isHttpError(error)) {
    return {
      status: error.status,
      message: error.message,
    }
  }

  return classifyDeveloperOverrideError(error, fallbackMessage)
}

function resolveCreateFailureTargetDate(error, context) {
  if (
    isHttpError(error) &&
    (
      error.message === 'Sessao de developer obrigatoria.' ||
      error.message === 'Sem permissao para override tecnico de afetacoes.' ||
      error.message === 'reason e obrigatorio.'
    )
  ) {
    return context.bodyDate || null
  }

  return context.targetDate
}

export async function createDeveloperWorkAssignmentOverrideController(request) {
  let session = null
  const context = {
    reason: '',
    bodyDate: null,
    targetDate: null,
  }

  try {
    session = await getCurrentSessionService()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    const body = await readDeveloperWorkAssignmentOverrideBody(request)
    context.reason = normalizeDeveloperWorkAssignmentOverrideReason(body.reason)
    context.bodyDate = body?.date || null

    const assignment = await createDeveloperOverrideWorkAssignmentService(session, body, context)
    const auditEvent = await recordDeveloperWorkAssignmentOverrideSuccess({
      session,
      action: 'create',
      reason: context.reason,
      entityId: assignment?.id || null,
      targetDate: context.targetDate,
      beforeState: null,
      afterState: assignment,
    })

    return NextResponse.json(
      {
        item: assignment,
        message: 'Afetacao criada com override tecnico do bloqueio diario.',
        overrideEventId: auditEvent?.id || null,
      },
      { status: 201 },
    )
  } catch (error) {
    const resolvedError = toOverrideErrorResponse(
      error,
      'Erro ao criar afetacao com override tecnico.',
    )

    await auditDeveloperWorkAssignmentOverrideFailure({
      session,
      action: 'create',
      reason: context.reason,
      entityId: null,
      targetDate: resolveCreateFailureTargetDate(error, context),
      beforeState: null,
      errorMessage: resolvedError.message,
    })

    return NextResponse.json({ error: resolvedError.message }, { status: resolvedError.status })
  }
}

export async function getDeveloperWorkAssignmentOverrideController(id) {
  try {
    const session = await getCurrentSessionService()
    const assignment = await getDeveloperOverrideWorkAssignmentService(session, id)

    return NextResponse.json({ item: assignment })
  } catch (error) {
    const resolvedError = toOverrideErrorResponse(
      error,
      'Erro ao carregar afetacao para override tecnico.',
    )

    return NextResponse.json({ error: resolvedError.message }, { status: resolvedError.status })
  }
}

export async function updateDeveloperWorkAssignmentOverrideController(request, id) {
  let session = null
  const context = {
    reason: '',
    entityId: null,
    beforeState: null,
    targetDate: null,
  }

  try {
    session = await getCurrentSessionService()
    const body = await readDeveloperWorkAssignmentOverrideBody(request)
    context.reason = normalizeDeveloperWorkAssignmentOverrideReason(body.reason)

    const assignment = await updateDeveloperOverrideWorkAssignmentService(session, id, body, context)
    const auditEvent = await recordDeveloperWorkAssignmentOverrideSuccess({
      session,
      action: 'update',
      reason: context.reason,
      entityId: assignment.id,
      targetDate: assignment.date || context.targetDate,
      beforeState: context.beforeState,
      afterState: assignment,
    })

    return NextResponse.json({
      item: assignment,
      message: 'Afetacao atualizada com override tecnico do bloqueio diario.',
      overrideEventId: auditEvent?.id || null,
    })
  } catch (error) {
    const resolvedError = toOverrideErrorResponse(
      error,
      'Erro ao atualizar afetacao com override tecnico.',
    )

    await auditDeveloperWorkAssignmentOverrideFailure({
      session,
      action: 'update',
      reason: context.reason,
      entityId: context.entityId,
      targetDate: context.targetDate,
      beforeState: context.beforeState,
      errorMessage: resolvedError.message,
    })

    return NextResponse.json({ error: resolvedError.message }, { status: resolvedError.status })
  }
}

export async function deleteDeveloperWorkAssignmentOverrideController(request, id) {
  let session = null
  const context = {
    reason: '',
    entityId: null,
    beforeState: null,
    targetDate: null,
  }

  try {
    session = await getCurrentSessionService()
    const body = await readDeveloperWorkAssignmentOverrideBody(request)
    context.reason = normalizeDeveloperWorkAssignmentOverrideReason(body.reason)

    const payload = await deleteDeveloperOverrideWorkAssignmentService(session, id, context)
    const auditEvent = await recordDeveloperWorkAssignmentOverrideSuccess({
      session,
      action: 'delete',
      reason: context.reason,
      entityId: context.entityId,
      targetDate: context.targetDate,
      beforeState: context.beforeState,
      afterState: null,
    })

    return NextResponse.json({
      ...payload,
      overrideEventId: auditEvent?.id || null,
    })
  } catch (error) {
    const resolvedError = toOverrideErrorResponse(
      error,
      'Erro ao remover afetacao com override tecnico.',
    )

    await auditDeveloperWorkAssignmentOverrideFailure({
      session,
      action: 'delete',
      reason: context.reason,
      entityId: context.entityId,
      targetDate: context.targetDate,
      beforeState: context.beforeState,
      errorMessage: resolvedError.message,
    })

    return NextResponse.json({ error: resolvedError.message }, { status: resolvedError.status })
  }
}
