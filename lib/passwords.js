import { scryptSync, timingSafeEqual } from 'crypto'
import bcrypt from 'bcrypt'

const BCRYPT_ROUNDS = 12
const BCRYPT_MAX_BYTES = 72
const LEGACY_SCRYPT_PREFIX = 'scrypt$v1$'
const BCRYPT_PREFIXES = ['$2a$', '$2b$', '$2y$']

export function isBcryptPassword(value) {
  const password = String(value || '')
  return BCRYPT_PREFIXES.some(prefix => password.startsWith(prefix))
}

function isLegacyScryptPassword(value) {
  return String(value || '').startsWith(LEGACY_SCRYPT_PREFIX)
}

export function isHashedPassword(value) {
  return isBcryptPassword(value) || isLegacyScryptPassword(value)
}

export function getPasswordPolicyError(password) {
  const candidate = String(password || '')

  if (candidate.length < 12) {
    return 'A palavra-passe deve ter pelo menos 12 caracteres.'
  }

  if (Buffer.byteLength(candidate, 'utf8') > BCRYPT_MAX_BYTES) {
    return 'A palavra-passe não pode exceder 72 bytes.'
  }

  if (!/[A-Z]/.test(candidate)) {
    return 'A palavra-passe deve incluir pelo menos uma letra maiúscula.'
  }

  if (!/[0-9]/.test(candidate)) {
    return 'A palavra-passe deve incluir pelo menos um número.'
  }

  if (!/[^A-Za-z0-9]/.test(candidate)) {
    return 'A palavra-passe deve incluir pelo menos um carácter especial.'
  }

  return ''
}

export function hashPassword(password, options = {}) {
  const candidate = String(password || '')
  const { enforcePolicy = true } = options
  const policyError = enforcePolicy ? getPasswordPolicyError(candidate) : ''

  if (!candidate) {
    throw new Error('A palavra-passe é obrigatória.')
  }

  if (policyError) {
    throw new Error(policyError)
  }

  return bcrypt.hashSync(candidate, BCRYPT_ROUNDS)
}

export function hashPasswordIfNeeded(password, options = {}) {
  return isHashedPassword(password) ? String(password) : hashPassword(password, options)
}

export async function verifyPassword(password, storedPassword) {
  const candidate = String(password || '')
  const stored = String(storedPassword || '')

  if (!candidate || !stored) {
    return false
  }

  if (isBcryptPassword(stored)) {
    return bcrypt.compare(candidate, stored)
  }

  if (isLegacyScryptPassword(stored)) {
    const [, version, salt, expectedHash] = stored.split('$')

    if (version !== 'v1' || !salt || !expectedHash) {
      return false
    }

    const expectedBytes = Buffer.from(expectedHash, 'hex')
    const actualBytes = scryptSync(candidate, salt, expectedBytes.length)
    return expectedBytes.length === actualBytes.length && timingSafeEqual(expectedBytes, actualBytes)
  }

  const candidateBytes = Buffer.from(candidate)
  const storedBytes = Buffer.from(stored)
  return candidateBytes.length === storedBytes.length && timingSafeEqual(candidateBytes, storedBytes)
}
