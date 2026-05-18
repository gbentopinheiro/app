'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getDefaultHoursForDate } from '../../lib/default-hours.js'

const pageStyle = {
  minHeight: '100vh',
  padding: '40px 24px 60px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
  fontWeight: 600,
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
  padding: '28px',
  boxShadow: 'var(--vp-hero-shadow-strong)',
  color: '#ffffff',
  '--vp-text-muted': 'var(--vp-hero-text-muted)',
  '--vp-text-soft': 'var(--vp-hero-text-soft)',
  '--vp-surface': 'var(--vp-hero-surface)',
  '--vp-border': 'var(--vp-hero-border)',
}

const panelStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-panel)',
}

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'var(--vp-overlay)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  zIndex: 50,
}

const modalCardStyle = {
  width: 'min(760px, 100%)',
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  background: 'var(--vp-surface-soft-strong)',
  border: '1px solid var(--vp-border)',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-modal)',
}

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: '16px',
  flexWrap: 'wrap',
}

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '14px',
  flex: 1,
}

const statCardStyle = {
  borderRadius: '20px',
  padding: '18px',
  background: 'var(--vp-stat-surface)',
  border: '1px solid var(--vp-stat-border)',
  boxShadow: 'var(--vp-stat-shadow)',
}

const inputStyle = {
  width: '100%',
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
  fontWeight: 800,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  border: '1px solid var(--vp-accent)',
  borderRadius: '999px',
  padding: '10px 16px',
  background: 'transparent',
  color: 'var(--vp-accent)',
  fontWeight: 800,
  cursor: 'pointer',
}

const disabledButtonStyle = {
  ...primaryButtonStyle,
  background: 'var(--vp-disabled)',
  cursor: 'not-allowed',
}

const dangerButtonStyle = {
  border: '1px solid #b42318',
  borderRadius: '999px',
  padding: '10px 16px',
  background: 'transparent',
  color: '#b42318',
  fontWeight: 800,
  cursor: 'pointer',
}

const pageActionButtonStyle = {
  width: '100%',
  minHeight: '42px',
  padding: '10px 20px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
}

const compactActionButtonStyle = {
  minWidth: '148px',
  minHeight: '38px',
  padding: '8px 16px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
}

const closeButtonStyle = {
  border: '1px solid var(--vp-border)',
  borderRadius: '999px',
  width: '38px',
  height: '38px',
  background: 'var(--vp-surface)',
  color: 'var(--vp-text)',
  fontSize: '22px',
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}

const workCardStyle = {
  border: '1px solid var(--vp-border)',
  borderRadius: '20px',
  padding: '20px',
  background: 'var(--vp-surface)',
  display: 'grid',
  gap: '8px',
}

const today = new Date().toISOString().slice(0, 10)
const emptyAssignmentForm = {
  id: null,
  personId: '',
  workId: '',
  notes: '',
}

export default function DailyPlanPage() {
  const [selectedDate, setSelectedDate] = useState(today)
  const [workPlans, setWorkPlans] = useState([])
  const [selectedWorkPlan, setSelectedWorkPlan] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [defaults, setDefaults] = useState({ people: [], works: [] })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [creatingMode, setCreatingMode] = useState('')
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedMessageWorkIds, setSelectedMessageWorkIds] = useState([])
  const [messageSelectionError, setMessageSelectionError] = useState('')
  const [draggedAssignmentId, setDraggedAssignmentId] = useState(null)
  const [draggedSourceWorkId, setDraggedSourceWorkId] = useState(null)
  const [dropTargetWorkId, setDropTargetWorkId] = useState(null)
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm)
  const [formErrors, setFormErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadDailyPlan(selectedDate)
  }, [selectedDate])

  const groupedAssignments = useMemo(() => {
    const groups = new Map()

    for (const assignment of assignments) {
      const key = assignment.work?.id || assignment.workId
      const existing = groups.get(key)

      if (existing) {
        existing.assignments.push(assignment)
      } else {
        groups.set(key, {
          workId: assignment.work?.id || assignment.workId,
          workNumber: assignment.work?.number || '-',
          workName: assignment.work?.name || `Obra ${assignment.workId}`,
          assignments: [assignment],
        })
      }
    }

    return Array.from(groups.values())
      .map(group => ({
        ...group,
        assignments: [...group.assignments].sort((left, right) =>
          String(left.person?.name || `Pessoa ${left.personId}`).localeCompare(
            String(right.person?.name || `Pessoa ${right.personId}`),
            'pt-PT',
            { sensitivity: 'base' },
          ),
        ),
      }))
      .sort((left, right) => Number(left.workNumber) - Number(right.workNumber))
  }, [assignments])

  const hasWorkPlanForDate = Boolean(selectedWorkPlan)
  const activeWorks = useMemo(
    () => defaults.works.filter(work => work.status !== 'completed'),
    [defaults.works],
  )
  const selectedWork = useMemo(
    () => activeWorks.find(work => String(work.id) === String(assignmentForm.workId)),
    [activeWorks, assignmentForm.workId],
  )
  const selectedPerson = useMemo(
    () => defaults.people.find(person => String(person.id) === String(assignmentForm.personId)),
    [defaults.people, assignmentForm.personId],
  )
  const activeWorksById = useMemo(
    () => new Map(activeWorks.map(work => [String(work.id), work])),
    [activeWorks],
  )
  const unplannedWorks = useMemo(() => {
    const plannedWorkIds = new Set(groupedAssignments.map(group => String(group.workId)))

    return activeWorks.filter(work => !plannedWorkIds.has(String(work.id)))
  }, [activeWorks, groupedAssignments])
  const generatedMessage = useMemo(() => {
    if (!selectedWorkPlan || selectedMessageWorkIds.length === 0) return ''

    const selectedGroups = groupedAssignments.filter(group => selectedMessageWorkIds.includes(String(group.workId)))

    if (selectedGroups.length === 0) return ''

    const messageParts = selectedGroups.map(group => {
      const peopleLines = group.assignments
        .map(assignment => `- ${assignment.person?.name || `Pessoa ${assignment.personId}`}`)
        .join('\n')

      return `${group.workName}\n${peopleLines}`
    })

    return [`Plano do dia ${selectedWorkPlan.date}`, ...messageParts].join('\n\n')
  }, [groupedAssignments, selectedMessageWorkIds, selectedWorkPlan])

  async function loadDailyPlan(date) {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const [workPlansResponse, defaultsResponse] = await Promise.all([
        fetch('/api/work-plans'),
        fetch('/api/work-assignments?includeDefaults=true'),
      ])
      const workPlansData = await workPlansResponse.json()
      const defaultsData = await defaultsResponse.json()

      if (!workPlansResponse.ok) {
        throw new Error(workPlansData.error || 'Erro ao carregar work plans')
      }

      if (!defaultsResponse.ok) {
        throw new Error(defaultsData.error || 'Erro ao carregar dados base')
      }

      setWorkPlans(workPlansData)
      setDefaults(defaultsData.defaults || { people: [], works: [] })

      const workPlan = workPlansData.find(item => item.date === date) || null
      setSelectedWorkPlan(workPlan)

      if (!workPlan) {
        setAssignments([])
        return
      }

      const assignmentsResponse = await fetch(`/api/work-assignments?workPlanId=${workPlan.id}`)
      const assignmentsData = await assignmentsResponse.json()

      if (!assignmentsResponse.ok) {
        throw new Error(assignmentsData.error || 'Erro ao carregar work assignments')
      }

      setAssignments(assignmentsData)
    } catch (err) {
      setError(err.message)
      setSelectedWorkPlan(null)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateWorkPlan(clonePreviousDay = false) {
    if (hasWorkPlanForDate && !clonePreviousDay) return

    setCreating(true)
    setCreatingMode(clonePreviousDay ? 'clone' : 'new')
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/work-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          clonePreviousDay,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar work plan')
      }

      setSuccess(
        clonePreviousDay
          ? data.reusedWorkPlan
            ? `Plano de ${data.date} atualizado com ${data.clonedAssignments} afetações copiadas de ${data.clonedFromDate}.`
            : `Work plan criado para ${data.date} com ${data.clonedAssignments} work assignments clonados de ${data.clonedFromDate}.`
          : `Work plan criado para ${data.date}.`
      )
      await loadDailyPlan(selectedDate)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
      setCreatingMode('')
    }
  }

  function openAddModal() {
    if (!selectedWorkPlan) return
    setAssignmentForm(emptyAssignmentForm)
    setFormErrors({})
    setError('')
    setSuccess('')
    setShowAddModal(true)
  }

  function openEditModal(assignment) {
    setAssignmentForm({
      id: assignment.id,
      personId: String(assignment.personId),
      workId: String(assignment.workId),
      notes: assignment.notes || '',
    })
    setFormErrors({})
    setError('')
    setSuccess('')
    setShowAddModal(true)
  }

  function closeAddModal() {
    setShowAddModal(false)
    setAssignmentForm(emptyAssignmentForm)
    setFormErrors({})
  }

  function openMessageModal() {
    if (!selectedWorkPlan || groupedAssignments.length === 0) return

    setSelectedMessageWorkIds(groupedAssignments.map(group => String(group.workId)))
    setMessageSelectionError('')
    setError('')
    setSuccess('')
    setShowMessageModal(true)
  }

  function closeMessageModal() {
    setShowMessageModal(false)
    setSelectedMessageWorkIds([])
    setMessageSelectionError('')
  }

  function handleAssignmentChange(event) {
    const { name, value } = event.target

    setAssignmentForm(current => ({
      ...current,
      [name]: value,
    }))

    setFormErrors(current => ({ ...current, [name]: '' }))
  }

  function validateAssignmentForm() {
    const nextErrors = {}

    if (!assignmentForm.personId) nextErrors.personId = 'Seleciona uma pessoa.'
    if (!assignmentForm.workId) nextErrors.workId = 'Seleciona uma obra.'

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function getDefaultHours() {
    return getDefaultHoursForDate(selectedWorkPlan?.date)
  }

  function handleMessageWorkToggle(workId) {
    const normalizedWorkId = String(workId)

    setSelectedMessageWorkIds(current =>
      current.includes(normalizedWorkId)
        ? current.filter(item => item !== normalizedWorkId)
        : [...current, normalizedWorkId]
    )
    setMessageSelectionError('')
  }

  function selectAllMessageWorks() {
    setSelectedMessageWorkIds(groupedAssignments.map(group => String(group.workId)))
    setMessageSelectionError('')
  }

  function clearMessageWorks() {
    setSelectedMessageWorkIds([])
    setMessageSelectionError('')
  }

  async function handleCopyMessage() {
    if (!generatedMessage.trim()) {
      setMessageSelectionError('Seleciona pelo menos uma obra para criar a mensagem.')
      return
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedMessage)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = generatedMessage
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      setSuccess('Mensagem copiada com sucesso.')
      closeMessageModal()
    } catch (err) {
      setMessageSelectionError('Não foi possível copiar a mensagem.')
    }
  }

  async function handleCreateAssignment(event) {
    event.preventDefault()

    if (!selectedWorkPlan || !validateAssignmentForm()) {
      return
    }

    setSavingAssignment(true)
    setError('')
    setSuccess('')

    try {
      const payload = assignmentForm.id
        ? {
            workPlanId: selectedWorkPlan.id,
            workId: Number(assignmentForm.workId),
            personId: Number(assignmentForm.personId),
            hourlyCost: selectedWork ? Number(selectedWork.defaultHourlyCost ?? 0) : undefined,
            notes: assignmentForm.notes,
          }
        : {
            workPlanId: selectedWorkPlan.id,
            workId: Number(assignmentForm.workId),
            personId: Number(assignmentForm.personId),
            hours: getDefaultHours(),
            hourlyCost: selectedWork ? Number(selectedWork.defaultHourlyCost ?? 0) : undefined,
            notes: assignmentForm.notes,
          }

      const response = await fetch(assignmentForm.id ? `/api/work-assignments/${assignmentForm.id}` : '/api/work-assignments', {
        method: assignmentForm.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar afetação')
      }

      setSuccess(
        assignmentForm.id
          ? `Afetação atualizada para ${data.person?.name || 'pessoa'}.`
          : `Afetação criada para ${data.person?.name || 'pessoa'}.`
      )
      closeAddModal()
      await loadDailyPlan(selectedDate)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingAssignment(false)
    }
  }

  async function handleDeleteAssignment(assignment) {
    const confirmed = window.confirm(
      `Pretendes realmente eliminar a afetação de ${assignment.person?.name || 'esta pessoa'} do work plan ativo?`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/work-assignments/${assignment.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao eliminar afetação')
      }

      setSuccess('Afetação eliminada com sucesso.')
      await loadDailyPlan(selectedDate)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleAssignmentDragStart(assignment) {
    setDraggedAssignmentId(String(assignment.id))
    setDraggedSourceWorkId(String(assignment.workId))
    setDropTargetWorkId(null)
    setError('')
    setSuccess('')
  }

  function handleAssignmentDragEnd() {
    setDraggedAssignmentId(null)
    setDraggedSourceWorkId(null)
    setDropTargetWorkId(null)
  }

  function handleWorkDragOver(event, workId) {
    event.preventDefault()
    if (!draggedAssignmentId) return
    if (String(workId) === String(draggedSourceWorkId)) {
      setDropTargetWorkId(null)
      return
    }
    setDropTargetWorkId(String(workId))
  }

  function handleWorkDragLeave(workId) {
    return
  }

  async function handleWorkDrop(event, targetWorkId) {
    event.preventDefault()

    const assignment = assignments.find(item => String(item.id) === String(draggedAssignmentId || ''))
    const targetWork = activeWorksById.get(String(targetWorkId))

    setDraggedAssignmentId(null)
    setDraggedSourceWorkId(null)
    setDropTargetWorkId(null)

    if (!selectedWorkPlan || !assignment || !targetWork || String(assignment.workId) === String(targetWorkId)) {
      return
    }

    setSavingAssignment(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/work-assignments/${assignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workPlanId: selectedWorkPlan.id,
          workId: Number(targetWorkId),
          personId: Number(assignment.personId),
          hourlyCost: Number(targetWork.defaultHourlyCost ?? assignment.hourlyCost ?? 0),
          notes: assignment.notes || '',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao mover afetação')
      }

      setSuccess(`${assignment.person?.name || 'Pessoa'} movido(a) para a obra #${targetWork.number} - ${targetWork.name}.`)
      await loadDailyPlan(selectedDate)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingAssignment(false)
    }
  }

  const totalAssignments = assignments.length
  const totalPeople = new Set(assignments.map(assignment => assignment.personId)).size
  const totalWorks = groupedAssignments.length
  const totalUnplannedWorks = unplannedWorks.length

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/" style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}>
            Voltar ao menu
          </Link>
          <h1 style={{ margin: '10px 0 12px', fontSize: '44px', lineHeight: 1.05, fontWeight: 900 }}>
            Plano diário
          </h1>

        </section>
        <section style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '-10px' }}>
          <article style={{ ...statCardStyle, flex: '0 0 200px', minWidth: '200px', maxWidth: '200px' }}>
            <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase', fontWeight: 800 }}>Data</div>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              style={{
                ...inputStyle,
                marginTop: '8px',
                fontSize: '12px',
                fontWeight: 700,
                padding: '10px 8px',
                width: '176px',
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            />
          </article>
          <article style={{ ...statCardStyle, flex: 1, minWidth: '120px' }}>
            <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase', fontWeight: 800 }}>Obras planeadas</div>
            <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{totalWorks}</div>
          </article>
          <article style={{ ...statCardStyle, flex: 1, minWidth: '120px' }}>
            <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase', fontWeight: 800 }}>Obras não planeadas</div>
            <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{totalUnplannedWorks}</div>
          </article>
          <article style={{ ...statCardStyle, flex: 0.8, minWidth: '100px' }}>
            <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase', fontWeight: 800 }}>Pessoas afetadas</div>
            <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{totalAssignments}</div>
          </article>
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'stretch', flex: '0 0 200px', minWidth: '200px', maxWidth: '200px' }}>
            <button
              type="button"
              onClick={() => handleCreateWorkPlan(false)}
              disabled={creating || hasWorkPlanForDate}
              style={creating || hasWorkPlanForDate ? { ...disabledButtonStyle, ...pageActionButtonStyle } : { ...primaryButtonStyle, ...pageActionButtonStyle }}
            >
              {creating && creatingMode === 'new' ? 'A criar...' : 'Criar novo'}
            </button>
            <button
              type="button"
              onClick={() => handleCreateWorkPlan(true)}
              disabled={creating}
              style={creating ? { ...disabledButtonStyle, ...pageActionButtonStyle } : { ...secondaryButtonStyle, ...pageActionButtonStyle }}
            >
              {creating && creatingMode === 'clone' ? 'A copiar...' : 'Copiar anterior'}
            </button>
          </div>
        </section>

        {(error || success || loading || (!selectedWorkPlan && !error && !loading)) && (
          <section style={panelStyle}>
            {error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}
            {success && <p style={{ margin: 0, color: '#1f7a45' }}>{success}</p>}
            {loading && <p style={{ margin: 0 }}>A carregar work plan...</p>}
            {!selectedWorkPlan && !error && !loading && (
              <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>
                Ainda não existe work plan para {selectedDate}. Usa Criar novo ou Copiar anterior.
              </p>
            )}
          </section>
        )}

        {!loading && selectedWorkPlan && (
          <section style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                <h2 style={{ margin: 0, fontWeight: 900 }}>Plano do dia</h2>
                <button type="button" onClick={openAddModal} style={{ ...primaryButtonStyle, ...compactActionButtonStyle }}>
                  Adicionar
                </button>
              </div>
            </div>
            {groupedAssignments.length === 0 && (
              <p>Este work plan ainda não tem work assignments associados.</p>
            )}

            {groupedAssignments.length > 0 && (
              <div style={{ display: 'grid', gap: '16px' }}>
                {groupedAssignments.map(group => (
                  <article
                    key={group.workId}
                    onDragOver={(event) => handleWorkDragOver(event, group.workId)}
                    onDragLeave={() => handleWorkDragLeave(group.workId)}
                    onDrop={(event) => handleWorkDrop(event, group.workId)}
                    style={{
                      ...workCardStyle,
                      border:
                        dropTargetWorkId === String(group.workId) ||
                        (draggedSourceWorkId === String(group.workId) && !dropTargetWorkId)
                          ? '2px dashed var(--vp-accent)'
                          : workCardStyle.border,
                      background:
                        dropTargetWorkId === String(group.workId) ||
                        (draggedSourceWorkId === String(group.workId) && !dropTargetWorkId)
                          ? 'var(--vp-highlight)'
                          : workCardStyle.background,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>{group.workName}</h3>
                        <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)' }}>
                          {group.assignments.length} afetações
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '10px' }}>
                      {group.assignments.map(assignment => (
                        <div
                          key={assignment.id}
                          draggable={!savingAssignment}
                          onDragStart={() => handleAssignmentDragStart(assignment)}
                          onDragEnd={handleAssignmentDragEnd}
                          style={{
                            border: '1px solid var(--vp-border)',
                            borderRadius: '14px',
                            padding: '14px',
                            background: 'var(--vp-surface-muted)',
                            cursor: savingAssignment ? 'default' : 'grab',
                            opacity: draggedAssignmentId === String(assignment.id) ? 0.55 : 1,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <div>
                              <strong style={{ fontWeight: 900 }}>{assignment.person?.name || `Pessoa ${assignment.personId}`}</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => openEditModal(assignment)}
                                style={{ ...secondaryButtonStyle, width: '34px', height: '34px', padding: 0, fontSize: '14px' }}
                                title="Editar afetação"
                                aria-label="Editar afetação"
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAssignment(assignment)}
                                style={{ ...dangerButtonStyle, width: '34px', height: '34px', padding: 0, fontSize: '14px' }}
                                title="Eliminar afetação"
                                aria-label="Eliminar afetação"
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                          {assignment.notes && (
                            <p style={{ margin: '6px 0 0', color: 'var(--vp-text-soft)' }}>{assignment.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {unplannedWorks.length > 0 && (
              <div style={{ display: 'grid', gap: '14px', marginTop: '22px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Obras disponíveis para receber pessoas</h3>
                  <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)' }}>
                    Também podes puxar um nome para uma obra que ainda não tenha afetações neste dia.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {unplannedWorks.map(work => (
                    <article
                      key={work.id}
                      onDragOver={(event) => handleWorkDragOver(event, work.id)}
                      onDragLeave={() => handleWorkDragLeave(work.id)}
                      onDrop={(event) => handleWorkDrop(event, work.id)}
                      style={{
                        border: dropTargetWorkId === String(work.id) ? '2px dashed var(--vp-accent)' : '1px dashed var(--vp-border)',
                        borderRadius: '18px',
                        padding: '16px',
                        background: dropTargetWorkId === String(work.id) ? 'var(--vp-highlight)' : 'var(--vp-surface)',
                      }}
                    >
                      <strong>#{work.number} - {work.name}</strong>
                      <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                        Larga aqui para mover uma pessoa para esta obra.
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                onClick={openMessageModal}
                disabled={groupedAssignments.length === 0}
                style={
                  groupedAssignments.length === 0
                    ? { ...disabledButtonStyle, ...compactActionButtonStyle }
                    : { ...secondaryButtonStyle, ...compactActionButtonStyle }
                }
              >
                Importar mensagem
              </button>
            </div>

          </section>
        )}
      </div>

      {showAddModal && selectedWorkPlan && (
        <div style={modalBackdropStyle} onClick={closeAddModal}>
          <section style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{assignmentForm.id ? 'Editar afetação' : 'Adicionar afetação'}</h2>
              <button type="button" onClick={closeAddModal} style={closeButtonStyle} aria-label="Fechar">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <label style={labelStyle}>
                  Pessoa
                  <select name="personId" value={assignmentForm.personId} onChange={handleAssignmentChange} style={inputStyle}>
                    <option value="">Seleciona uma pessoa</option>
                    {defaults.people.map(person => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.personId && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.personId}</span>}
                </label>

                <label style={labelStyle}>
                  Obra
                  <select name="workId" value={assignmentForm.workId} onChange={handleAssignmentChange} style={inputStyle}>
                    <option value="">Seleciona uma obra</option>
                    {activeWorks.map(work => (
                      <option key={work.id} value={work.id}>
                        #{work.number} - {work.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.workId && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.workId}</span>}
                </label>
              </div>

              <label style={labelStyle}>
                Notas
                <textarea name="notes" value={assignmentForm.notes} onChange={handleAssignmentChange} rows={4} style={inputStyle} />
              </label>

              <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--vp-highlight)', color: 'var(--vp-highlight-text)' }}>
                <strong>Resumo:</strong>{' '}
                {selectedWork ? `Obra #${selectedWork.number} - ${selectedWork.name}` : 'Escolhe uma obra'}
                {' | '}
                {selectedPerson ? `Pessoa: ${selectedPerson.name}` : 'Escolhe uma pessoa'}
                {' | '}
                {selectedWork ? `Preço hora automático: ${selectedWork.defaultHourlyCost ?? 0}/h` : 'Preço hora automático pela obra'}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="submit" disabled={savingAssignment} style={primaryButtonStyle}>
                  {savingAssignment ? 'A gravar...' : assignmentForm.id ? 'Guardar alterações' : 'Criar afetação'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showMessageModal && selectedWorkPlan && (
        <div style={modalBackdropStyle} onClick={closeMessageModal}>
          <section style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Importar mensagem</h2>
              <button type="button" onClick={closeMessageModal} style={closeButtonStyle} aria-label="Fechar">
                ×
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
              <button type="button" onClick={selectAllMessageWorks} style={secondaryButtonStyle}>
                Selecionar todas
              </button>
              <button type="button" onClick={clearMessageWorks} style={secondaryButtonStyle}>
                Limpar seleção
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px', marginTop: '18px' }}>
              {groupedAssignments.map(group => {
                const checked = selectedMessageWorkIds.includes(String(group.workId))

                return (
                  <label
                    key={group.workId}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      padding: '14px 16px',
                      borderRadius: '16px',
                      border: `1px solid ${checked ? 'var(--vp-accent)' : 'var(--vp-border)'}`,
                      background: checked ? 'var(--vp-highlight)' : 'var(--vp-surface)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleMessageWorkToggle(group.workId)}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <strong>{group.workName}</strong>
                      <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>
                        {group.assignments.map(assignment => assignment.person?.name || `Pessoa ${assignment.personId}`).join(', ')}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>

            <label style={{ ...labelStyle, marginTop: '18px' }}>
              Pré-visualização da mensagem
              <textarea
                readOnly
                value={generatedMessage}
                rows={12}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
              />
            </label>

            {messageSelectionError && (
              <p style={{ margin: '12px 0 0', color: '#b42318' }}>{messageSelectionError}</p>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
              <button type="button" onClick={handleCopyMessage} style={primaryButtonStyle}>
                Copiar mensagem
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
