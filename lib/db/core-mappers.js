import { normalizeRole } from '../roles.js'

const VALID_WORK_STATUSES = new Set(['planned', 'in_progress', 'paused', 'completed'])
const VALID_WORKING_DAYS = new Set([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])
const DEFAULT_WORKING_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

export function toPositiveInt(value, fallback = null) {
  const parsedValue = Number.parseInt(value, 10)
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback
}

export function toNumber(value, fallback = 0) {
  const parsedValue = Number.parseFloat(value)
  return Number.isFinite(parsedValue) ? Number(parsedValue) : fallback
}

export function toOptionalString(value) {
  const normalizedValue = String(value || '').trim()
  return normalizedValue || null
}

export function toRequiredString(value, fallback = '') {
  return String(value ?? fallback).trim()
}

export function toDateOnlyString(value) {
  if (!value) {
    return null
  }

  const candidate = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(candidate.getTime())) {
    return null
  }

  return candidate.toISOString().slice(0, 10)
}

export function toDateOnlyValue(value) {
  const dateOnlyString = toDateOnlyString(value)
  return dateOnlyString ? new Date(`${dateOnlyString}T00:00:00.000Z`) : null
}

export function toDateTimeString(value) {
  if (!value) {
    return null
  }

  const candidate = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(candidate.getTime())) {
    return null
  }

  return candidate.toISOString()
}

export function normalizeWorkStatus(value, fallback = 'planned') {
  const normalizedValue = String(value || '').trim().toLowerCase()
  return VALID_WORK_STATUSES.has(normalizedValue) ? normalizedValue : fallback
}

export function normalizeWorkingDays(value) {
  if (!Array.isArray(value)) {
    return [...DEFAULT_WORKING_DAYS]
  }

  const normalizedDays = Array.from(
    new Set(
      value
        .map(day => String(day || '').trim().toLowerCase())
        .filter(day => VALID_WORKING_DAYS.has(day)),
    ),
  )

  return normalizedDays.length > 0 ? normalizedDays : [...DEFAULT_WORKING_DAYS]
}

export function normalizeRoleHourlyCosts(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([role, hourlyCost]) => [normalizeRole(role), toNumber(hourlyCost, Number.NaN)])
      .filter(([role, hourlyCost]) => role && Number.isFinite(hourlyCost) && hourlyCost >= 0),
  )
}

export function normalizeSpecialPersonHourlyCosts(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([personId, hourlyCost]) => [String(toPositiveInt(personId) || ''), toNumber(hourlyCost, Number.NaN)])
      .filter(([personId, hourlyCost]) => personId && Number.isFinite(hourlyCost) && hourlyCost >= 0),
  )
}

export function slugifyCompanyName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function mapCompanyRecord(record) {
  if (!record) {
    return null
  }

  return {
    id: Number(record.id),
    holdingId: Number(record.holdingId),
    name: toRequiredString(record.name),
    slug: toRequiredString(record.slug),
    countryCode: toRequiredString(record.countryCode || 'PT').toUpperCase(),
    documentMark: toRequiredString(record.documentMark),
    documentLabel: toRequiredString(record.documentLabel || record.name),
    documentLogoUrl: toRequiredString(record.documentLogoUrl),
    active: record.active !== false,
  }
}

export function mapClientRecord(record) {
  if (!record) {
    return null
  }

  return {
    id: Number(record.id),
    companyId: Number(record.companyId),
    name: toRequiredString(record.name),
    vatNumber: toRequiredString(record.vatNumber),
    contactName: toRequiredString(record.contactName),
    email: toRequiredString(record.email),
    phone: toRequiredString(record.phone),
    notes: toRequiredString(record.notes),
  }
}

export function mapPersonRecord(record) {
  if (!record) {
    return null
  }

  const monthlyPrice = toNumber(record.monthlyPrice)

  return {
    id: Number(record.id),
    companyId: Number(record.companyId),
    name: toRequiredString(record.name),
    price: toNumber(record.price),
    monthlyPrice,
    isMonthlyBilling: record.isMonthlyBilling === true || monthlyPrice > 0,
    role: normalizeRole(record.role),
  }
}

export function mapWorkPlanRecord(record) {
  if (!record) {
    return null
  }

  return {
    id: Number(record.id),
    companyId: Number(record.companyId),
    date: toDateOnlyString(record.date),
  }
}

export function mapWorkRecord(record) {
  if (!record) {
    return null
  }

  return {
    id: Number(record.id),
    number: Number(record.number),
    companyId: Number(record.companyId),
    name: toRequiredString(record.name),
    clientId: Number(record.clientId),
    location: toRequiredString(record.location),
    status: normalizeWorkStatus(record.status),
    budget: toNumber(record.budget),
    defaultHourlyCost: toNumber(record.defaultHourlyCost),
    roleHourlyCosts: Object.fromEntries(
      (Array.isArray(record.roleHourlyCosts) ? record.roleHourlyCosts : [])
        .map(entry => [normalizeRole(entry.role), toNumber(entry.hourlyCost, Number.NaN)])
        .filter(([role, hourlyCost]) => role && Number.isFinite(hourlyCost)),
    ),
    specialPersonHourlyCosts: Object.fromEntries(
      (Array.isArray(record.personHourlyCosts) ? record.personHourlyCosts : [])
        .map(entry => [String(entry.personId), toNumber(entry.hourlyCost, Number.NaN)])
        .filter(([personId, hourlyCost]) => personId && Number.isFinite(hourlyCost)),
    ),
    startDate: toDateOnlyString(record.startDate),
    endDate: toDateOnlyString(record.endDate),
    workingDays: normalizeWorkingDays(
      Array.isArray(record.workingDays) ? record.workingDays.map(entry => entry.day) : [],
    ),
    notes: toRequiredString(record.notes),
    company: record.company ? mapCompanyRecord(record.company) : undefined,
    client: record.client ? mapClientRecord(record.client) : undefined,
  }
}
