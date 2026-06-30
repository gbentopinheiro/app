export const ROLE_ADMIN = 'admin'
export const ROLE_DEVELOPER = 'developer'
export const ROLE_RESPONSAVEL = 'responsavel'
export const ROLE_CHEF_PRIMEIRA = 'chef_primeira'
export const ROLE_CHEF_SEGUNDA = 'chef_segunda'
export const ROLE_CARPINTEIRO = 'carpinteiro'
export const ROLE_FERRAJEIRO = 'ferrajeiro'
export const ROLE_TROLHA = 'trolha'
export const ROLE_GRUISTA = 'gruista'
export const CHEF_CATEGORY_TROLHA = ROLE_TROLHA
export const CHEF_CATEGORY_FERRAJEIRO = ROLE_FERRAJEIRO
export const CHEF_CATEGORY_CARPINTEIRO = ROLE_CARPINTEIRO

const LEGACY_ROLE_WORKER = 'worker'
const LEGACY_ROLE_CHEF = 'chef'

export const WORKER_ROLE_VALUES = [ROLE_CARPINTEIRO, ROLE_FERRAJEIRO, ROLE_TROLHA, ROLE_GRUISTA]
export const CHEF_ROLE_VALUES = [ROLE_CHEF_PRIMEIRA, ROLE_CHEF_SEGUNDA]
export const CHEF_CATEGORY_VALUES = [CHEF_CATEGORY_TROLHA, CHEF_CATEGORY_FERRAJEIRO, CHEF_CATEGORY_CARPINTEIRO]

export const DEFAULT_ROLE = ROLE_CARPINTEIRO

export const ROLE_VALUES = [ROLE_DEVELOPER, ROLE_ADMIN, ROLE_RESPONSAVEL, ...CHEF_ROLE_VALUES, ...WORKER_ROLE_VALUES]

export const ROLE_LABELS = {
  [ROLE_DEVELOPER]: 'Programador',
  [ROLE_ADMIN]: 'Administrador',
  [ROLE_RESPONSAVEL]: 'Responsavel',
  [ROLE_CHEF_PRIMEIRA]: 'Chefe',
  [ROLE_CHEF_SEGUNDA]: 'Chefe de segunda',
  [ROLE_CARPINTEIRO]: 'Carpinteiro',
  [ROLE_FERRAJEIRO]: 'Ferrajeiro',
  [ROLE_TROLHA]: 'Trolha',
  [ROLE_GRUISTA]: 'Gruista',
}

export const CHEF_CATEGORY_LABELS = {
  [CHEF_CATEGORY_TROLHA]: 'Trolhas',
  [CHEF_CATEGORY_FERRAJEIRO]: 'Ferrajeiros',
  [CHEF_CATEGORY_CARPINTEIRO]: 'Carpinteiros',
}

export const CHEF_CATEGORY_ROLE_LABELS = {
  [CHEF_CATEGORY_TROLHA]: 'Chefe de Trolhas',
  [CHEF_CATEGORY_FERRAJEIRO]: 'Chefe de Ferrajeiros',
  [CHEF_CATEGORY_CARPINTEIRO]: 'Chefe de Carpinteiros',
}

export function isSupportedRole(role) {
  const normalizedRole = String(role || '').trim().toLowerCase()
  return ROLE_VALUES.includes(normalizedRole) || normalizedRole === LEGACY_ROLE_WORKER || normalizedRole === LEGACY_ROLE_CHEF
}

export function normalizeRole(role) {
  const normalizedRole = String(role || '').trim().toLowerCase()

  if (normalizedRole === LEGACY_ROLE_WORKER) {
    return DEFAULT_ROLE
  }

  if (normalizedRole === LEGACY_ROLE_CHEF) {
    return ROLE_CHEF_PRIMEIRA
  }

  return ROLE_VALUES.includes(normalizedRole) ? normalizedRole : DEFAULT_ROLE
}

export function getRoleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)] || ROLE_LABELS[DEFAULT_ROLE]
}

export function normalizeChefCategory(category) {
  const normalizedCategory = String(category || '').trim().toLowerCase()
  return CHEF_CATEGORY_VALUES.includes(normalizedCategory) ? normalizedCategory : null
}

export function getChefCategoryLabel(category) {
  return CHEF_CATEGORY_LABELS[normalizeChefCategory(category)] || ''
}

export function getChefCategoryRoleLabel(category) {
  return CHEF_CATEGORY_ROLE_LABELS[normalizeChefCategory(category)] || ''
}

export function roleSupportsChefCategory(role) {
  return normalizeRole(role) === ROLE_CHEF_SEGUNDA
}

export function getRoleDisplayLabel(role, chefCategory = null) {
  if (roleSupportsChefCategory(role)) {
    const chefCategoryRoleLabel = getChefCategoryRoleLabel(chefCategory)

    if (chefCategoryRoleLabel) {
      return chefCategoryRoleLabel
    }
  }

  return getRoleLabel(role)
}

export function getEntityRoleLabel(entity) {
  const role = entity?.person?.role || entity?.role || ''
  const chefCategory = entity?.person?.chefCategory ?? entity?.chefCategory ?? null

  if (!role) {
    return ''
  }

  return getRoleDisplayLabel(role, chefCategory)
}

export function isManagerRole(role) {
  const normalizedRole = normalizeRole(role)
  return normalizedRole === ROLE_ADMIN || normalizedRole === ROLE_RESPONSAVEL
}

export function roleUsesWorkScope(role) {
  return isChefRole(role)
}

export function isChefRole(role) {
  return CHEF_ROLE_VALUES.includes(normalizeRole(role))
}

export function isDeveloperRole(role) {
  return normalizeRole(role) === ROLE_DEVELOPER
}

export function isResponsavelRole(role) {
  return normalizeRole(role) === ROLE_RESPONSAVEL
}

export function isWorkerRole(role) {
  return WORKER_ROLE_VALUES.includes(normalizeRole(role))
}

export function roleCanHaveAppAccess(role) {
  return !isWorkerRole(role)
}

export function roleRequiresAppAccess(role) {
  const normalizedRole = normalizeRole(role)
  return normalizedRole === ROLE_DEVELOPER || normalizedRole === ROLE_ADMIN || normalizedRole === ROLE_RESPONSAVEL
}

export function canRoleSignIn(role) {
  return roleCanHaveAppAccess(role)
}
