import {
  getAllAccessIdentitiesData,
  getAccessIdentityWorkOptionsData,
} from '../../lib/access-identities.js'

function hidePassword(identity) {
  const { password, ...safeIdentity } = identity
  return safeIdentity
}

export async function getAccessIdentitiesResponseService({ includeWorks = false } = {}) {
  const items = await getAllAccessIdentitiesData()
  const safeItems = items.map(hidePassword)

  if (!includeWorks) {
    return safeItems
  }

  return {
    items: safeItems,
    works: await getAccessIdentityWorkOptionsData(),
  }
}
