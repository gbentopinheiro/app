import {
  createAccessIdentity,
  deleteAccessIdentity,
  deleteAccessIdentityByPersonId,
  getAccessIdentityById,
  getAccessIdentityByPersonId,
  getAccessIdentityByUsername,
  getAccessIdentityWorkOptions,
  getAllAccessIdentities,
  pruneAccessIdentitiesByValidPersonIds,
  updateAccessIdentity,
} from './access-identities.js'
import { ROLE_CHEF_PRIMEIRA, isChefRole } from './roles.js'

function asChefIdentity(identity) {
  return isChefRole(identity?.role) ? identity : null
}

export function getAllChefs() {
  return getAllAccessIdentities().filter(identity => isChefRole(identity.role))
}

export function getChefById(id) {
  return asChefIdentity(getAccessIdentityById(id))
}

export function getChefByUsername(username) {
  return asChefIdentity(getAccessIdentityByUsername(username))
}

export function getChefByPersonId(personId) {
  return asChefIdentity(getAccessIdentityByPersonId(personId))
}

export function createChef(data) {
  return createAccessIdentity({ ...data, role: ROLE_CHEF_PRIMEIRA })
}

export function updateChef(id, data) {
  if (!getChefById(id)) {
    return null
  }

  return updateAccessIdentity(id, { ...data, role: ROLE_CHEF_PRIMEIRA })
}

export function deleteChef(id) {
  if (!getChefById(id)) {
    return false
  }

  return deleteAccessIdentity(id)
}

export function deleteChefByPersonId(personId) {
  if (!getChefByPersonId(personId)) {
    return false
  }

  return deleteAccessIdentityByPersonId(personId)
}

export function pruneChefsByValidPersonIds(validPersonIds) {
  return pruneAccessIdentitiesByValidPersonIds(validPersonIds).filter(identity => isChefRole(identity.role))
}

export function getChefWorkOptions() {
  return getAccessIdentityWorkOptions()
}
