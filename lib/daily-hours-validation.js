export const DAILY_HOURS_MIN = 0
export const DAILY_HOURS_MAX = 24
export const DAILY_HOURS_STEP = 0.5

export const DAILY_HOURS_INPUT_PROPS = Object.freeze({
  min: DAILY_HOURS_MIN,
  max: DAILY_HOURS_MAX,
  step: DAILY_HOURS_STEP,
})

export const DAILY_HOURS_INPUT_ERROR = 'Indica horas entre 0 e 24, em incrementos de 0,5 h.'

export class DailyHoursValidationError extends RangeError {
  constructor(fieldName = 'hours') {
    super(`${fieldName} tem de estar entre 0 e 24, em incrementos de 0,5 h.`)
    this.name = 'DailyHoursValidationError'
  }
}

export function isValidDailyHours(value) {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') {
    return false
  }

  const hours = Number(value)
  return Number.isFinite(hours) && hours >= DAILY_HOURS_MIN && hours <= DAILY_HOURS_MAX &&
    Number.isInteger(hours / DAILY_HOURS_STEP)
}

export function normalizeDailyHoursValue(value, fieldName = 'hours') {
  if (!isValidDailyHours(value)) throw new DailyHoursValidationError(fieldName)
  return Number(value)
}

// Validate only fields being written. Reading or editing unrelated fields must
// preserve historical values, including values outside the current entry rule.
export function validateDailyHoursFields(data, currentAssignment = null) {
  for (const field of ['hours', 'dailyHours', 'approvedHours']) {
    if (data[field] === undefined || (field === 'approvedHours' && data[field] === null)) continue
    normalizeDailyHoursValue(data[field], field)
  }

  if (data.submitted === true) {
    const hours = data.hours !== undefined ? data.hours : currentAssignment?.hours ?? 0
    const dailyHours = data.dailyHours !== undefined
      ? data.dailyHours
      : data.hours !== undefined ? data.hours : currentAssignment?.dailyHours ?? hours
    normalizeDailyHoursValue(hours, 'hours')
    normalizeDailyHoursValue(dailyHours, 'dailyHours')
  }
}
