import { getDefaultHoursForDate } from './default-hours.js'

function toHourNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function roundHours(value) {
  return Number(toHourNumber(value).toFixed(2))
}

export function getRecordedHoursForAssignment(assignment) {
  return roundHours(assignment?.hours ?? assignment?.dailyHours ?? 0)
}

export function formatHoursValue(value) {
  const normalizedValue = roundHours(value)
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: Number.isInteger(normalizedValue) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(normalizedValue)
}

export function buildDailyHoursWarningMap(assignments = [], dateString) {
  const expectedHours = roundHours(getDefaultHoursForDate(dateString))
  const totalsByPersonId = new Map()

  ;(Array.isArray(assignments) ? assignments : []).forEach(assignment => {
    const personId = Number(assignment?.personId)

    if (!Number.isInteger(personId) || personId <= 0) {
      return
    }

    const currentTotal = totalsByPersonId.get(String(personId)) || 0
    totalsByPersonId.set(
      String(personId),
      roundHours(currentTotal + getRecordedHoursForAssignment(assignment)),
    )
  })

  const warningsByPersonId = new Map()

  totalsByPersonId.forEach((recordedHours, personId) => {
    const deltaHours = roundHours(recordedHours - expectedHours)

    if (deltaHours === 0) {
      return
    }

    warningsByPersonId.set(String(personId), {
      personId: Number(personId),
      expectedHours,
      recordedHours,
      deltaHours,
      message:
        deltaHours < 0
          ? `Faltam ${formatHoursValue(Math.abs(deltaHours))} h`
          : `${formatHoursValue(deltaHours)} h acima do esperado`,
    })
  })

  return warningsByPersonId
}

export function getDailyHoursWarningForPerson(warningsByPersonId, personId) {
  if (!(warningsByPersonId instanceof Map)) {
    return null
  }

  return warningsByPersonId.get(String(personId)) || null
}
