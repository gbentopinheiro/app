export const REMINDER_SETTINGS_STORAGE_KEY = 'benpin:daily-hours-reminder-settings'

export const DEFAULT_REMINDER_SETTINGS = {
  weekday: '17:25',
  saturday: '15:25',
}

export function normalizeReminderTime(value, fallback) {
  const normalizedValue = String(value || '').trim()
  return /^\d{2}:\d{2}$/.test(normalizedValue) ? normalizedValue : fallback
}

export function normalizeReminderSettings(settings = {}) {
  return {
    weekday: normalizeReminderTime(settings.weekday, DEFAULT_REMINDER_SETTINGS.weekday),
    saturday: normalizeReminderTime(settings.saturday, DEFAULT_REMINDER_SETTINGS.saturday),
  }
}

export function getReminderTimeForDate(date = new Date(), settings = DEFAULT_REMINDER_SETTINGS) {
  const normalizedSettings = normalizeReminderSettings(settings)
  return date.getDay() === 6 ? normalizedSettings.saturday : normalizedSettings.weekday
}

export function getReminderCutoffLabel(date = new Date(), settings = DEFAULT_REMINDER_SETTINGS) {
  return getReminderTimeForDate(date, settings)
}

export function isReminderAfterCutoff(date = new Date(), settings = DEFAULT_REMINDER_SETTINGS) {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const [targetHour, targetMinute] = getReminderTimeForDate(date, settings).split(':').map(Number)

  return hours > targetHour || (hours === targetHour && minutes >= targetMinute)
}

export function getReminderStorageKey(personId, dateString) {
  return `vp-daily-hours-reminder:${personId || 'chef'}:${dateString}`
}
