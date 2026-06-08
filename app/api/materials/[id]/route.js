import { NextResponse } from 'next/server'
import { deleteMaterial, getMaterialById, getMaterialByReference, updateMaterial } from '../../../../lib/materials.js'
import { hasPermission } from '../../../../lib/permissions.js'
import { getServerSession } from '../../../../lib/server-session.js'

function validateMaterialPayload(payload, currentMaterialId) {
  const name = String(payload?.name || '').trim()
  const reference = String(payload?.reference || '').trim()
  const quantity = Number(payload?.quantity ?? 0)
  const minimumQuantity = Number(payload?.minimumQuantity ?? 0)

  if (!name) {
    return 'O nome do material e obrigatorio.'
  }

  if (!Number.isFinite(quantity) || quantity < 0) {
    return 'A quantidade tem de ser um numero igual ou superior a zero.'
  }

  if (!Number.isFinite(minimumQuantity) || minimumQuantity < 0) {
    return 'O stock minimo tem de ser um numero igual ou superior a zero.'
  }

  if (reference) {
    const existingMaterial = getMaterialByReference(reference)

    if (existingMaterial && Number(existingMaterial.id) !== Number(currentMaterialId)) {
      return 'Ja existe um material com essa referencia.'
    }
  }

  return ''
}

async function requireMaterialsPermission(permissionKey) {
  const session = await getServerSession()

  if (!session) {
    return { error: NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 }) }
  }

  if (!hasPermission(session, permissionKey)) {
    return { error: NextResponse.json({ error: 'Sem permissao para gerir materiais.' }, { status: 403 }) }
  }

  return { session }
}

export async function GET(request, { params }) {
  try {
    const auth = await requireMaterialsPermission('materials.read')
    if (auth.error) return auth.error

    const { id } = await params
    const material = getMaterialById(id)

    if (!material) {
      return NextResponse.json({ error: 'Material nao encontrado.' }, { status: 404 })
    }

    return NextResponse.json(material)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter material.' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await requireMaterialsPermission('materials.update')
    if (auth.error) return auth.error

    const { id } = await params
    const body = await request.json()
    const validationError = validateMaterialPayload(body, id)

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const material = updateMaterial(id, {
      name: body.name,
      reference: body.reference,
      category: body.category,
      unit: body.unit,
      quantity: body.quantity,
      minimumQuantity: body.minimumQuantity,
      location: body.location,
      supplier: body.supplier,
      notes: body.notes,
    })

    if (!material) {
      return NextResponse.json({ error: 'Material nao encontrado.' }, { status: 404 })
    }

    return NextResponse.json(material)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar material.' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireMaterialsPermission('materials.delete')
    if (auth.error) return auth.error

    const { id } = await params
    const deleted = deleteMaterial(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Material nao encontrado.' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Material removido com sucesso.' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover material.' }, { status: 500 })
  }
}
