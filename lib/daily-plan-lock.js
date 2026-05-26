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

export function getDailyPlanLockState(dateString, now = new Date()) {
  const parts = parseDateParts(dateString)

  if (!parts) {
    return {
      locked: false,
      lockDate: null,
    }
  }

  const lockDate = new Date(parts.year, parts.month - 1, parts.day, 8, 0, 0, 0)

  return {
    locked: now.getTime() >= lockDate.getTime(),
    lockDate,
  }
}

export function isDailyPlanLocked(dateString, now = new Date()) {
  return getDailyPlanLockState(dateString, now).locked
}
