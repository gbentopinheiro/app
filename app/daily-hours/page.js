'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import EditPencilIcon, { editPencilButtonStyle } from '../components/EditPencilIcon'
import { isChefRole } from '../../lib/roles.js'
import { isAssignmentApproved } from '../../lib/work-assignment-approval.js'
import LogoutButton from '../components/LogoutButton'

const pageStyle = {
  minHeight: '100vh',
  padding: 'clamp(18px, 4vw, 40px) clamp(14px, 3vw, 24px) 60px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const shellStyle = {
  maxWidth: '1180px',
  margin: '0 auto',
  display: 'grid',
  gap: '24px',
}

const heroStyle = {
  position: 'relative',
  overflow: 'visible',
  background: 'var(--vp-module-hero)',
  border: '1px solid var(--vp-module-hero-border)',
  borderRadius: '32px',
  padding: 'clamp(18px, 4vw, 28px)',
  boxShadow: 'var(--vp-hero-shadow-strong)',
  color: '#ffffff',
  '--vp-text-muted': 'var(--vp-hero-text-muted)',
  '--vp-text-soft': 'var(--vp-hero-text-soft)',
  '--vp-surface': 'var(--vp-hero-surface)',
  '--vp-border': 'var(--vp-hero-border)',
}

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
}

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
  gap: '14px',
  flex: 1,
  width: '100%',
  minWidth: 0,
}

const statCardStyle = {
  borderRadius: '20px',
  padding: '18px',
  background: 'var(--vp-stat-surface)',
  border: '1px solid var(--vp-stat-border)',
  boxShadow: 'var(--vp-stat-shadow)',
}

const panelStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: 'clamp(18px, 3vw, 24px)',
  boxShadow: 'var(--vp-shadow-panel)',
  minWidth: 0,
}

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
  gap: '16px',
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  marginTop: '8px',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface-muted)',
  fontSize: '14px',
}

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 700,
}

const primaryButtonStyle = {
  border: 'none',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'var(--vp-accent)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  maxWidth: '100%',
}

const secondaryButtonStyle = {
  border: '1px solid var(--vp-accent)',
  borderRadius: '999px',
  padding: '10px 16px',
  background: 'transparent',
  color: 'var(--vp-accent)',
  fontWeight: 700,
  cursor: 'pointer',
  maxWidth: '100%',
}

const reminderCardStyle = {
  borderRadius: '20px',
  padding: '16px 18px',
  background: 'rgba(243, 220, 207, 0.78)',
  border: '1px solid rgba(191, 106, 36, 0.34)',
  color: '#5b3417',
  display: 'grid',
  gap: '10px',
}

const accountClusterStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  padding: '6px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  backdropFilter: 'blur(12px)',
}

const accountNamePillStyle = {
  minHeight: '44px',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 14px',
  borderRadius: '16px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 800,
  background: 'rgba(255,255,255,0.08)',
}

const accountMenuStyle = {
  position: 'relative',
  display: 'inline-flex',
  justifyContent: 'flex-end',
}

const accountMenuButtonStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.16)',
  background: 'rgba(255,255,255,0.1)',
  color: '#ffffff',
  display: 'inline-grid',
  placeItems: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(12px)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
  listStyle: 'none',
}

const dotsStyle = {
  display: 'grid',
  gap: '4px',
}

const dotStyle = {
  width: '4px',
  height: '4px',
  borderRadius: '999px',
  background: '#ffffff',
  boxShadow: '0 0 12px rgba(255,255,255,0.35)',
}

const accountMenuPanelStyle = {
  position: 'absolute',
  top: 'calc(100% + 10px)',
  right: 0,
  zIndex: 5,
  width: '260px',
  padding: '10px',
  borderRadius: '20px',
  background: 'rgba(255, 255, 255, 0.98)',
  border: '1px solid rgba(203, 213, 225, 0.9)',
  boxShadow: '0 24px 70px rgba(8, 22, 45, 0.26)',
  color: '#10233e',
}

const accountMenuHeaderStyle = {
  padding: '10px 12px 12px',
  borderBottom: '1px solid rgba(216, 225, 238, 0.9)',
  marginBottom: '8px',
}

const accountMenuLabelStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const accountMenuNameStyle = {
  margin: '6px 0 0',
  color: '#10233e',
  fontSize: '15px',
  fontWeight: 800,
}

const accountMenuLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '12px',
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px',
  borderRadius: '14px',
  border: 'none',
  color: '#10233e',
  textDecoration: 'none',
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: 800,
  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(255, 140, 0, 0.08) 100%)',
  cursor: 'pointer',
}

const adminEntryGridTemplate = 'minmax(180px, 1.4fr) minmax(170px, 1fr) minmax(150px, 0.9fr) minmax(170px, 1fr)'
const REMINDER_SETTINGS_STORAGE_KEY = 'benpin:daily-hours-reminder-settings'
const DEFAULT_REMINDER_SETTINGS = {
  weekday: '17:25',
  saturday: '15:25',
}

function openNativeDatePicker(event) {
  try {
    if (typeof event?.currentTarget?.showPicker === 'function') {
      event.currentTarget.showPicker()
    }
  } catch (error) {
    return
  }
}

function getTodayDate() {
  return new Intl.DateTimeFormat('sv-SE').format(new Date())
}

function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateString

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function normalizeReminderTime(value, fallback) {
  const normalizedValue = String(value || '').trim()
  return /^\d{2}:\d{2}$/.test(normalizedValue) ? normalizedValue : fallback
}

function normalizeReminderSettings(settings = {}) {
  return {
    weekday: normalizeReminderTime(settings.weekday, DEFAULT_REMINDER_SETTINGS.weekday),
    saturday: normalizeReminderTime(settings.saturday, DEFAULT_REMINDER_SETTINGS.saturday),
  }
}

function getReminderTimeForDate(date = new Date(), settings = DEFAULT_REMINDER_SETTINGS) {
  const normalizedSettings = normalizeReminderSettings(settings)
  return date.getDay() === 6 ? normalizedSettings.saturday : normalizedSettings.weekday
}

function getReminderCutoffLabel(date = new Date(), settings = DEFAULT_REMINDER_SETTINGS) {
  return getReminderTimeForDate(date, settings)
}

function isReminderAfterCutoff(date = new Date(), settings = DEFAULT_REMINDER_SETTINGS) {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const [targetHour, targetMinute] = getReminderTimeForDate(date, settings).split(':').map(Number)
  return hours > targetHour || (hours === targetHour && minutes >= targetMinute)
}

function getReminderStorageKey(personId, dateString) {
  return `vp-daily-hours-reminder:${personId || 'chef'}:${dateString}`
}

function formatSubmittedTime(submittedAt) {
  if (!submittedAt) return ''

  const date = new Date(submittedAt)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function DailyHoursPage() {
  const [defaults, setDefaults] = useState({ works: [] })
  const [dailyEntries, setDailyEntries] = useState([])
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rowErrors, setRowErrors] = useState({})
  const [selectedDate, setSelectedDate] = useState(() => getTodayDate())
  const [selectedWorkId, setSelectedWorkId] = useState('')
  const [entryHours, setEntryHours] = useState({})
  const [savingAll, setSavingAll] = useState(false)
  const [approvingId, setApprovingId] = useState(null)
  const [approvalValues, setApprovalValues] = useState({})
  const [editingChefHours, setEditingChefHours] = useState(null)
  const [editedChefHours, setEditedChefHours] = useState({})
  const [editingApprovedHours, setEditingApprovedHours] = useState(null)
  const [editedApprovedHours, setEditedApprovedHours] = useState({})
  const [approvingAll, setApprovingAll] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [reminderSettings, setReminderSettings] = useState(DEFAULT_REMINDER_SETTINGS)
  const [workNotes, setWorkNotes] = useState({})
  const [openWorkNoteId, setOpenWorkNoteId] = useState(null)
  const [savingWorkNoteId, setSavingWorkNoteId] = useState(null)
  const isChef = isChefRole(session?.role)

  useEffect(() => {
    loadPageData(selectedDate)
    loadWorkNotes(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    loadSession()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
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
    } catch (error) {
      setReminderSettings(DEFAULT_REMINDER_SETTINGS)
    }
  }, [])

  const activeWorks = useMemo(() => {
    const availableWorks = isChef
      ? [...defaults.works]
      : [...defaults.works].filter(work => work.status !== 'completed')

    return availableWorks.sort((a, b) => Number(a.number || 0) - Number(b.number || 0))
  }, [defaults.works, isChef])

  const selectedWork = useMemo(
    () => activeWorks.find(work => String(work.id) === String(selectedWorkId)) || null,
    [activeWorks, selectedWorkId],
  )

  const selectedWorkEntries = useMemo(
    () =>
      dailyEntries
        .filter(entry => String(entry.workId) === String(selectedWorkId))
        .sort((left, right) =>
          String(left.person?.name || '').localeCompare(String(right.person?.name || '')),
        ),
    [dailyEntries, selectedWorkId],
  )

  const chefWorksWithEntries = useMemo(() => {
    if (!isChef) return []

    return activeWorks.map(work => ({
      work,
      entries: dailyEntries
        .filter(entry => String(entry.workId) === String(work.id))
        .sort((left, right) =>
          String(left.person?.name || '').localeCompare(String(right.person?.name || '')),
        ),
    }))
  }, [activeWorks, dailyEntries, isChef])

  const visibleChefEntriesCount = useMemo(() => {
    if (!isChef) return selectedWorkEntries.length

    return chefWorksWithEntries.reduce((sum, group) => sum + group.entries.length, 0)
  }, [chefWorksWithEntries, isChef, selectedWorkEntries.length])

  useEffect(() => {
    if (isChef) {
      if (selectedWorkId && activeWorks.some(work => String(work.id) === String(selectedWorkId))) {
        return
      }

      const assignedWorkId = session?.workIds?.[0]
      const assignedWork = activeWorks.find(work => String(work.id) === String(assignedWorkId))

      if (assignedWork) {
        setSelectedWorkId(String(assignedWork.id))
        return
      }

      const fallbackWork = activeWorks[0] || null

      if (fallbackWork) {
        setSelectedWorkId(String(fallbackWork.id))
      } else if (selectedWorkId) {
        setSelectedWorkId('')
      }

      return
    }

    if (selectedWorkId && activeWorks.some(work => String(work.id) === String(selectedWorkId))) {
      return
    }

    const firstWorkWithEntries = activeWorks.find(work =>
      dailyEntries.some(entry => String(entry.workId) === String(work.id)),
    )
    const fallbackWork = firstWorkWithEntries || activeWorks[0] || null

    if (fallbackWork) {
      setSelectedWorkId(String(fallbackWork.id))
    }
  }, [activeWorks, dailyEntries, isChef, selectedWorkId, session?.workIds])

  useEffect(() => {
    const nextEntryHours = {}

    const visibleEntries = isChef ? chefWorksWithEntries.flatMap(group => group.entries) : selectedWorkEntries

    visibleEntries.forEach(entry => {
      nextEntryHours[String(entry.id)] = String(entry.hours ?? 0)
    })

    setEntryHours(nextEntryHours)
    setRowErrors({})
  }, [chefWorksWithEntries, isChef, selectedWorkEntries])

  const pendingChefEntries = useMemo(
    () => dailyEntries.filter(entry => !entry.submitted),
    [dailyEntries],
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !isChef || loading) {
      return undefined
    }

    function triggerReminderIfNeeded() {
      if (selectedDate !== getTodayDate()) {
        return
      }

      if (!isReminderAfterCutoff(new Date(), reminderSettings) || pendingChefEntries.length === 0) {
        return
      }

      const reminderKey = getReminderStorageKey(session?.personId || session?.id, selectedDate)

      if (window.localStorage.getItem(reminderKey)) {
        return
      }

      if ('Notification' in window && window.Notification.permission === 'granted') {
        const pendingWorks = new Set(
          pendingChefEntries.map(entry => String(entry.work?.name || entry.workName || entry.workId || '')).filter(Boolean),
        )
        const baseBody =
          pendingChefEntries.length === 1
            ? 'Tens 1 registo por submeter no Registo diário.'
            : `Tens ${pendingChefEntries.length} registos por submeter no Registo diário.`

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
  }, [isChef, loading, pendingChefEntries, reminderSettings, selectedDate, session?.id, session?.personId])

  const totalHours = useMemo(() => {
    return Number(
      Math.floor(selectedWorkEntries.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0)),
    )
  }, [selectedWorkEntries])

  const shouldShowReminderCard =
    isChef &&
    !loading &&
    selectedDate === getTodayDate() &&
    pendingChefEntries.length > 0 &&
    isReminderAfterCutoff(new Date(), reminderSettings)
  const reminderCutoffLabel = getReminderCutoffLabel(new Date(), reminderSettings)

  async function loadPageData(date) {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/work-assignments?includeDefaults=true&date=${encodeURIComponent(date)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar registos diários')
      }

      setDefaults(data.defaults || { works: [] })
      setDailyEntries(data.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadWorkNotes(date) {
    try {
      const response = await fetch(`/api/daily-work-notes?date=${encodeURIComponent(date)}`)
      const data = await response.json()

      if (!response.ok) {
        return
      }

      const nextWorkNotes = {}
      ;(Array.isArray(data) ? data : []).forEach(note => {
        nextWorkNotes[String(note.workId)] = note.note || ''
      })
      setWorkNotes(nextWorkNotes)
    } catch (err) {
      setWorkNotes({})
    }
  }

  async function loadSession() {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (response.ok) {
        setSession(data.user)
      }
    } catch (sessionError) {
      setSession(null)
    }
  }

  function handleWorkChange(event) {
    setSelectedWorkId(event.target.value)
    setError('')
    setSuccess('')
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

  function handleWorkNoteChange(workId, value) {
    setWorkNotes(current => ({
      ...current,
      [String(workId)]: value,
    }))
  }

  function toggleWorkNote(workId) {
    setOpenWorkNoteId(currentWorkId => (currentWorkId === workId ? null : workId))
  }

  async function handleSaveWorkNote(workId) {
    setError('')
    setSuccess('')
    setSavingWorkNoteId(workId)

    try {
      const response = await fetch('/api/daily-work-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          workId,
          note: workNotes[String(workId)] || '',
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao guardar nota.')
      }

      setWorkNotes(current => ({
        ...current,
        [String(workId)]: data.note || '',
      }))
      setSuccess('Nota da obra guardada com sucesso.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingWorkNoteId(null)
    }
  }

  async function handleSaveAllHours(entriesToSave = selectedWorkEntries) {
    setError('')
    setSuccess('')
    const nextRowErrors = {}
    let hasErrors = false

    // Validate all entries first
    for (const entry of entriesToSave) {
      const hoursValue = entryHours[String(entry.id)]
      const numericHours = Number(hoursValue)

      if (hoursValue === '' || Number.isNaN(numericHours) || numericHours < 0) {
        nextRowErrors[String(entry.id)] = 'Indica horas iguais ou maiores que 0.'
        hasErrors = true
      }
    }

    if (hasErrors) {
      setRowErrors(nextRowErrors)
      return
    }

    setSavingAll(true)

    try {
      // Step 1: Save all hours
      const updatePromises = entriesToSave.map(entry => {
        const hoursValue = entryHours[String(entry.id)]
        const numericHours = Number(hoursValue)

        return fetch(`/api/work-assignments/${entry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hours: numericHours }),
        }).then(response => response.json())
      })

      const updateResults = await Promise.all(updatePromises)

      // Check if any update failed
      const failedUpdateResult = updateResults.find(result => !result.id && result.error)
      if (failedUpdateResult) {
        throw new Error(failedUpdateResult.error || 'Erro ao atualizar horas')
      }

      // Step 2: Submit all hours
      const submitPromises = entriesToSave.map(entry =>
        fetch(`/api/work-assignments/${entry.id}/submit`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        }).then(response => response.json())
      )

      const submitResults = await Promise.all(submitPromises)

      // Check if any submit failed
      const failedSubmitResult = submitResults.find(result => !result.id && result.error)
      if (failedSubmitResult) {
        throw new Error(failedSubmitResult.error || 'Erro ao submeter horas')
      }

      await loadPageData(selectedDate)
      setSuccess('Horas guardadas e submetidas com sucesso! O administrador será notificado.')
      setRowErrors({})
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingAll(false)
    }
  }

  async function handleApproveHours(entryId) {
    setError('')
    setSuccess('')
    setApprovingId(entryId)

    try {
      const approvedHours = Number(approvalValues[entryId])

      if (Number.isNaN(approvedHours) || approvedHours < 0) {
        setError('Horas têm de ser um número igual ou maior que 0.')
        setApprovingId(null)
        return
      }

      const response = await fetch(`/api/work-assignments/${entryId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedHours }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aprovar horas')
      }

      setSuccess('Horas aprovadas com sucesso.')
      await loadPageData(selectedDate)
    } catch (err) {
      setError(err.message)
    } finally {
      setApprovingId(null)
    }
  }

  function handleApprovalChange(entryId, value) {
    setApprovalValues(current => ({
      ...current,
      [entryId]: value,
    }))
  }

  function handleEditChefHours(entryId, currentHours) {
    setEditingChefHours(entryId)
    setEditedChefHours({ [entryId]: String(currentHours) })
  }

  async function handleSaveChefHoursEdit(entryId) {
    setError('')
    setSuccess('')

    try {
      const newHours = Number(editedChefHours[entryId])

      if (Number.isNaN(newHours) || newHours < 0) {
        setError('Horas têm de ser um número igual ou maior que 0.')
        return
      }

      const response = await fetch(`/api/work-assignments/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: newHours }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar horas')
      }

      setSuccess('Horas atualizadas e submetidas com sucesso.')
      setEditingChefHours(null)
      await loadPageData(selectedDate)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleEditApprovedHours(entryId, currentApprovedHours) {
    setEditingApprovedHours(entryId)
    setEditedApprovedHours({ [entryId]: String(currentApprovedHours || '') })
  }

  async function handleSaveApprovedHoursEdit(entryId) {
    setError('')
    setSuccess('')

    try {
      const newApprovedHours = Number(editedApprovedHours[entryId])

      if (Number.isNaN(newApprovedHours) || newApprovedHours < 0) {
        setError('Horas têm de ser um número igual ou maior que 0.')
        return
      }

      const response = await fetch(`/api/work-assignments/${entryId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedHours: newApprovedHours }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar horas aprovadas')
      }

      setSuccess('Horas aprovadas atualizadas com sucesso.')
      setEditingApprovedHours(null)
      await loadPageData(selectedDate)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleApproveAllHours() {
    setError('')
    setSuccess('')
    setApprovingAll(true)

    try {
      const approvePromises = selectedWorkEntries.map(entry => {
        const approvedHours = entry.hours || entry.dailyHours || 0

        return fetch(`/api/work-assignments/${entry.id}/approve`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approvedHours }),
        }).then(response => response.json())
      })

      const results = await Promise.all(approvePromises)

      // Check if any approve failed
      const failedResult = results.find(result => !result.id && result.error)
      if (failedResult) {
        throw new Error(failedResult.error || 'Erro ao aprovar horas')
      }

      await loadPageData(selectedDate)
      setSuccess('Todas as horas foram aprovadas com sucesso.')
      setRowErrors({})
    } catch (err) {
      setError(err.message)
    } finally {
      setApprovingAll(false)
    }
  }

  async function handleEnableNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setError('Este navegador não suporta notificações.')
      setSuccess('')
      return
    }

    setError('')
    setSuccess('')

    try {
      const permission = await window.Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === 'granted') {
        setSuccess('Notificações ativadas com sucesso.')
      } else if (permission === 'denied') {
        setError('As notificações foram bloqueadas no navegador.')
      }
    } catch (permissionError) {
      setError('Não foi possível ativar as notificações.')
    }
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              {!isChef ? (
                <>
                  <Link href="/" style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}>
                    Voltar ao menu
                  </Link>
                </>
              ) : (
                null
              )}
              <h1 style={{ margin: !isChef ? '18px 0 12px' : '0 0 12px', fontSize: '52px', lineHeight: 1.05 }}>
                Registo Diário
              </h1>
            </div>
            {isChef ? (
              <div style={accountClusterStyle}>
                <span style={accountNamePillStyle}>{session?.name || 'Perfil'}</span>
                <details style={accountMenuStyle}>
                  <summary style={accountMenuButtonStyle} aria-label="Abrir menu da conta">
                    <span style={dotsStyle} aria-hidden="true">
                      <span style={dotStyle} />
                      <span style={dotStyle} />
                      <span style={dotStyle} />
                    </span>
                  </summary>
                  <div style={accountMenuPanelStyle}>
                    <Link href="/account-settings" style={accountMenuLinkStyle}>
                      Definições
                    </Link>
                    <div style={{ marginTop: '8px' }}>
                      <LogoutButton
                        style={{
                          ...accountMenuLinkStyle,
                          width: '100%',
                          boxShadow: 'none',
                        }}
                      />
                    </div>
                  </div>
                </details>
              </div>
            ) : null}
          </div>
        </section>

        <section style={topBarStyle}>
          <div style={statGridStyle}>
            <article style={{ ...statCardStyle, gridColumn: 'span 2' }}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Obras atribuídas</div>
              {isChef ? (
                <div style={{ marginTop: '8px', fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 700 }}>
                  {activeWorks.length}
                </div>
              ) : (
                <select name="workId" value={selectedWorkId} onChange={handleWorkChange} style={inputStyle}>
                  <option value="">Seleciona uma obra</option>
                  {activeWorks.map(work => (
                    <option key={work.id} value={work.id}>
                      {work.name}
                    </option>
                  ))}
                </select>
              )}
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Data</div>
              {isChef ? (
                <div style={{ marginTop: '8px', fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 700 }}>
                  {formatDateLabel(selectedDate)}
                </div>
              ) : (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  onClick={openNativeDatePicker}
                  style={{ ...inputStyle, marginTop: '8px', fontSize: '14px', width: '100%' }}
                />
              )}
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Pessoas atribuídas</div>
              <div style={{ marginTop: '8px', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700 }}>
                {visibleChefEntriesCount}
              </div>
            </article>
          </div>
        </section>

        <section style={panelStyle}>
          {shouldShowReminderCard && (
            <div style={reminderCardStyle}>
              <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Lembrete das {reminderCutoffLabel}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>
                Ainda tens {pendingChefEntries.length} {pendingChefEntries.length === 1 ? 'registo por submeter' : 'registos por submeter'} no dia de hoje.
              </div>
              {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px' }}>
                    Ativa as notificações do navegador para receber este aviso automaticamente as {reminderCutoffLabel}.
                  </span>
                  <button type="button" onClick={handleEnableNotifications} style={secondaryButtonStyle}>
                    Ativar notificações
                  </button>
                </div>
              )}
              {notificationPermission === 'unsupported' && (
                <span style={{ fontSize: '13px' }}>
                  Este navegador não suporta notificações automaticas, mas o aviso continua visivel dentro da pagina.
                </span>
              )}
            </div>
          )}
          {!loading && activeWorks.length === 0 && (
            <p style={{ margin: '18px 0 0', color: '#b42b21' }}>
              Não existem obras ativas para registar horas.
            </p>
          )}

          {loading && <p style={{ margin: '18px 0 0' }}>A carregar equipa do dia...</p>}

          {!loading && !selectedWork && activeWorks.length > 0 && !isChef && (
            <p style={{ margin: '18px 0 0', color: 'var(--vp-text-muted)' }}>
              Seleciona uma obra para veres as pessoas atribuídas.
            </p>
          )}

          {!loading && isChef && activeWorks.length > 0 && visibleChefEntriesCount === 0 && (
            <p style={{ margin: '18px 0 0', color: 'var(--vp-text-muted)' }}>
              Não foi encontrada uma obra atribuída para este utilizador.
            </p>
          )}

          {!loading && isChef && visibleChefEntriesCount > 0 && (
            <div style={{ display: 'grid', gap: '22px', marginTop: '22px' }}>
              {chefWorksWithEntries
                .filter(({ entries }) => entries.length > 0)
                .map(({ work, entries }) => (
                  <section
                    key={work.id}
                    style={{
                      display: 'grid',
                      gap: '12px',
                      border: '1px solid var(--vp-border)',
                      borderRadius: '20px',
                      padding: '16px',
                      background: 'var(--vp-surface)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase', fontWeight: 800 }}>
                          Obra
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                          <h2 style={{ margin: 0, fontSize: '24px', lineHeight: 1.1 }}>
                            {work.name}
                          </h2>
                          <button
                            type="button"
                            onClick={() => toggleWorkNote(work.id)}
                            style={{
                              ...secondaryButtonStyle,
                              padding: '8px 12px',
                              width: 'fit-content',
                              background: workNotes[String(work.id)] ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                            }}
                          >
                            {workNotes[String(work.id)] ? 'Editar nota' : 'Adicionar nota'}
                          </button>
                        </div>
                      </div>
                      <div style={{ color: 'var(--vp-text-muted)', fontWeight: 700 }}>
                        {entries.length} {entries.length === 1 ? 'pessoa' : 'pessoas'}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '10px' }}>
                      {openWorkNoteId === work.id && (
                        <div
                          style={{
                            display: 'grid',
                            gap: '10px',
                            padding: '14px',
                            borderRadius: '18px',
                            background: 'var(--vp-surface-muted)',
                            border: '1px solid var(--vp-border)',
                          }}
                        >
                          <label style={{ ...labelStyle, margin: 0 }}>
                            Nota da obra
                            <textarea
                              value={workNotes[String(work.id)] || ''}
                              onChange={(event) => handleWorkNoteChange(work.id, event.target.value)}
                              placeholder="Escreve uma nota rápida sobre esta obra..."
                              rows={2}
                              style={{
                                ...inputStyle,
                                minHeight: '74px',
                                resize: 'vertical',
                                lineHeight: 1.5,
                                fontFamily: 'inherit',
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSaveWorkNote(work.id)}
                            disabled={savingWorkNoteId === work.id}
                            style={{
                              ...secondaryButtonStyle,
                              width: 'fit-content',
                              justifySelf: 'end',
                              border: 'none',
                              background: savingWorkNoteId === work.id ? 'var(--vp-disabled)' : '#ff8c00',
                              color: '#ffffff',
                              boxShadow: savingWorkNoteId === work.id ? 'none' : '0 14px 28px rgba(255, 140, 0, 0.22)',
                              cursor: savingWorkNoteId === work.id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {savingWorkNoteId === work.id ? 'A guardar...' : 'Guardar nota'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 60px',
                        gap: '12px',
                        alignItems: 'center',
                        padding: '0 12px',
                        color: 'var(--vp-text-soft)',
                        fontSize: '12px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      <div>Pessoa</div>
                      <div style={{ textAlign: 'center' }}>Horas</div>
                    </div>

                    {entries.map(entry => (
                      <article
                        key={entry.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 60px',
                          gap: '12px',
                          border: '1px solid var(--vp-border)',
                          borderRadius: '18px',
                          padding: '16px',
                          background: entry.submitted ? 'var(--vp-highlight)' : 'var(--vp-surface-muted)',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <strong>{entry.person?.name || `Pessoa ${entry.personId}`}</strong>
                          {entry.notes && (
                            <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)', overflowWrap: 'anywhere', fontSize: '13px' }}>
                              {entry.notes}
                            </p>
                          )}
                        </div>

                        <div>
                          {entry.submitted ? (
                            <div style={{ fontWeight: 700, color: '#1f7a45', textAlign: 'center' }}>
                              {entry.hours}h
                            </div>
                          ) : (
                            <>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={entryHours[String(entry.id)] ?? ''}
                                onChange={(event) => handleHoursChange(entry.id, event.target.value)}
                                style={{ ...inputStyle, marginTop: 0 }}
                              />
                              {rowErrors[String(entry.id)] && (
                                <span style={{ color: '#b42318', fontSize: '13px' }}>{rowErrors[String(entry.id)]}</span>
                              )}
                            </>
                          )}
                        </div>
                      </article>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleSaveAllHours(entries)}
                      disabled={savingAll || entries.every(entry => entry.submitted)}
                      style={
                        savingAll || entries.every(entry => entry.submitted)
                          ? { ...primaryButtonStyle, background: 'var(--vp-disabled)', cursor: 'not-allowed' }
                          : { ...primaryButtonStyle, background: '#1f7a45' }
                      }
                    >
                      {savingAll ? 'A guardar e submeter...' : 'Submeter'}
                    </button>
                  </section>
                ))}
            </div>
          )}

          {!loading && !isChef && selectedWork && selectedWorkEntries.length === 0 && (
            <p style={{ margin: '18px 0 0', color: 'var(--vp-text-muted)' }}>
              Ainda não existem pessoas atribuídas a esta obra para hoje.
            </p>
          )}

          {!loading && !isChef && selectedWorkEntries.length > 0 && (
            <div style={{ display: 'grid', gap: '12px', marginTop: '22px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isChef ? '1fr 120px' : adminEntryGridTemplate,
                  gap: '12px',
                  alignItems: 'center',
                  padding: '0 12px',
                  color: 'var(--vp-text-soft)',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                <div>Pessoa</div>
                <div style={{ textAlign: 'center' }}>Status</div>
                {!isChef && <div style={{ textAlign: 'center' }}>Horas</div>}
                {!isChef && <div style={{ textAlign: 'center' }}>Aprovadas</div>}
              </div>

              {selectedWorkEntries.map(entry => (
                <article
                  key={entry.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isChef ? '1fr 120px' : adminEntryGridTemplate,
                    gap: '12px',
                    border: '1px solid var(--vp-border)',
                    borderRadius: '18px',
                    padding: '16px',
                    background: entry.submitted ? 'var(--vp-highlight)' : 'var(--vp-surface)',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <strong>{entry.person?.name || `Pessoa ${entry.personId}`}</strong>
                    {entry.notes && (
                      <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)', overflowWrap: 'anywhere', fontSize: '13px' }}>
                        {entry.notes}
                      </p>
                    )}
                  </div>

                  {isChef ? (
                    <>
                      <div>
                        {entry.submitted ? (
                          <div style={{ fontWeight: 700, color: '#1f7a45', textAlign: 'center' }}>
                            {entry.hours}h ✓
                          </div>
                        ) : (
                          <>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={entryHours[String(entry.id)] ?? ''}
                              onChange={(event) => handleHoursChange(entry.id, event.target.value)}
                              style={{ ...inputStyle, marginTop: 0 }}
                            />
                            {rowErrors[String(entry.id)] && (
                              <span style={{ color: '#b42318', fontSize: '13px' }}>{rowErrors[String(entry.id)]}</span>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div style={{ display: 'grid', gap: '6px', justifyItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: entry.submitted ? '#1f7a45' : 'var(--vp-text-soft)' }}>
                            {entry.submitted ? '✓ Submetido' : 'Por submeter'}
                          </span>
                          {entry.submitted && formatSubmittedTime(entry.submittedAt) ? (
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1f7a45' }}>
                              {formatSubmittedTime(entry.submittedAt)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        {editingChefHours === entry.id ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={editedChefHours[entry.id] ?? ''}
                              onChange={(event) => setEditedChefHours(curr => ({ ...curr, [entry.id]: event.target.value }))}
                              style={{ ...inputStyle, marginTop: 0, fontSize: '12px', padding: '8px 10px' }}
                              placeholder="h"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveChefHoursEdit(entry.id)}
                              style={{
                                ...primaryButtonStyle,
                                fontSize: '11px',
                                padding: '8px 10px',
                                background: 'var(--vp-accent)',
                                cursor: 'pointer',
                              }}
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingChefHours(null)}
                              style={{
                                ...secondaryButtonStyle,
                                fontSize: '11px',
                                padding: '8px 10px',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontWeight: 700 }}>{entry.dailyHours}h</span>
                            <button
                              type="button"
                              onClick={() => handleEditChefHours(entry.id, entry.dailyHours)}
                              style={editPencilButtonStyle}
                              title="Editar horas do chefe"
                              aria-label="Editar horas do chefe"
                            >
                              <EditPencilIcon />
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        {editingApprovedHours === entry.id ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={editedApprovedHours[entry.id] ?? ''}
                              onChange={(event) => setEditedApprovedHours(curr => ({ ...curr, [entry.id]: event.target.value }))}
                              style={{ ...inputStyle, marginTop: 0, fontSize: '12px', padding: '8px 10px' }}
                              placeholder="h"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveApprovedHoursEdit(entry.id)}
                              style={{
                                ...primaryButtonStyle,
                                fontSize: '11px',
                                padding: '8px 10px',
                                background: 'var(--vp-accent)',
                                cursor: 'pointer',
                              }}
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingApprovedHours(null)}
                              style={{
                                ...secondaryButtonStyle,
                                fontSize: '11px',
                                padding: '8px 10px',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : isAssignmentApproved(entry) ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontWeight: 700, color: '#1f7a45' }}>{entry.approvedHours}h ✓</span>
                            <button
                              type="button"
                              onClick={() => handleEditApprovedHours(entry.id, entry.approvedHours)}
                              style={editPencilButtonStyle}
                              title="Editar horas aprovadas"
                              aria-label="Editar horas aprovadas"
                            >
                              <EditPencilIcon />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontWeight: 700, color: 'var(--vp-text-soft)' }}>
                              {entry.dailyHours}h
                            </span>
                            <button
                              type="button"
                              onClick={() => handleEditApprovedHours(entry.id, entry.dailyHours)}
                              style={editPencilButtonStyle}
                              title="Editar horas aprovadas"
                              aria-label="Editar horas aprovadas"
                            >
                              <EditPencilIcon />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </article>
              ))}

              {isChef ? (
                <>
                  <button
                    type="button"
                    onClick={handleSaveAllHours}
                    disabled={savingAll || selectedWorkEntries.every(e => e.submitted)}
                    style={
                      savingAll || selectedWorkEntries.every(e => e.submitted)
                        ? { ...primaryButtonStyle, background: 'var(--vp-disabled)', cursor: 'not-allowed' }
                        : { ...primaryButtonStyle, background: '#1f7a45' }
                    }
                  >
                    {savingAll ? 'A guardar e submeter...' : 'Submeter'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleApproveAllHours}
                    disabled={
                      approvingAll ||
                      selectedWorkEntries.length === 0 ||
                      selectedWorkEntries.every(e => isAssignmentApproved(e))
                    }
                    style={
                      approvingAll ||
                      selectedWorkEntries.length === 0 ||
                      selectedWorkEntries.every(e => isAssignmentApproved(e))
                        ? { ...primaryButtonStyle, background: 'var(--vp-disabled)', cursor: 'not-allowed' }
                        : { ...primaryButtonStyle, background: '#1f7a45' }
                    }
                  >
                    {approvingAll ? 'A aprovar todas...' : 'Aprovar todas'}
                  </button>
                </>
              )}
            </div>
          )}

          {error && <p style={{ margin: '18px 0 0', color: '#b42318' }}>{error}</p>}
          {success && <p style={{ margin: '18px 0 0', color: '#1f7a45' }}>{success}</p>}
        </section>
      </div>
    </main>
  )
}


