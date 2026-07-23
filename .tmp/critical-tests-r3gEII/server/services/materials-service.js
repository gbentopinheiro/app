import {
  createMaterialData,
  deleteMaterialData,
  getAllMaterialsData,
  getMaterialByIdData,
  getMaterialByReferenceData,
  updateMaterialData,
} from '../../lib/materials.js'
import { hasPermission } from '../../lib/permissions.js'
import { HttpError } from '../errors/http-error.js'

function ensurePermission(session, permissionKey, message = 'Sem permissao para gerir materiais.') {
  if (!hasPermission(session, permissionKey)) {
    throw new HttpError(403, message)
  }
}

async function validateMaterialPayload(payload, currentMaterialId = null) {
  const name = String(payload?.name || '').trim()
  const reference = String(payload?.reference || '').trim()
  const quantity = Number(payload?.quantity ?? 0)
  const minimumQuantity = Number(payload?.minimumQuantity ?? 0)

  if (!name) {
    throw new HttpError(400, 'O nome do material e obrigatorio.')
  }

  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new HttpError(400, 'A quantidade tem de ser um numero igual ou superior a zero.')
  }

  if (!Number.isFinite(minimumQuantity) || minimumQuantity < 0) {
    throw new HttpError(400, 'O stock minimo tem de ser um numero igual ou superior a zero.')
  }

  if (reference) {
    const existingMaterial = await getMaterialByReferenceData(reference)

    if (existingMaterial && Number(existingMaterial.id) !== Number(currentMaterialId)) {
      throw new HttpError(400, 'Ja existe um material com essa referencia.')
    }
  }
}

export async function getMaterialsListService(session) {
  ensurePermission(session, 'materials.read')
  return getAllMaterialsData()
}

export async function createMaterialService(session, body) {
  ensurePermission(session, 'materials.create')
  await validateMaterialPayload(body)

  try {
    return await createMaterialData({
      name: body?.name,
      reference: body?.reference,
      category: body?.category,
      unit: body?.unit,
      quantity: body?.quantity,
      minimumQuantity: body?.minimumQuantity,
      location: body?.location,
      supplier: body?.supplier,
      notes: body?.notes,
    })
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw error
  }
}

export async function getMaterialByIdService(session, id) {
  ensurePermission(session, 'materials.read')

  const material = await getMaterialByIdData(id)

  if (!material) {
    throw new HttpError(404, 'Material nao encontrado.')
  }

  return material
}

export async function updateMaterialService(session, id, body) {
  ensurePermission(session, 'materials.update')
  await validateMaterialPayload(body, id)

  try {
    const material = await updateMaterialData(id, {
      name: body?.name,
      reference: body?.reference,
      category: body?.category,
      unit: body?.unit,
      quantity: body?.quantity,
      minimumQuantity: body?.minimumQuantity,
      location: body?.location,
      supplier: body?.supplier,
      notes: body?.notes,
    })

    if (!material) {
      throw new HttpError(404, 'Material nao encontrado.')
    }

    return material
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    throw error
  }
}

export async function deleteMaterialService(session, id) {
  ensurePermission(session, 'materials.delete')

  const deleted = await deleteMaterialData(id)

  if (!deleted) {
    throw new HttpError(404, 'Material nao encontrado.')
  }

  return { message: 'Material removido com sucesso.' }
}
