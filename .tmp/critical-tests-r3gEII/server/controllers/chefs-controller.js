import { NextResponse } from 'next/server'
import { readProtectedRequestJson } from '../../lib/login-transport.js'
import {
  createLegacyChefService,
  deleteLegacyChefService,
  getLegacyChefByIdService,
  getLegacyChefsService,
  updateLegacyChefService,
} from '../services/chefs-service.js'

function isProtectedRequestError(error) {
  const message = String(error?.message || '')
  return message.includes('protecao') || message.includes('protegido')
}

function getLegacyChefMutationStatus(error) {
  const message = String(error?.message || '')

  if (
    message.includes('obrigat') ||
    message.includes('palavra-passe') ||
    message.includes('palavra') ||
    message.includes('caract') ||
    message.includes('bytes') ||
    message.includes('Ja existe') ||
    message.includes('J\u00e1 existe') ||
    message.includes('role')
  ) {
    return 400
  }

  if (
    message.includes('nao encontrada') ||
    message.includes('n\u00e3o encontrada') ||
    message.includes('não encontrada') ||
    message.includes('não encontrada')
  ) {
    return 404
  }

  return 500
}

function toLegacyChefMutationErrorResponse(error, fallbackMessage) {
  if (isProtectedRequestError(error)) {
    return NextResponse.json(
      { error: 'Pedido sens\u00edvel n\u00e3o protegido.' },
      { status: 400 },
    )
  }

  return NextResponse.json(
    { error: error?.message || fallbackMessage },
    { status: getLegacyChefMutationStatus(error) },
  )
}

export async function getLegacyChefsController(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeWorks = searchParams.get('includeWorks') === 'true'

    return NextResponse.json(await getLegacyChefsService({ includeWorks }))
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter identidades' }, { status: 500 })
  }
}

export async function createLegacyChefController(request) {
  try {
    const body = await readProtectedRequestJson(request)
    const identity = await createLegacyChefService(body)
    return NextResponse.json(identity, { status: 201 })
  } catch (error) {
    return toLegacyChefMutationErrorResponse(error, 'Erro ao criar identidade')
  }
}

export async function getLegacyChefController(id) {
  try {
    const identity = await getLegacyChefByIdService(id)

    if (!identity) {
      return NextResponse.json({ error: 'Identidade n\u00e3o encontrada' }, { status: 404 })
    }

    return NextResponse.json(identity)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter identidade' }, { status: 500 })
  }
}

export async function updateLegacyChefController(request, id) {
  try {
    const body = await readProtectedRequestJson(request)
    const identity = await updateLegacyChefService(id, body)

    if (!identity) {
      return NextResponse.json({ error: 'Identidade n\u00e3o encontrada' }, { status: 404 })
    }

    return NextResponse.json(identity)
  } catch (error) {
    return toLegacyChefMutationErrorResponse(error, 'Erro ao atualizar identidade')
  }
}

export async function deleteLegacyChefController(id) {
  try {
    const deleted = await deleteLegacyChefService(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Identidade n\u00e3o encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Identidade removida com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover identidade' }, { status: 500 })
  }
}
