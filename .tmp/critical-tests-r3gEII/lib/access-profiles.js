import {
  ACCOUNT_TYPE_ADMIN,
  ACCOUNT_TYPE_DEVELOPER,
  normalizeAccountType,
} from './account-types.js'
import {
  ROLE_ADMIN,
  ROLE_DEVELOPER,
  ROLE_RESPONSAVEL,
  isChefRole,
  normalizeRole,
} from './roles.js'

export const ACCESS_PROFILE_ADMIN = 'admin'
export const ACCESS_PROFILE_DEVELOPER = 'developer'
export const ACCESS_PROFILE_RESPONSAVEL = 'responsavel'
export const ACCESS_PROFILE_CHEF = 'chef'
export const ACCESS_PROFILE_WORKER_NO_ACCESS = 'worker_no_access'

export const ACCESS_PROFILE_VALUES = Object.freeze([
  ACCESS_PROFILE_ADMIN,
  ACCESS_PROFILE_DEVELOPER,
  ACCESS_PROFILE_RESPONSAVEL,
  ACCESS_PROFILE_CHEF,
  ACCESS_PROFILE_WORKER_NO_ACCESS,
])

export const ACCESS_PROFILE_DEFINITIONS = Object.freeze([
  {
    key: ACCESS_PROFILE_ADMIN,
    name: 'Administrador',
    description: 'Perfil com acesso transversal a toda a operação da aplicação.',
  },
  {
    key: ACCESS_PROFILE_DEVELOPER,
    name: 'Programador',
    description: 'Perfil técnico para diagnóstico, auditoria, gestão interna e manutenção.',
  },
  {
    key: ACCESS_PROFILE_RESPONSAVEL,
    name: 'Responsável',
    description: 'Perfil intermédio para pessoas, calendário e notificações operacionais.',
  },
  {
    key: ACCESS_PROFILE_CHEF,
    name: 'Chefe',
    description: 'Perfil operacional para registo diário, notas e submissão de horas com âmbito por obra.',
  },
  {
    key: ACCESS_PROFILE_WORKER_NO_ACCESS,
    name: 'Sem acesso à app',
    description: 'Perfil de negócio sem acesso à aplicação.',
  },
])

const ACCESS_PROFILE_SET = new Set(ACCESS_PROFILE_VALUES)

export function normalizeAccessProfile(accessProfile, fallback = ACCESS_PROFILE_WORKER_NO_ACCESS) {
  const normalizedAccessProfile = String(accessProfile || '').trim().toLowerCase()
  return ACCESS_PROFILE_SET.has(normalizedAccessProfile) ? normalizedAccessProfile : fallback
}

export function resolveAccessProfileForRole(role) {
  const normalizedRole = normalizeRole(role)

  if (normalizedRole === ROLE_ADMIN) {
    return ACCESS_PROFILE_ADMIN
  }

  if (normalizedRole === ROLE_DEVELOPER) {
    return ACCESS_PROFILE_DEVELOPER
  }

  if (normalizedRole === ROLE_RESPONSAVEL) {
    return ACCESS_PROFILE_RESPONSAVEL
  }

  if (isChefRole(normalizedRole)) {
    return ACCESS_PROFILE_CHEF
  }

  return ACCESS_PROFILE_WORKER_NO_ACCESS
}

export function resolveAccessProfileForUser({ role, accountType } = {}) {
  const normalizedAccountType = normalizeAccountType(accountType, '')

  if (normalizedAccountType === ACCOUNT_TYPE_DEVELOPER) {
    return ACCESS_PROFILE_DEVELOPER
  }

  if (normalizedAccountType === ACCOUNT_TYPE_ADMIN) {
    return ACCESS_PROFILE_ADMIN
  }

  return resolveAccessProfileForRole(role)
}
