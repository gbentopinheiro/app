function toLocalIsoDateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getPreviousPlanningDateValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return ''
  const date = new Date(`${value}T12:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return ''
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

export function getTomorrowPlanningDateValue(baseDate = new Date()) {
  const tomorrow = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + 1,
    12,
    0,
    0,
    0,
  )

  return toLocalIsoDateValue(tomorrow)
}
