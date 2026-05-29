'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import LogoutButton from '../../components/LogoutButton'
import {
  fetchChefDailyHoursData,
  fetchChefWorkNotes,
  formatDateLabel,
  formatSubmittedTime,
  getTodayDate,
  saveChefWorkNote,
  sortEntriesByPersonName,
  sortWorksByNumber,
  submitChefEntries,
  validateChefEntryHours,
} from '../../../lib/chef-daily-hours-shared.js'
import {
  DEFAULT_REMINDER_SETTINGS,
  REMINDER_SETTINGS_STORAGE_KEY,
  getReminderCutoffLabel,
  getReminderStorageKey,
  isReminderAfterCutoff,
  normalizeReminderSettings,
} from '../../../lib/reminder-settings.js'

const pageStyle = {
  minHeight: '100vh',
  background: 'var(--vp-page-background)',
  padding: '20px 14px 120px',
  boxSizing: 'border-box',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const phoneShellStyle = {
  width: '100%',
  maxWidth: '430px',
  margin: '0 auto',
  display: 'grid',
  gap: '14px',
}

const heroStyle = {
  position: 'sticky',
  top: '14px',
  zIndex: 5,
  padding: '18px',
  borderRadius: '26px',
  background: 'var(--vp-module-hero)',
  border: '1px solid var(--vp-module-hero-border)',
  color: '#ffffff',
  boxShadow: 'var(--vp-hero-shadow-strong)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
}

const titleStyle = {
  margin: 0,
  fontSize: '30px',
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: '-0.04em',
}

const topActionsStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: '10px',
  marginTop: '16px',
}

const accountActionsStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
}

const datePillStyle = {
  width: '100%',
  minHeight: '52px',
  borderRadius: '16px',
  border: '1px solid var(--vp-hero-border)',
  background: 'var(--vp-hero-surface)',
  color: '#ffffff',
  padding: '0 14px',
  fontSize: '15px',
  fontWeight: 700,
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
}

const topLinkButtonStyle = {
  minHeight: '40px',
  padding: '0 14px',
  borderRadius: '14px',
  border: '1px solid rgba(255,255,255,0.16)',
  background: 'rgba(255,255,255,0.08)',
  color: '#ffffff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: 800,
  boxSizing: 'border-box',
  whiteSpace: 'nowrap',
}

const notificationPromptStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: '16px 18px',
  boxShadow: 'var(--vp-shadow-panel)',
  display: 'grid',
  gap: '12px',
}

const notificationPromptActionsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '10px',
}

const notificationSecondaryButtonStyle = {
  minHeight: '46px',
  borderRadius: '16px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface)',
  color: 'var(--vp-text)',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer',
}

const stripStyle = {
  display: 'flex',
  gap: '10px',
  overflowX: 'auto',
  paddingBottom: '4px',
  scrollbarWidth: 'none',
}

const workChipStyle = isActive => ({
  minWidth: '150px',
  border: '1px solid var(--vp-border)',
  borderRadius: '18px',
  padding: '14px',
  background: isActive
    ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(255, 140, 0, 0.14) 100%)'
    : 'var(--vp-surface-alt)',
  color: 'var(--vp-text)',
  textAlign: 'left',
  cursor: 'pointer',
  boxShadow: isActive ? 'var(--vp-shadow-soft)' : 'none',
})

const cardStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: '18px',
  boxShadow: 'var(--vp-shadow-panel)',
  color: 'var(--vp-text)',
}

const sectionTitleStyle = {
  margin: 0,
  fontSize: '18px',
  lineHeight: 1.15,
  fontWeight: 900,
  letterSpacing: '-0.03em',
}

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '10px',
}

const statCardStyle = {
  borderRadius: '18px',
  padding: '14px',
  background: 'var(--vp-stat-surface)',
  border: '1px solid var(--vp-stat-border)',
  boxShadow: 'var(--vp-stat-shadow)',
}

const workNavigationStyle = {
  display: 'grid',
  gridTemplateColumns: '48px minmax(0, 1fr) 48px',
  gap: '10px',
  alignItems: 'center',
  marginTop: '14px',
}

const navigationButtonStyle = disabled => ({
  width: '48px',
  height: '48px',
  borderRadius: '16px',
  border: '1px solid var(--vp-border)',
  background: disabled ? 'var(--vp-surface-muted)' : 'var(--vp-surface)',
  color: disabled ? 'var(--vp-disabled)' : 'var(--vp-text)',
  fontSize: '18px',
  fontWeight: 900,
  cursor: disabled ? 'not-allowed' : 'pointer',
})

const navigationSummaryStyle = {
  minHeight: '48px',
  borderRadius: '16px',
  background: 'var(--vp-highlight)',
  color: 'var(--vp-highlight-text)',
  display: 'grid',
  placeItems: 'center',
  textAlign: 'center',
  fontSize: '13px',
  fontWeight: 800,
  lineHeight: 1.4,
  padding: '0 12px',
}

const quickActionWrapStyle = {
  marginTop: '16px',
  display: 'grid',
  gap: '10px',
}

const quickActionGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '8px',
}

const quickActionButtonStyle = disabled => ({
  minHeight: '42px',
  borderRadius: '14px',
  border: '1px solid var(--vp-border)',
  background: disabled ? 'var(--vp-surface-muted)' : 'var(--vp-surface)',
  color: disabled ? 'var(--vp-disabled)' : 'var(--vp-text)',
  fontSize: '13px',
  fontWeight: 800,
  cursor: disabled ? 'not-allowed' : 'pointer',
})

const notesToggleButtonStyle = isActive => ({
  minHeight: '42px',
  borderRadius: '14px',
  border: `1px solid ${isActive ? 'rgba(37, 99, 235, 0.26)' : 'var(--vp-border)'}`,
  background: isActive ? 'var(--vp-highlight)' : 'var(--vp-surface)',
  color: isActive ? 'var(--vp-highlight-text)' : 'var(--vp-text)',
  fontSize: '13px',
  fontWeight: 800,
  cursor: 'pointer',
  padding: '0 14px',
})

const entryCardStyle = submitted => ({
  display: 'grid',
  gap: '12px',
  borderRadius: '20px',
  border: submitted ? '1px solid rgba(34, 197, 94, 0.26)' : '1px solid var(--vp-border)',
  background: submitted ? 'rgba(240, 253, 244, 0.9)' : 'var(--vp-surface)',
  padding: '16px',
})

const entryTopStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '10px',
  alignItems: 'flex-start',
}

const statusPillStyle = submitted => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '26px',
  padding: '0 10px',
  borderRadius: '999px',
  background: submitted ? 'rgba(34, 197, 94, 0.12)' : 'rgba(37, 99, 235, 0.1)',
  color: submitted ? '#166534' : '#1d4ed8',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
})

const hoursControlStyle = {
  display: 'grid',
  gap: '10px',
  justifyItems: 'center',
}

const stepperRowStyle = {
  display: 'grid',
  gridTemplateColumns: '48px minmax(0, 1fr) 48px',
  gap: '8px',
  alignItems: 'center',
  width: 'min(100%, 220px)',
  justifySelf: 'center',
}

const stepperButtonStyle = disabled => ({
  width: '48px',
  height: '52px',
  borderRadius: '14px',
  border: '1px solid var(--vp-border)',
  background: disabled ? 'var(--vp-highlight)' : 'var(--vp-surface)',
  color: disabled ? 'var(--vp-disabled)' : 'var(--vp-text)',
  fontSize: '24px',
  fontWeight: 900,
  cursor: disabled ? 'not-allowed' : 'pointer',
})

const hoursInputStyle = disabled => ({
  width: '100%',
  minHeight: '52px',
  borderRadius: '14px',
  border: '1px solid var(--vp-border)',
  background: disabled ? 'var(--vp-highlight)' : 'var(--vp-surface)',
  color: 'var(--vp-text)',
  padding: '0 14px',
  fontSize: '18px',
  fontWeight: 800,
  textAlign: 'center',
  boxSizing: 'border-box',
})

const textareaStyle = {
  width: '100%',
  minHeight: '110px',
  resize: 'vertical',
  borderRadius: '18px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface)',
  color: 'var(--vp-text)',
  padding: '14px',
  fontSize: '14px',
  lineHeight: 1.5,
  boxSizing: 'border-box',
}

const primaryButtonStyle = disabled => ({
  width: '100%',
  minHeight: '56px',
  border: 'none',
  borderRadius: '18px',
  background: disabled
    ? 'linear-gradient(90deg, #b9c9dd 0%, #b9c9dd 100%)'
    : 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 55%, #f97316 100%)',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 900,
  letterSpacing: '-0.01em',
  cursor: disabled ? 'not-allowed' : 'pointer',
  boxShadow: disabled ? 'none' : '0 18px 36px rgba(29, 78, 216, 0.24)',
})

const secondaryButtonStyle = disabled => ({
  width: '100%',
  minHeight: '46px',
  borderRadius: '16px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface)',
  color: 'var(--vp-text)',
  fontSize: '14px',
  fontWeight: 800,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.65 : 1,
})

const messageStyle = type => ({
  margin: 0,
  borderRadius: '16px',
  padding: '14px 16px',
  fontSize: '14px',
  fontWeight: 700,
  lineHeight: 1.5,
  color: type === 'error' ? '#b42318' : '#166534',
  background: type === 'error' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(34, 197, 94, 0.12)',
  border: type === 'error' ? '1px solid rgba(244, 63, 94, 0.16)' : '1px solid rgba(34, 197, 94, 0.2)',
})

const submitSectionStyle = {
  position: 'fixed',
  left: '50%',
  bottom: '14px',
  transform: 'translateX(-50%)',
  width: 'min(430px, calc(100% - 28px))',
  padding: '12px',
  borderRadius: '24px',
  background: 'var(--vp-module-hero)',
  border: '1px solid var(--vp-module-hero-border)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  boxShadow: 'var(--vp-hero-shadow-strong)',
}

const MOBILE_NOTIFICATION_PROMPT_DISMISSED_KEY = 'benpin:mobile-chef-notification-prompt-dismissed'

function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true
}

export default function ChefMobileDailyHoursClient({ initialSession, previewMode = false }) {
  const [selectedDate, setSelectedDate] = useState(() => getTodayDate())
  const [defaults, setDefaults] = useState({ works: [] })
  const [dailyEntries, setDailyEntries] = useState([])
  const [workNotes, setWorkNotes] = useState({})
  const [selectedWorkId, setSelectedWorkId] = useState('')
  const [entryHours, setEntryHours] = useState({})
  const [rowErrors, setRowErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingNote, setSavingNote] = useState(false)
  const [savingEntries, setSavingEntries] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [reminderSettings, setReminderSettings] = useState(DEFAULT_REMINDER_SETTINGS)
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false)
  const [workNotesEnabled, setWorkNotesEnabled] = useState(true)
  const [showNotes, setShowNotes] = useState(false)
  const previewQuerySuffix =
    previewMode && initialSession?.personId ? `&previewPersonId=${encodeURIComponent(initialSession.personId)}` : ''

  useEffect(() => {
    loadPageDataShared(selectedDate)
    loadWorkNotesShared(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (!('Notification' in window)) {
      setNotificationPermission('unsupported')
      return
    }

    setNotificationPermission(window.Notification.permission)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storedSettings = JSON.parse(window.localStorage.getItem(REMINDER_SETTINGS_STORAGE_KEY) || '{}')
      setReminderSettings(normalizeReminderSettings(storedSettings))
    } catch (currentError) {
      setReminderSettings(DEFAULT_REMINDER_SETTINGS)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || previewMode) {
      return
    }

    if (!isStandaloneDisplayMode()) {
      setShowNotificationPrompt(false)
      return
    }

    if (notificationPermission !== 'default') {
      setShowNotificationPrompt(false)
      return
    }

    const wasDismissed = window.localStorage.getItem(MOBILE_NOTIFICATION_PROMPT_DISMISSED_KEY) === '1'
    setShowNotificationPrompt(!wasDismissed)
  }, [notificationPermission, previewMode])

  const activeWorks = useMemo(
    () => sortWorksByNumber(defaults.works || []),
    [defaults.works],
  )

  const selectedWork = useMemo(
    () => activeWorks.find(work => String(work.id) === String(selectedWorkId)) || null,
    [activeWorks, selectedWorkId],
  )

  const selectedWorkIndex = useMemo(
    () => activeWorks.findIndex(work => String(work.id) === String(selectedWorkId)),
    [activeWorks, selectedWorkId],
  )

  const selectedWorkEntries = useMemo(
    () => sortEntriesByPersonName(dailyEntries.filter(entry => String(entry.workId) === String(selectedWorkId))),
    [dailyEntries, selectedWorkId],
  )

  const pendingEntries = useMemo(
    () => selectedWorkEntries.filter(entry => !entry.submitted),
    [selectedWorkEntries],
  )

  useEffect(() => {
    if (typeof window === 'undefined' || previewMode || loading) {
      return undefined
    }

    function triggerReminderIfNeeded() {
      if (selectedDate !== getTodayDate()) {
        return
      }

      if (!isReminderAfterCutoff(new Date(), reminderSettings) || pendingEntries.length === 0) {
        return
      }

      const reminderKey = getReminderStorageKey(initialSession?.personId || initialSession?.id, selectedDate)

      if (window.localStorage.getItem(reminderKey)) {
        return
      }

      if ('Notification' in window && window.Notification.permission === 'granted') {
        const pendingWorks = new Set(
          pendingEntries.map(entry => String(entry.work?.name || entry.workName || entry.workId || '')).filter(Boolean),
        )
        const baseBody =
          pendingEntries.length === 1
            ? 'Tens 1 registo por submeter no Registo diário.'
            : `Tens ${pendingEntries.length} registos por submeter no Registo diário.`

        const body =
          pendingWorks.size > 0
            ? `${baseBody} Obras: ${Array.from(pendingWorks).join(', ')}.`
            : baseBody

        const notification = new window.Notification('Registo diário por completar', { body })
        notification.onclick = () => window.focus()
      }

      window.localStorage.setItem(reminderKey, String(Date.now()))
    }

    triggerReminderIfNeeded()
    const intervalId = window.setInterval(triggerReminderIfNeeded, 30000)
    return () => window.clearInterval(intervalId)
  }, [initialSession?.id, initialSession?.personId, loading, pendingEntries, previewMode, reminderSettings, selectedDate])

  useEffect(() => {
    if (!activeWorks.length) {
      if (selectedWorkId) {
        setSelectedWorkId('')
      }
      return
    }

    if (selectedWorkId && activeWorks.some(work => String(work.id) === String(selectedWorkId))) {
      return
    }

    const assignedWorkId = initialSession?.workIds?.[0]
    const assignedWork = activeWorks.find(work => String(work.id) === String(assignedWorkId))
    const firstWorkWithEntries = activeWorks.find(work =>
      dailyEntries.some(entry => String(entry.workId) === String(work.id)),
    )
    const fallbackWork = assignedWork || firstWorkWithEntries || activeWorks[0]

    setSelectedWorkId(String(fallbackWork.id))
  }, [activeWorks, dailyEntries, initialSession?.workIds, selectedWorkId])

  useEffect(() => {
    const nextEntryHours = {}

    selectedWorkEntries.forEach(entry => {
      nextEntryHours[String(entry.id)] = String(entry.hours ?? 0)
    })

    setEntryHours(nextEntryHours)
    setRowErrors({})
  }, [selectedWorkEntries])

  useEffect(() => {
    setShowNotes(false)
  }, [selectedWorkId, selectedDate])

  async function loadPageData(date) {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/work-assignments?includeDefaults=true&date=${encodeURIComponent(date)}${previewQuerySuffix}`,
        {
          cache: 'no-store',
        },
      )
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível carregar os registos diários.')
      }

      setDefaults(data.defaults || { works: [] })
      setDailyEntries(data.items || [])
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadWorkNotes(date) {
    try {
      const response = await fetch(`/api/daily-work-notes?date=${encodeURIComponent(date)}${previewQuerySuffix}`, {
        cache: 'no-store',
      })
      const data = await response.json().catch(() => [])

      if (response.status === 503) {
        setWorkNotesEnabled(false)
        setWorkNotes({})
        return
      }

      if (!response.ok) {
        return
      }

      setWorkNotesEnabled(true)
      const nextWorkNotes = {}
      ;(Array.isArray(data) ? data : []).forEach(note => {
        nextWorkNotes[String(note.workId)] = note.note || ''
      })
      setWorkNotes(nextWorkNotes)
    } catch (currentError) {
      setWorkNotes({})
    }
  }

  function handleHoursChange(entryId, value) {
    setEntryHours(current => ({
      ...current,
      [String(entryId)]: value,
    }))
    setRowErrors(current => ({
      ...current,
      [String(entryId)]: '',
    }))
  }

  function setEntryHoursValue(entryId, value) {
    handleHoursChange(entryId, value === '' ? '' : String(Math.max(0, Number(value) || 0)))
  }

  function adjustEntryHours(entryId, delta) {
    const currentValue = Number(entryHours[String(entryId)] ?? 0)
    setEntryHoursValue(entryId, Math.max(0, currentValue + delta))
  }

  function applyHoursToPendingEntries(hours) {
    if (previewMode || pendingEntries.length === 0) {
      return
    }

    setEntryHours(current => {
      const next = { ...current }

      pendingEntries.forEach(entry => {
        next[String(entry.id)] = String(hours)
      })

      return next
    })

    setRowErrors({})
    setError('')
    setSuccess('')
  }

  function goToAdjacentWork(direction) {
    if (!activeWorks.length) {
      return
    }

    const currentIndex = selectedWorkIndex >= 0 ? selectedWorkIndex : 0
    const nextIndex = Math.min(activeWorks.length - 1, Math.max(0, currentIndex + direction))
    const nextWork = activeWorks[nextIndex]

    if (!nextWork) {
      return
    }

    setSelectedWorkId(String(nextWork.id))
    setError('')
    setSuccess('')
  }

  function dismissNotificationPrompt() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MOBILE_NOTIFICATION_PROMPT_DISMISSED_KEY, '1')
    }

    setShowNotificationPrompt(false)
  }

  async function handleEnableNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported')
      setError('Este dispositivo não suporta notificações.')
      return
    }

    setError('')
    setSuccess('')

    try {
      const permission = await window.Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === 'granted') {
        window.localStorage.removeItem(MOBILE_NOTIFICATION_PROMPT_DISMISSED_KEY)
        setShowNotificationPrompt(false)
        setSuccess(`Notificações ativadas. O lembrete vai usar a hora ${getReminderCutoffLabel(new Date(), reminderSettings)}.`)
      } else if (permission === 'denied') {
        dismissNotificationPrompt()
        setError('As notificações foram bloqueadas no navegador.')
      }
    } catch (currentError) {
      setError('Não foi possível ativar as notificações.')
    }
  }

  function handleNoteChange(value) {
    if (!selectedWork) return

    setWorkNotes(current => ({
      ...current,
      [String(selectedWork.id)]: value,
    }))
  }

  async function handleSaveNote() {
    if (!selectedWork || previewMode || !workNotesEnabled) {
      return
    }

    setSavingNote(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/daily-work-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          workId: selectedWork.id,
          note: workNotes[String(selectedWork.id)] || '',
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível guardar a nota da obra.')
      }

      setWorkNotes(current => ({
        ...current,
        [String(selectedWork.id)]: data.note || '',
      }))
      setSuccess('Nota da obra guardada com sucesso.')
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSavingNote(false)
    }
  }

  async function handleSubmitSelectedWork() {
    if (previewMode) {
      return
    }

    setError('')
    setSuccess('')

    if (!selectedWork) {
      setError('Escolhe uma obra primeiro.')
      return
    }

    if (pendingEntries.length === 0) {
      setError('Esta obra já não tem registos pendentes para submeter.')
      return
    }

    const nextRowErrors = {}
    let hasErrors = false

    for (const entry of pendingEntries) {
      const rawValue = entryHours[String(entry.id)]
      const numericValue = Number(rawValue)

      if (rawValue === '' || Number.isNaN(numericValue) || numericValue < 0) {
        nextRowErrors[String(entry.id)] = 'Indica horas iguais ou maiores que 0.'
        hasErrors = true
      }
    }

    if (hasErrors) {
      setRowErrors(nextRowErrors)
      return
    }

    setSavingEntries(true)

    try {
      await Promise.all(
        pendingEntries.map(async entry => {
          const response = await fetch(`/api/work-assignments/${entry.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hours: Number(entryHours[String(entry.id)]) }),
          })
          const data = await response.json().catch(() => ({}))

          if (!response.ok) {
            throw new Error(data.error || 'Não foi possível atualizar as horas.')
          }
        }),
      )

      await Promise.all(
        pendingEntries.map(async entry => {
          const response = await fetch(`/api/work-assignments/${entry.id}/submit`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
          })
          const data = await response.json().catch(() => ({}))

          if (!response.ok) {
            throw new Error(data.error || 'Não foi possível submeter as horas.')
          }
        }),
      )

      await loadPageData(selectedDate)
      setSuccess('Horas guardadas e submetidas com sucesso.')
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSavingEntries(false)
    }
  }

  async function loadPageDataShared(date) {
    setLoading(true)
    setError('')

    try {
      const data = await fetchChefDailyHoursData({
        date,
        previewQuerySuffix,
        cache: 'no-store',
        loadErrorMessage: 'NÃ£o foi possÃ­vel carregar os registos diÃ¡rios.',
      })

      setDefaults(data.defaults)
      setDailyEntries(data.items)
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadWorkNotesShared(date) {
    try {
      const result = await fetchChefWorkNotes({
        date,
        previewQuerySuffix,
        cache: 'no-store',
      })

      if (result.unavailable) {
        setWorkNotesEnabled(false)
        setWorkNotes({})
        return
      }

      if (!result.ok) {
        return
      }

      setWorkNotesEnabled(true)
      setWorkNotes(result.notesByWorkId)
    } catch (currentError) {
      setWorkNotes({})
    }
  }

  async function handleSaveNoteShared() {
    if (!selectedWork || previewMode || !workNotesEnabled) {
      return
    }

    setSavingNote(true)
    setError('')
    setSuccess('')

    try {
      const savedNote = await saveChefWorkNote({
        date: selectedDate,
        workId: selectedWork.id,
        note: workNotes[String(selectedWork.id)] || '',
        saveErrorMessage: 'NÃ£o foi possÃ­vel guardar a nota da obra.',
      })

      setWorkNotes(current => ({
        ...current,
        [String(selectedWork.id)]: savedNote,
      }))
      setSuccess('Nota da obra guardada com sucesso.')
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSavingNote(false)
    }
  }

  async function handleSubmitSelectedWorkShared() {
    if (previewMode) {
      return
    }

    setError('')
    setSuccess('')

    if (!selectedWork) {
      setError('Escolhe uma obra primeiro.')
      return
    }

    if (pendingEntries.length === 0) {
      setError('Esta obra jÃ¡ nÃ£o tem registos pendentes para submeter.')
      return
    }

    const validation = validateChefEntryHours(pendingEntries, entryHours)

    if (validation.hasErrors) {
      setRowErrors(validation.rowErrors)
      return
    }

    setSavingEntries(true)

    try {
      await submitChefEntries({
        entries: pendingEntries,
        entryHours,
        updateErrorMessage: 'NÃ£o foi possÃ­vel atualizar as horas.',
        submitErrorMessage: 'NÃ£o foi possÃ­vel submeter as horas.',
      })

      await loadPageDataShared(selectedDate)
      setSuccess('Horas guardadas e submetidas com sucesso.')
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSavingEntries(false)
    }
  }

  return (
    <main style={pageStyle}>
      <div style={phoneShellStyle}>
        <section style={heroStyle}>
          <h1 style={titleStyle}>Registo Diário</h1>

          <div style={topActionsStyle}>
            <div style={datePillStyle}>{formatDateLabel(selectedDate)}</div>
            <div style={accountActionsStyle}>
              <Link href="/mobile/chef/settings" style={topLinkButtonStyle}>
                Definições
              </Link>
              <LogoutButton
                redirectTo="/login"
                style={{
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  minHeight: '40px',
                  padding: '0 14px',
                }}
              />
            </div>
          </div>
        </section>

        {error ? <p style={messageStyle('error')}>{error}</p> : null}
        {success ? <p style={messageStyle('success')}>{success}</p> : null}

        {showNotificationPrompt ? (
          <section style={notificationPromptStyle}>
            <h2 style={sectionTitleStyle}>Ativar notificações</h2>

            <div style={notificationPromptActionsStyle}>
              <button type="button" onClick={handleEnableNotifications} style={primaryButtonStyle(false)}>
                Ativar
              </button>
              <button type="button" onClick={dismissNotificationPrompt} style={notificationSecondaryButtonStyle}>
                Agora não
              </button>
            </div>
          </section>
        ) : null}

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Obras do dia</h2>

          <div style={{ marginTop: '16px', ...stripStyle }}>
            {activeWorks.map(work => (
              <button
                key={work.id}
                type="button"
                onClick={() => setSelectedWorkId(String(work.id))}
                style={{
                  ...workChipStyle(String(work.id) === String(selectedWorkId)),
                  minWidth:
                    activeWorks.length === 1 ? '100%' : activeWorks.length === 2 ? 'calc(50% - 5px)' : '150px',
                }}
              >
                {activeWorks.length <= 2 ? null : (
                  <div
                    style={{ fontSize: '12px', color: 'var(--vp-text-muted)', fontWeight: 800, letterSpacing: '0.08em' }}
                  >
                    OBRA {work.number || work.id}
                  </div>
                )}
                <div
                  style={{
                    marginTop: activeWorks.length <= 2 ? 0 : '8px',
                    fontSize: '15px',
                    fontWeight: 800,
                    lineHeight: 1.35,
                  }}
                >
                  {work.name}
                </div>
              </button>
            ))}

            {!loading && activeWorks.length === 0 ? (
              <div
                style={{
                  minWidth: '100%',
                  borderRadius: '18px',
                  padding: '16px',
                  background: 'var(--vp-surface-alt)',
                  color: 'var(--vp-text)',
                }}
              >
                Sem obras disponíveis para este dia.
              </div>
            ) : null}
          </div>

          {activeWorks.length > 1 ? (
            <div style={workNavigationStyle}>
              <button
                type="button"
                onClick={() => goToAdjacentWork(-1)}
                disabled={selectedWorkIndex <= 0}
                style={navigationButtonStyle(selectedWorkIndex <= 0)}
                aria-label="Obra anterior"
              >
                ‹
              </button>
              <div style={navigationSummaryStyle}>
                {selectedWorkIndex >= 0 ? `Obra ${selectedWorkIndex + 1} de ${activeWorks.length}` : 'Escolhe uma obra'}
              </div>
              <button
                type="button"
                onClick={() => goToAdjacentWork(1)}
                disabled={selectedWorkIndex === -1 || selectedWorkIndex >= activeWorks.length - 1}
                style={navigationButtonStyle(selectedWorkIndex === -1 || selectedWorkIndex >= activeWorks.length - 1)}
                aria-label="Próxima obra"
              >
                ›
              </button>
            </div>
          ) : null}
        </section>

        <section style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
            <div>
              <h2 style={sectionTitleStyle}>{selectedWork?.name || 'Obra por selecionar'}</h2>
            </div>
            {workNotesEnabled && selectedWork ? (
              <button
                type="button"
                onClick={() => setShowNotes(current => !current)}
                style={notesToggleButtonStyle(showNotes)}
              >
                Notas
              </button>
            ) : null}
          </div>

          <div style={{ marginTop: '16px', ...statGridStyle }}>
            <div style={statCardStyle}>
              <div style={{ color: 'var(--vp-text-muted)', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em' }}>PESSOAS</div>
              <div style={{ marginTop: '6px', fontSize: '24px', fontWeight: 900 }}>{selectedWorkEntries.length}</div>
            </div>
            <div style={statCardStyle}>
              <div style={{ color: 'var(--vp-text-muted)', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em' }}>PENDENTES</div>
              <div style={{ marginTop: '6px', fontSize: '24px', fontWeight: 900 }}>{pendingEntries.length}</div>
            </div>
          </div>

          <div style={quickActionWrapStyle}>
            <div style={quickActionGridStyle}>
              <button
                type="button"
                onClick={() => applyHoursToPendingEntries(7)}
                disabled={previewMode || pendingEntries.length === 0}
                style={quickActionButtonStyle(previewMode || pendingEntries.length === 0)}
              >
                Todos 7h
              </button>
              <button
                type="button"
                onClick={() => applyHoursToPendingEntries(8)}
                disabled={previewMode || pendingEntries.length === 0}
                style={quickActionButtonStyle(previewMode || pendingEntries.length === 0)}
              >
                Todos 8h
              </button>
              <button
                type="button"
                onClick={() => applyHoursToPendingEntries(9)}
                disabled={previewMode || pendingEntries.length === 0}
                style={quickActionButtonStyle(previewMode || pendingEntries.length === 0)}
              >
                Todos 9h
              </button>
              <button
                type="button"
                onClick={() => applyHoursToPendingEntries(10)}
                disabled={previewMode || pendingEntries.length === 0}
                style={quickActionButtonStyle(previewMode || pendingEntries.length === 0)}
              >
                Todos 10h
              </button>
            </div>
          </div>
        </section>

        {workNotesEnabled && selectedWork && showNotes ? (
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Nota da obra</h2>

            <div style={{ marginTop: '14px' }}>
              <textarea
                value={workNotes[String(selectedWork.id)] || ''}
                onChange={event => handleNoteChange(event.target.value)}
                style={textareaStyle}
                disabled={previewMode}
              />
            </div>

            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={handleSaveNoteShared}
                disabled={savingNote || previewMode}
                style={secondaryButtonStyle(savingNote || previewMode)}
              >
                {previewMode ? 'Pré-visualização' : savingNote ? 'A guardar nota...' : 'Guardar nota'}
              </button>
            </div>
          </section>
        ) : null}

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Equipa da obra</h2>

          <div style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
            {!loading && selectedWorkEntries.length === 0 ? (
              <div style={{ ...entryCardStyle(false), color: '#5d7391' }}>
                Ainda não existem pessoas atribuídas a esta obra para a data escolhida.
              </div>
            ) : null}

            {selectedWorkEntries.map(entry => {
              const submittedTime = formatSubmittedTime(entry.submittedAt)
              const isSubmitted = entry.submitted

              return (
                <article key={entry.id} style={entryCardStyle(isSubmitted)}>
                  <div style={entryTopStyle}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, lineHeight: 1.2 }}>
                        {entry.person?.name || `Pessoa ${entry.personId}`}
                      </div>
                      {entry.notes ? (
                        <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)', fontSize: '13px', lineHeight: 1.5 }}>
                          {entry.notes}
                        </p>
                      ) : null}
                    </div>

                    <span style={statusPillStyle(isSubmitted)}>
                      {isSubmitted ? 'Submetido' : 'Pendente'}
                    </span>
                  </div>

                  <div style={hoursControlStyle}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--vp-text-muted)', letterSpacing: '0.08em' }}>
                      HORAS
                    </label>
                    <div style={stepperRowStyle}>
                      <button
                        type="button"
                        onClick={() => adjustEntryHours(entry.id, -1)}
                        disabled={isSubmitted || previewMode}
                        style={stepperButtonStyle(isSubmitted || previewMode)}
                        aria-label={`Diminuir horas de ${entry.person?.name || `Pessoa ${entry.personId}`}`}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={entryHours[String(entry.id)] ?? ''}
                        onChange={event => handleHoursChange(entry.id, event.target.value)}
                        disabled={isSubmitted || previewMode}
                        style={hoursInputStyle(isSubmitted || previewMode)}
                      />
                      <button
                        type="button"
                        onClick={() => adjustEntryHours(entry.id, 1)}
                        disabled={isSubmitted || previewMode}
                        style={stepperButtonStyle(isSubmitted || previewMode)}
                        aria-label={`Aumentar horas de ${entry.person?.name || `Pessoa ${entry.personId}`}`}
                      >
                        +
                      </button>
                    </div>
                    {rowErrors[String(entry.id)] ? (
                      <span style={{ color: '#b42318', fontSize: '12px', fontWeight: 700 }}>
                        {rowErrors[String(entry.id)]}
                      </span>
                    ) : null}
                    {isSubmitted && submittedTime ? (
                      <span style={{ color: '#166534', fontSize: '12px', fontWeight: 700 }}>
                        Submetido às {submittedTime}
                      </span>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>

      <div style={submitSectionStyle}>
        <button
          type="button"
          onClick={handleSubmitSelectedWorkShared}
          disabled={savingEntries || previewMode || !selectedWork || pendingEntries.length === 0}
          style={primaryButtonStyle(savingEntries || previewMode || !selectedWork || pendingEntries.length === 0)}
        >
          {previewMode
            ? 'Pré-visualização móvel do chefe'
            : savingEntries
              ? 'A submeter...'
              : pendingEntries.length > 0
                ? 'Submeter'
                : 'Sem registos pendentes'}
        </button>
      </div>
    </main>
  )
}
