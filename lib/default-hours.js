export function getDefaultHoursForDate(dateString) {
  if (!dateString) return 10

  const date = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return 10
  }

  return date.getDay() === 6 ? 7 : 10
}
