import {
  createChefData,
  deleteChefData,
  getAllChefsData,
  getChefByIdData,
  getChefWorkOptionsData,
  updateChefData,
} from '../../lib/chefs.js'

function hidePassword(identity) {
  const { password, ...safeIdentity } = identity
  return safeIdentity
}

export async function getLegacyChefsService({ includeWorks = false } = {}) {
  const chefs = await getAllChefsData()
  const items = chefs.map(hidePassword)

  if (!includeWorks) {
    return items
  }

  return {
    items,
    works: await getChefWorkOptionsData(),
  }
}

export async function createLegacyChefService(body) {
  const identity = await createChefData({
    personId: body?.personId,
    username: body?.username,
    password: body?.password,
    works: body?.works,
  })

  return hidePassword(identity)
}

export async function getLegacyChefByIdService(id) {
  const identity = await getChefByIdData(id)
  return identity ? hidePassword(identity) : null
}

export async function updateLegacyChefService(id, body) {
  const identity = await updateChefData(id, {
    personId: body?.personId,
    username: body?.username,
    password: body?.password,
    works: body?.works,
  })

  return identity ? hidePassword(identity) : null
}

export async function deleteLegacyChefService(id) {
  return deleteChefData(id)
}
