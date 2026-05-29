import { getAllAccessIdentities } from './access-identities.js'
import { isChefRole } from './roles.js'

function isEligibleChefPreviewIdentity(identity) {
  return (
    identity?.person &&
    !identity.person.missing &&
    isChefRole(identity.role) &&
    Array.isArray(identity.works) &&
    identity.works.length > 0
  )
}

export function getChefPreviewIdentity(filters = {}) {
  const normalizedPersonId = Number(filters.personId)
  const normalizedUsername = String(filters.username || '')
    .trim()
    .toLowerCase()

  const identities = getAllAccessIdentities()
    .filter(isEligibleChefPreviewIdentity)
    .sort((left, right) => String(left.person?.name || '').localeCompare(String(right.person?.name || '')))

  if (Number.isInteger(normalizedPersonId) && normalizedPersonId > 0) {
    const matchedByPersonId = identities.find(identity => Number(identity.person?.id) === normalizedPersonId)

    if (matchedByPersonId) {
      return matchedByPersonId
    }
  }

  if (normalizedUsername) {
    const matchedByUsername = identities.find(identity => identity.username.toLowerCase() === normalizedUsername)

    if (matchedByUsername) {
      return matchedByUsername
    }
  }

  return identities[0] || null
}

export function buildChefPreviewSession(identity) {
  if (!identity) {
    return null
  }

  return {
    userId: Number(identity.id),
    personId: Number(identity.person.id),
    username: identity.username,
    name: identity.person.name || identity.username,
    role: identity.role,
    workIds: identity.works.map(work => Number(work.id)).filter(workId => Number.isInteger(workId) && workId > 0),
  }
}
