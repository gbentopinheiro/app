export const ROLE_ADMIN = 'admin'
export const ROLE_RESPONSAVEL = 'responsavel'
export const ROLE_CHEF = 'chef'
export const ROLE_CARPINTEIRO = 'carpinteiro'
export const ROLE_FERRAJEIRO = 'ferrajeiro'
export const ROLE_TROLHA = 'trolha'
export const ROLE_GRUISTA = 'gruista'

const LEGACY_ROLE_WORKER = 'worker'

export const WORKER_ROLE_VALUES = [ROLE_CARPINTEIRO, ROLE_FERRAJEIRO, ROLE_TROLHA, ROLE_GRUISTA]

export const DEFAULT_ROLE = ROLE_CARPINTEIRO

export const ROLE_VALUES = [ROLE_ADMIN, ROLE_RESPONSAVEL, ROLE_CHEF, ...WORKER_ROLE_VALUES]

export const ROLE_LABELS = {
  [ROLE_ADMIN]: 'Administrador',
  [ROLE_RESPONSAVEL]: 'Responsável',
  [ROLE_CHEF]: 'Chefe',
  [ROLE_CARPINTEIRO]: 'Carpinteiro',
  [ROLE_FERRAJEIRO]: 'Ferrajeiro',
  [ROLE_TROLHA]: 'Trolha',
  [ROLE_GRUISTA]: 'Gruista',
}

export function isSupportedRole(role) {
  const normalizedRole = String(role || '').trim().toLowerCase()
  return ROLE_VALUES.includes(normalizedRole) || normalizedRole === LEGACY_ROLE_WORKER
}

export function normalizeRole(role) {
  const normalizedRole = String(role || '').trim().toLowerCase()

  if (normalizedRole === LEGACY_ROLE_WORKER) {
    return DEFAULT_ROLE
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
  return normalizeRole(role) === ROLE_CHEF
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
