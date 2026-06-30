function parseDateParts(dateString) {
  const value = String(dateString || '').trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!year || !month || !day) {
    return null
  }

  return { year, month, day }
}

function normalizeLockDate(value, fallback = new Date()) {
  if (value instanceof Date) {
    return value
  }

  if (value === undefined || value === null || value === '') {
    return fallback
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? fallback : parsedDate
}

function normalizePositiveInteger(value) {
  const parsedValue = Number.parseInt(value, 10)
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
}

function parseBypassClientIds(rawValue) {
  return new Set(
    String(rawValue || '')
      .split(',')
      .map(value => normalizePositiveInteger(value))
      .filter(Boolean),
  )
}

function parseBypassUntil(rawValue) {
  const value = String(rawValue || '').trim()

  if (!value) {
    return null
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

function isActiveBypassWindow(rawValue, now) {
  const bypassUntil = parseBypassUntil(rawValue)

  if (!bypassUntil) {
    return false
  }

  return now.getTime() < bypassUntil.getTime()
}

function normalizeLockOptions(nowOrOptions) {
  if (nowOrOptions instanceof Date) {
    return {
      now: nowOrOptions,
      clientId: null,
      env: process.env,
    }
  }

  if (nowOrOptions && typeof nowOrOptions === 'object') {
    return {
      now: normalizeLockDate(nowOrOptions.now),
      clientId: nowOrOptions.clientId ?? null,
      env: nowOrOptions.env || process.env,
    }
  }

  return {
    now: new Date(),
    clientId: null,
    env: process.env,
  }
}

export function canBypassDailyPlanLock(clientId, options = {}) {
  const normalizedClientId = normalizePositiveInteger(clientId)

  if (!normalizedClientId) {
    return false
  }

  const now = normalizeLockDate(options.now)
  const env = options.env || process.env
  const bypassClientIds = parseBypassClientIds(env.PLANNING_CUTOFF_BYPASS_CLIENT_IDS)
  const bypassWindowActive = isActiveBypassWindow(env.PLANNING_CUTOFF_BYPASS_UNTIL, now)

  if (!bypassWindowActive) {
    return false
  }

  return bypassClientIds.has(normalizedClientId)
}

export function canBypassDailyPlanCreationLock(options = {}) {
  const now = normalizeLockDate(options.now)
  const env = options.env || process.env

  return isActiveBypassWindow(env.PLANNING_CUTOFF_BYPASS_WORK_PLAN_CREATE_UNTIL, now)
}

export function getDailyPlanLockState(dateString, nowOrOptions = new Date()) {
  const { now, clientId, env } = normalizeLockOptions(nowOrOptions)
  const parts = parseDateParts(dateString)

  if (!parts) {
    return {
      locked: false,
      lockDate: null,
      bypassed: false,
    }
  }

  const lockDate = new Date(parts.year, parts.month - 1, parts.day, 8, 0, 0, 0)
  const lockedByCutoff = now.getTime() >= lockDate.getTime()
  const bypassed = lockedByCutoff && canBypassDailyPlanLock(clientId, { now, env })

  return {
    locked: lockedByCutoff && !bypassed,
    lockDate,
    bypassed,
  }
}

export function isDailyPlanLocked(dateString, nowOrOptions = new Date()) {
  return getDailyPlanLockState(dateString, nowOrOptions).locked
}
