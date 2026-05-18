'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
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
  overflow: 'hidden',
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

const adminEntryGridTemplate = 'minmax(180px, 1.4fr) minmax(170px, 1fr) minmax(150px, 0.9fr) minmax(170px, 1fr)'

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

function getReminderCutoffLabel(date = new Date()) {
  return date.getDay() === 6 ? '15:25' : '17:25'
}

function isReminderAfterCutoff(date = new Date()) {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const isSaturday = date.getDay() === 6
  const targetHour = isSaturday ? 15 : 17
  return hours > targetHour || (hours === targetHour && minutes >= 25)
}

function getReminderStorageKey(personId, dateString) {
  return `vp-daily-hours-reminder:${personId || 'chef'}:${dateString}`
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
  const isChef = session?.role === 'chef'

  useEffect(() => {
    loadPageData(selectedDate)
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

    selectedWorkEntries.forEach(entry => {
      nextEntryHours[String(entry.id)] = String(entry.hours ?? 0)
    })

    setEntryHours(nextEntryHours)
    setRowErrors({})
  }, [selectedWorkEntries])

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

      if (!isReminderAfterCutoff() || pendingChefEntries.length === 0) {
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
            ? 'Tens 1 registo por submeter no Registo diario.'
            : `Tens ${pendingChefEntries.length} registos por submeter no Registo diario.`

        const body =
          pendingWorks.size > 0
            ? `${baseBody} Obras: ${Array.from(pendingWorks).join(', ')}.`
            : baseBody

        const notification = new window.Notification('Registo diario por completar', { body })
        notification.onclick = () => window.focus()
      }

      window.localStorage.setItem(reminderKey, String(Date.now()))
    }

    triggerReminderIfNeeded()
    const intervalId = window.setInterval(triggerReminderIfNeeded, 30000)
    return () => window.clearInterval(intervalId)
  }, [isChef, loading, pendingChefEntries, selectedDate, session?.id, session?.personId])

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
    isReminderAfterCutoff()
  const reminderCutoffLabel = getReminderCutoffLabel()

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

  async function handleSaveAllHours() {
    setError('')
    setSuccess('')
    const nextRowErrors = {}
    let hasErrors = false

    // Validate all entries first
    for (const entry of selectedWorkEntries) {
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
      const updatePromises = selectedWorkEntries.map(entry => {
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
      const submitPromises = selectedWorkEntries.map(entry =>
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

      setSuccess('Horas do chef atualizadas com sucesso.')
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
      setError('Este navegador nao suporta notificacoes.')
      setSuccess('')
      return
    }

    setError('')
    setSuccess('')

    try {
      const permission = await window.Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === 'granted') {
        setSuccess('Notificacoes ativadas com sucesso.')
      } else if (permission === 'denied') {
        setError('As notificacoes foram bloqueadas no navegador.')
      }
    } catch (permissionError) {
      setError('Nao foi possivel ativar as notificacoes.')
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
                    {'<- '}Voltar ao menu
                  </Link>
                  <p style={{ margin: '18px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: 'var(--vp-text-soft)' }}>
                    Registo diário
                  </p>
                </>
              ) : (
                null
              )}
              <h1 style={{ margin: !isChef ? '10px 0 12px' : '0 0 12px', fontSize: '44px', lineHeight: 1.05 }}>
                Registo Diário
              </h1>
            </div>
            <LogoutButton />
          </div>
        </section>

        <section style={topBarStyle}>
          <div style={statGridStyle}>
            <article style={{ ...statCardStyle, gridColumn: 'span 2' }}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Obra</div>
              <select name="workId" value={selectedWorkId} onChange={handleWorkChange} style={inputStyle}>
                <option value="">Seleciona uma obra</option>
                {activeWorks.map(work => (
                  <option key={work.id} value={work.id}>
                    {work.name}
                  </option>
                ))}
              </select>
              {isChef && activeWorks.length > 1 && (
                <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                  Podes alternar entre todas as obras onde estás afetado.
                </p>
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
                  style={{ ...inputStyle, marginTop: '8px', fontSize: '14px', width: '100%' }}
                />
              )}
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Pessoas atribuídas</div>
              <div style={{ marginTop: '8px', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700 }}>
                {selectedWorkEntries.length}
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
                    Ativa as notificacoes do navegador para receber este aviso automaticamente as {reminderCutoffLabel}.
                  </span>
                  <button type="button" onClick={handleEnableNotifications} style={secondaryButtonStyle}>
                    Ativar notificacoes
                  </button>
                </div>
              )}
              {notificationPermission === 'unsupported' && (
                <span style={{ fontSize: '13px' }}>
                  Este navegador nao suporta notificacoes automaticas, mas o aviso continua visivel dentro da pagina.
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

          {!loading && !selectedWork && isChef && (
            <p style={{ margin: '18px 0 0', color: 'var(--vp-text-muted)' }}>
              Não foi encontrada uma obra atribuída para este utilizador.
            </p>
          )}

          {!loading && selectedWork && selectedWorkEntries.length === 0 && (
            <p style={{ margin: '18px 0 0', color: 'var(--vp-text-muted)' }}>
              Ainda não existem pessoas atribuídas a esta obra para hoje.
            </p>
          )}

          {!loading && selectedWorkEntries.length > 0 && (
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
                              style={{
                                ...secondaryButtonStyle,
                                width: '34px',
                                height: '34px',
                                padding: 0,
                                fontSize: '14px',
                              }}
                              title="Editar horas do chefe"
                              aria-label="Editar horas do chefe"
                            >
                              ✎
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
                        ) : entry.approvedHours !== null && entry.approvedHours !== undefined ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontWeight: 700, color: '#1f7a45' }}>{entry.approvedHours}h ✓</span>
                            <button
                              type="button"
                              onClick={() => handleEditApprovedHours(entry.id, entry.approvedHours)}
                              style={{
                                ...secondaryButtonStyle,
                                width: '34px',
                                height: '34px',
                                padding: 0,
                                fontSize: '14px',
                              }}
                              title="Editar horas aprovadas"
                              aria-label="Editar horas aprovadas"
                            >
                              ✎
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
                              style={{
                                ...secondaryButtonStyle,
                                width: '34px',
                                height: '34px',
                                padding: 0,
                                fontSize: '14px',
                              }}
                              title="Editar horas aprovadas"
                              aria-label="Editar horas aprovadas"
                            >
                              ✎
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
                      selectedWorkEntries.every(e => e.approvedHours !== null && e.approvedHours !== undefined)
                    }
                    style={
                      approvingAll ||
                      selectedWorkEntries.length === 0 ||
                      selectedWorkEntries.every(e => e.approvedHours !== null && e.approvedHours !== undefined)
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
