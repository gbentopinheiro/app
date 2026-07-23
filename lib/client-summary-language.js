const SUPPORTED_CLIENT_SUMMARY_LANGUAGES = ['pt', 'fr', 'en', 'es']

export const CLIENT_SUMMARY_LANGUAGE_OPTIONS = [
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
]

export function normalizeClientSummaryLanguage(value, fallback = 'pt') {
  const normalizedValue = String(value || '')
    .trim()
    .toLowerCase()

  return SUPPORTED_CLIENT_SUMMARY_LANGUAGES.includes(normalizedValue) ? normalizedValue : fallback
}

export function getClientSummaryLanguageLabel(value) {
  const normalizedValue = normalizeClientSummaryLanguage(value)
  return (
    CLIENT_SUMMARY_LANGUAGE_OPTIONS.find(option => option.value === normalizedValue)?.label ||
    CLIENT_SUMMARY_LANGUAGE_OPTIONS[0].label
  )
}
