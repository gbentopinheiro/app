export const ROLE_ADMIN = 'admin'
export const ROLE_DEVELOPER = 'developer'
export const ROLE_RESPONSAVEL = 'responsavel'
export const ROLE_CHEF_PRIMEIRA = 'chef_primeira'
export const ROLE_CHEF_SEGUNDA = 'chef_segunda'
export const ROLE_CARPINTEIRO = 'carpinteiro'
export const ROLE_FERRAJEIRO = 'ferrajeiro'
export const ROLE_TROLHA = 'trolha'
export const ROLE_GRUISTA = 'gruista'

const LEGACY_ROLE_WORKER = 'worker'
const LEGACY_ROLE_CHEF = 'chef'

export const WORKER_ROLE_VALUES = [ROLE_CARPINTEIRO, ROLE_FERRAJEIRO, ROLE_TROLHA, ROLE_GRUISTA]
export const CHEF_ROLE_VALUES = [ROLE_CHEF_PRIMEIRA, ROLE_CHEF_SEGUNDA]

export const DEFAULT_ROLE = ROLE_CARPINTEIRO

export const ROLE_VALUES = [ROLE_DEVELOPER, ROLE_ADMIN, ROLE_RESPONSAVEL, ...CHEF_ROLE_VALUES, ...WORKER_ROLE_VALUES]

export const ROLE_LABELS = {
  [ROLE_DEVELOPER]: 'Programador',
  [ROLE_ADMIN]: 'Administrador',
  [ROLE_RESPONSAVEL]: 'Responsavel',
  [ROLE_CHEF_PRIMEIRA]: 'Chefe de primeira',
  [ROLE_CHEF_SEGUNDA]: 'Chefe de segunda',
  [ROLE_CARPINTEIRO]: 'Carpinteiro',
  [ROLE_FERRAJEIRO]: 'Ferrajeiro',
  [ROLE_TROLHA]: 'Trolha',
  [ROLE_GRUISTA]: 'Gruista',
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

export function roleRequiresAppAccess(role) {
  return !isWorkerRole(role)
}

export function canRoleSignIn(role) {
  return roleRequiresAppAccess(role)
}
