import {
  createAccessIdentityData,
  deleteAccessIdentityByPersonIdData,
  deleteAccessIdentityData,
  getAccessIdentityByIdData,
  getAccessIdentityByPersonIdData,
  getAccessIdentityByUsernameData,
  getAccessIdentityWorkOptionsData,
  getAllAccessIdentitiesData,
  pruneAccessIdentitiesByValidPersonIdsData,
  updateAccessIdentityData,
} from './access-identities.js'
import { ROLE_CHEF_PRIMEIRA, isChefRole } from './roles.js'

function asChefIdentity(identity) {
  return isChefRole(identity?.role) ? identity : null
}

export async function getAllChefsData() {
  return (await getAllAccessIdentitiesData()).filter(identity => isChefRole(identity.role))
}

export async function getChefByIdData(id) {
  return asChefIdentity(await getAccessIdentityByIdData(id))
}

export async function getChefByUsernameData(username) {
  return asChefIdentity(await getAccessIdentityByUsernameData(username))
}

export async function getChefByPersonIdData(personId) {
  return asChefIdentity(await getAccessIdentityByPersonIdData(personId))
}

export async function createChefData(data) {
  return createAccessIdentityData({ ...data, role: ROLE_CHEF_PRIMEIRA })
}

export async function updateChefData(id, data) {
  if (!(await getChefByIdData(id))) {
    return null
  }

  return updateAccessIdentityData(id, { ...data, role: ROLE_CHEF_PRIMEIRA })
}

export async function deleteChefData(id) {
  if (!(await getChefByIdData(id))) {
    return false
  }

  return deleteAccessIdentityData(id)
}

export async function deleteChefByPersonIdData(personId) {
  if (!(await getChefByPersonIdData(personId))) {
    return false
  }

  return deleteAccessIdentityByPersonIdData(personId)
}

export async function pruneChefsByValidPersonIdsData(validPersonIds) {
  return (await pruneAccessIdentitiesByValidPersonIdsData(validPersonIds)).filter(identity => isChefRole(identity.role))
}

export async function getChefWorkOptionsData() {
  return getAccessIdentityWorkOptionsData()
}
