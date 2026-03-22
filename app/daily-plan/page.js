'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const pageStyle = {
  minHeight: '100vh',
  padding: '40px 24px 60px',
  background: 'linear-gradient(180deg, #f4efe5 0%, #e8f0eb 100%)',
  color: '#1d2a24',
  fontFamily: 'Georgia, serif',
}

const shellStyle = {
  maxWidth: '1180px',
  margin: '0 auto',
  display: 'grid',
  gap: '24px',
}

const heroStyle = {
  background: 'linear-gradient(135deg, rgba(255,251,245,0.95) 0%, rgba(231,240,235,0.95) 100%)',
  border: '1px solid #d6d3ca',
  borderRadius: '28px',
  padding: '28px',
  boxShadow: '0 24px 60px rgba(42, 63, 53, 0.10)',
}

const panelStyle = {
  background: 'rgba(255, 252, 247, 0.9)',
  border: '1px solid #d4d2c8',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 16px 40px rgba(54, 72, 63, 0.08)',
}

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(28, 36, 32, 0.38)',
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
  background: 'rgba(255, 252, 247, 0.98)',
  border: '1px solid #d4d2c8',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: '0 24px 70px rgba(28, 36, 32, 0.18)',
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
  borderRadius: '18px',
  padding: '18px',
  background: '#fff',
  border: '1px solid #d7ddd6',
}

const inputStyle = {
  width: '100%',
  marginTop: '8px',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #bfc7bc',
  background: '#fffdfa',
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
  background: '#285943',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  border: '1px solid #285943',
  borderRadius: '999px',
  padding: '10px 16px',
  background: 'transparent',
  color: '#285943',
  fontWeight: 700,
  cursor: 'pointer',
}

const disabledButtonStyle = {
  ...primaryButtonStyle,
  background: '#a9b8b0',
  cursor: 'not-allowed',
}

const dangerButtonStyle = {
  border: '1px solid #b42318',
  borderRadius: '999px',
  padding: '10px 16px',
  background: 'transparent',
  color: '#b42318',
  fontWeight: 700,
  cursor: 'pointer',
}

const workCardStyle = {
  border: '1px solid #d7ddd6',
  borderRadius: '20px',
  padding: '20px',
  background: '#fff',
  display: 'grid',
  gap: '14px',
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
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
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
        existing.totalHours += Number(assignment.hours) || 0
        existing.totalCost += Number(assignment.totalCost) || 0
      } else {
        groups.set(key, {
          workId: assignment.work?.id || assignment.workId,
          workNumber: assignment.work?.number || '-',
          workName: assignment.work?.name || `Obra ${assignment.workId}`,
          assignments: [assignment],
          totalHours: Number(assignment.hours) || 0,
          totalCost: Number(assignment.totalCost) || 0,
        })
      }
    }

    return Array.from(groups.values()).sort((left, right) => Number(left.workNumber) - Number(right.workNumber))
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

  async function handleCreateWorkPlan() {
    if (hasWorkPlanForDate) return

    setCreating(true)
    setError('')
    setSuccess('')

    try {
      const clonePreviousDay = window.confirm(
        'Queres manter o ultimo plano anterior com work assignments? Se escolheres OK, o novo work plan vai clonar essas afetacoes.'
      )

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
        data.clonedAssignments > 0
          ? `Work plan criado para ${data.date} com ${data.clonedAssignments} work assignments clonados de ${data.clonedFromDate}.`
          : `Work plan criado para ${data.date}.`
      )
      await loadDailyPlan(selectedDate)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
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
            hours: 8,
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
        throw new Error(data.error || 'Erro ao criar work assignment')
      }

      setSuccess(
        assignmentForm.id
          ? `Work assignment atualizado para ${data.person?.name || 'pessoa'}.`
          : `Work assignment criado para ${data.person?.name || 'pessoa'}.`
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
      `Pretendes realmente eliminar a afetacao de ${assignment.person?.name || 'esta pessoa'} do work plan ativo?`
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
        throw new Error(data.error || 'Erro ao eliminar work assignment')
      }

      setSuccess('Work assignment eliminado com sucesso.')
      await loadDailyPlan(selectedDate)
    } catch (err) {
      setError(err.message)
    }
  }

  const totalAssignments = assignments.length
  const totalPeople = new Set(assignments.map(assignment => assignment.personId)).size
  const totalWorks = groupedAssignments.length

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/" style={{ color: '#285943', textDecoration: 'none', fontWeight: 700 }}>
            Voltar ao menu
          </Link>
          <p style={{ margin: '18px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: '#5f6f66' }}>
            Plano diario
          </p>
          <h1 style={{ margin: '10px 0 12px', fontSize: '44px', lineHeight: 1.05 }}>
            Work plan diario
          </h1>
          <p style={{ margin: 0, color: '#4d5c55', fontSize: '17px', lineHeight: 1.7 }}>
            Seleciona uma data para encontrar o work plan desse dia. Se ainda nao existir, podes criá-lo a partir do cabecalho.
          </p>
        </section>

        <section style={topBarStyle}>
          <div style={{ minWidth: '280px', maxWidth: '360px', flex: '0 1 360px' }}>
            <label style={labelStyle}>
              Data do work plan
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                style={inputStyle}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleCreateWorkPlan}
            disabled={creating || hasWorkPlanForDate}
            style={creating || hasWorkPlanForDate ? disabledButtonStyle : primaryButtonStyle}
          >
            {creating ? 'A criar...' : 'Criar work plan'}
          </button>
        </section>

        <section style={statGridStyle}>
          <article style={statCardStyle}>
            <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Work plan</div>
            <div style={{ marginTop: '8px', fontSize: '22px', fontWeight: 700 }}>
              {selectedWorkPlan ? `#${selectedWorkPlan.id}` : 'Nao existe'}
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Obras no plano</div>
            <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{totalWorks}</div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Work assignments</div>
            <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{totalAssignments}</div>
          </article>
        </section>

        <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>Plano do dia</h2>
              <p style={{ margin: '8px 0 0', color: '#4d5c55' }}>
                {selectedWorkPlan
                  ? `Work plan #${selectedWorkPlan.id} para ${selectedWorkPlan.date}`
                  : `Nao existe work plan para ${selectedDate}.`}
              </p>
            </div>
            {selectedWorkPlan && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ color: '#4d5c55', fontWeight: 700 }}>
                  Pessoas afetas: {totalPeople}
                </div>
                <button type="button" onClick={openAddModal} style={primaryButtonStyle}>
                  Adicionar
                </button>
              </div>
            )}
          </div>

          {error && <p style={{ margin: '16px 0 0', color: '#b42318' }}>{error}</p>}
          {success && <p style={{ margin: '16px 0 0', color: '#1f7a45' }}>{success}</p>}
          {loading && <p style={{ margin: '16px 0 0' }}>A carregar work plan...</p>}

          {!loading && !selectedWorkPlan && !error && (
            <p style={{ margin: '16px 0 0', color: '#4d5c55' }}>
              Escolhe esta data e usa o botao no topo para criar o work plan.
            </p>
          )}
        </section>

        {!loading && selectedWorkPlan && (
          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Work assignments por obra</h2>
            {groupedAssignments.length === 0 && (
              <p>Este work plan ainda nao tem work assignments associados.</p>
            )}

            {groupedAssignments.length > 0 && (
              <div style={{ display: 'grid', gap: '16px' }}>
                {groupedAssignments.map(group => (
                  <article key={group.workId} style={workCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '22px' }}>
                          #{group.workNumber} - {group.workName}
                        </h3>
                        <p style={{ margin: '8px 0 0', color: '#4d5c55' }}>
                          {group.assignments.length} afetacoes | {group.totalHours} horas | custo total {Number(group.totalCost.toFixed(2))}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '10px' }}>
                      {group.assignments.map(assignment => (
                        <div
                          key={assignment.id}
                          style={{
                            border: '1px solid #e1e6df',
                            borderRadius: '14px',
                            padding: '14px',
                            background: '#fcfcfa',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <div>
                              <strong>{assignment.person?.name || `Pessoa ${assignment.personId}`}</strong>
                              <p style={{ margin: '6px 0 0', color: '#4f5d56' }}>
                                {assignment.hours}h | {assignment.hourlyCost}/h | Total {assignment.totalCost}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button type="button" onClick={() => openEditModal(assignment)} style={secondaryButtonStyle}>
                                Editar
                              </button>
                              <button type="button" onClick={() => handleDeleteAssignment(assignment)} style={dangerButtonStyle}>
                                Eliminar
                              </button>
                            </div>
                          </div>
                          {assignment.notes && (
                            <p style={{ margin: '6px 0 0', color: '#6a756f' }}>{assignment.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {showAddModal && selectedWorkPlan && (
        <div style={modalBackdropStyle} onClick={closeAddModal}>
          <section style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>{assignmentForm.id ? 'Editar work assignment' : 'Adicionar work assignment'}</h2>
                <p style={{ margin: '8px 0 0', color: '#4d5c55' }}>
                  {assignmentForm.id
                    ? `Vais editar a afetacao ligada ao work plan #${selectedWorkPlan.id} de ${selectedWorkPlan.date}.`
                    : `Vais criar uma nova afetacao ligada ao work plan #${selectedWorkPlan.id} de ${selectedWorkPlan.date}.`}
                </p>
              </div>
              <button type="button" onClick={closeAddModal} style={secondaryButtonStyle}>
                Fechar
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

              <div style={{ padding: '14px 16px', borderRadius: '14px', background: '#eef3ef', color: '#32443c' }}>
                <strong>Resumo:</strong>{' '}
                {selectedWork ? `Obra #${selectedWork.number} - ${selectedWork.name}` : 'Escolhe uma obra'}
                {' | '}
                {selectedPerson ? `Pessoa: ${selectedPerson.name}` : 'Escolhe uma pessoa'}
                {' | '}
                {selectedWork ? `Preco hora automatico: ${selectedWork.defaultHourlyCost ?? 0}/h` : 'Preco hora automatico pela obra'}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="submit" disabled={savingAssignment} style={primaryButtonStyle}>
                  {savingAssignment ? 'A gravar...' : assignmentForm.id ? 'Guardar alteracoes' : 'Criar work assignment'}
                </button>
                <button type="button" onClick={closeAddModal} style={secondaryButtonStyle}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
