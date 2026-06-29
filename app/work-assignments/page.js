'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import EditPencilIcon, { editPencilButtonStyle } from '../components/EditPencilIcon'
import { ViewportPage, ViewportScrollArea, ViewportShell } from '../components/ViewportLayout.js'
import {
  deleteWorkAssignment,
  listWorkAssignments,
  saveWorkAssignment,
} from '../../frontend/controllers/work-assignments-controller.js'
import { getDefaultHoursForDate } from '../../lib/default-hours.js'
import { getEntityRoleLabel } from '../../lib/roles.js'

const DURATION_OPTIONS = [
  0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6,
  6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12,
]

const pageStyle = {
  minHeight: '100vh',
  padding: '40px 24px 60px',
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
  padding: '28px',
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

const panelStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-panel)',
}

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px',
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
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  border: '1px solid var(--vp-accent)',
  borderRadius: '999px',
  padding: '10px 16px',
  background: 'transparent',
  color: 'var(--vp-accent)',
  fontWeight: 700,
  cursor: 'pointer',
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

const iconButtonStyle = editPencilButtonStyle

const iconDangerButtonStyle = {
  ...dangerButtonStyle,
  width: '34px',
  height: '34px',
  padding: 0,
  fontSize: '14px',
}

const today = new Date().toISOString().slice(0, 10)
const emptyForm = {
  id: null,
  workId: '',
  personId: '',
  date: today,
  hours: String(getDefaultHoursForDate(today)),
  hourlyCost: '',
  notes: '',
}

export default function WorkAssignmentsPage() {
  const [defaults, setDefaults] = useState({ people: [], works: [] })
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [customRate, setCustomRate] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [draggedAssignmentId, setDraggedAssignmentId] = useState(null)

  useEffect(() => {
    loadPageData()
  }, [])

  const selectedPerson = useMemo(
    () => defaults.people.find(person => String(person.id) === String(form.personId)),
    [defaults.people, form.personId],
  )

  const activeWorks = useMemo(
    () => defaults.works.filter(work => work.status !== 'completed'),
    [defaults.works],
  )

  const selectedWork = useMemo(
    () => activeWorks.find(work => String(work.id) === String(form.workId)),
    [activeWorks, form.workId],
  )

  const worksWithAssignments = useMemo(() => {
    return activeWorks
      .map(work => ({
      ...work,
      assignments: assignments.filter(assignment => Number(assignment.workId) === Number(work.id)),
    }))
  }, [activeWorks, assignments])

  useEffect(() => {
    if (selectedPerson && selectedWork && !customRate) {
      setForm(current => ({
        ...current,
        hourlyCost: String(selectedWork.defaultHourlyCost ?? 0),
      }))
    }

    if ((!selectedPerson || !selectedWork) && !customRate) {
      setForm(current => ({
        ...current,
        hourlyCost: '',
      }))
    }
  }, [selectedPerson, selectedWork, customRate])

  async function loadPageData() {
    setLoading(true)
    setError('')

    try {
      const data = await listWorkAssignments({ includeDefaults: true }, 'Erro ao carregar dados')

      setDefaults(data.defaults)
      setAssignments(data.items)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function startCreate() {
    setForm(emptyForm)
    setCustomRate(false)
    setShowForm(true)
    setError('')
    setSuccess('')
    setFormErrors({})
  }

  function startEdit(assignment) {
    setForm({
      id: assignment.id,
      workId: String(assignment.workId),
      personId: String(assignment.personId),
      date: assignment.date,
      hours: String(assignment.hours),
      hourlyCost: String(assignment.hourlyCost),
      notes: assignment.notes || '',
    })
    setCustomRate(true)
    setShowForm(true)
    setError('')
    setSuccess('')
    setFormErrors({})
  }

  function cancelForm() {
    setForm(emptyForm)
    setCustomRate(false)
    setShowForm(false)
    setFormErrors({})
  }

  function handleChange(event) {
    const { name, value } = event.target

    if (name === 'personId' || name === 'workId') {
      setCustomRate(false)
    }

    if (name === 'hourlyCost') {
      setCustomRate(true)
    }

    setForm(current => {
      if (name === 'date' && !current.id) {
        return {
          ...current,
          date: value,
          hours: String(getDefaultHoursForDate(value)),
        }
      }

      return {
        ...current,
        [name]: value,
      }
    })

    setFormErrors(current => ({
      ...current,
      [name]: '',
    }))
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.workId) nextErrors.workId = 'Seleciona uma obra.'
    if (!form.personId) nextErrors.personId = 'Seleciona uma pessoa.'
    if (!form.date) {
      nextErrors.date = 'Seleciona uma data.'
    } else if (Number.isNaN(new Date(form.date).getTime())) {
      nextErrors.date = 'Data inválida.'
    }

    if (!form.hours || Number(form.hours) <= 0) {
      nextErrors.hours = 'A duração tem de ser maior que 0.'
    }

    if (form.hourlyCost === '' || Number(form.hourlyCost) < 0) {
      nextErrors.hourlyCost = 'O preço hora não pode ser negativo.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setSubmitting(true)

    try {
      const payload = {
        workId: Number(form.workId),
        personId: Number(form.personId),
        date: form.date,
        hours: Number(form.hours),
        hourlyCost: Number(form.hourlyCost),
        notes: form.notes,
      }

      const data = await saveWorkAssignment(form.id, payload, 'Erro ao gravar afetação')

      await loadPageData()
      setSuccess(form.id ? 'Afetação atualizada com sucesso.' : `Afetação criada para ${data.person?.name || 'pessoa'}.`)
      setForm(emptyForm)
      setCustomRate(false)
      setShowForm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await deleteWorkAssignment(id, 'Erro ao remover afetação')

      await loadPageData()
      setSuccess('Afetação removida com sucesso.')
      setShowForm(false)
      setForm(emptyForm)
      setCustomRate(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function moveAssignmentToWork(assignmentId, targetWorkId) {
    const assignment = assignments.find(item => Number(item.id) === Number(assignmentId))
    const targetWork = activeWorks.find(item => Number(item.id) === Number(targetWorkId))

    if (!assignment || !targetWork || Number(assignment.workId) === Number(targetWorkId)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const data = await saveWorkAssignment(
        assignmentId,
        {
          workId: Number(targetWorkId),
          personId: assignment.personId,
          date: assignment.date,
          hours: assignment.hours,
          hourlyCost: targetWork.defaultHourlyCost ?? assignment.hourlyCost,
          notes: assignment.notes,
        },
        'Erro ao mover afetação',
      )

      await loadPageData()
      setSuccess(`Afetação movida para a obra #${data.work?.number || targetWork.number}.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setDraggedAssignmentId(null)
    }
  }

  const totalAssignments = assignments.length
  const assignedPeople = new Set(assignments.map(item => item.personId)).size
  const worksInUse = new Set(
    assignments
      .filter(item => activeWorks.some(work => Number(work.id) === Number(item.workId)))
      .map(item => item.workId)
  ).size

  return (
    <ViewportPage lockViewport style={pageStyle}>
      <ViewportShell fillHeight style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/" style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}>            {'<- '}Voltar ao menu
          </Link>
          <p style={{ margin: '18px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: 'var(--vp-text-soft)' }}>
            Afetações
          </p>
          <h1 style={{ margin: '10px 0 12px', fontSize: '46px', lineHeight: 1.05 }}>
            Pessoas afetas por obra
          </h1>

        </section>

        <ViewportScrollArea style={{ '--vp-page-scroll-gap': '24px' }}>
          <section style={topBarStyle}>
          <div className="vp-responsive-stat-grid" style={statGridStyle}>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Afetações</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{totalAssignments}</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Pessoas afetas</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{assignedPeople}</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Obras com afetações</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{worksInUse}</div>
            </article>
          </div>

          <button type="button" onClick={startCreate} style={primaryButtonStyle}>
            Nova afetação
          </button>
        </section>

        {showForm && (
          <section style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>{form.id ? 'Editar afetação' : 'Nova afetação'}</h2>
                {form.id ? (
                  <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)', fontSize: '13px', fontWeight: 700 }}>
                    Assignment ID: {form.id}
                  </p>
                ) : null}
                <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)' }}>
                  Ao mudar a obra numa afetação existente, a pessoa passa a ficar associada a outra obra.
                </p>
              </div>
              <button type="button" onClick={cancelForm} style={secondaryButtonStyle}>
                Fechar
              </button>
            </div>

            {!loading && (
              <form onSubmit={handleSubmit} style={{ marginTop: '18px' }}>
                <div style={formGridStyle}>
                  <label style={labelStyle}>
                    Obra
                    <select name="workId" value={form.workId} onChange={handleChange} style={inputStyle}>
                      <option value="">Seleciona uma obra</option>
                      {activeWorks.map(work => (
                        <option key={work.id} value={work.id}>
                          #{work.number} - {work.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.workId && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.workId}</span>}
                  </label>

                  <label style={labelStyle}>
                    Pessoa
                    <select name="personId" value={form.personId} onChange={handleChange} style={inputStyle}>
                      <option value="">Seleciona uma pessoa</option>
                      {defaults.people.map(person => (
                        <option key={person.id} value={person.id}>
                          {person.name} ({getEntityRoleLabel(person)})
                        </option>
                      ))}
                    </select>
                    {formErrors.personId && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.personId}</span>}
                  </label>

                  <label style={labelStyle}>
                    Data
                    <input type="date" name="date" value={form.date} onChange={handleChange} style={inputStyle} />
                    {formErrors.date && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.date}</span>}
                  </label>

                  <label style={labelStyle}>
                    Duração
                    <select name="hours" value={form.hours} onChange={handleChange} style={inputStyle}>
                      {DURATION_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option} horas
                        </option>
                      ))}
                    </select>
                    {formErrors.hours && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.hours}</span>}
                  </label>

                  <label style={labelStyle}>
                    Preço hora nesta obra
                    <input
                      type="number"
                      name="hourlyCost"
                      min="0"
                      step="0.01"
                      value={form.hourlyCost}
                      onChange={handleChange}
                      disabled={!customRate}
                      style={inputStyle}
                    />
                    {formErrors.hourlyCost && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.hourlyCost}</span>}
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {!customRate && (
                        <button
                          type="button"
                          style={secondaryButtonStyle}
                          onClick={() => {
                            if (!selectedPerson || !selectedWork) return
                            setCustomRate(true)
                          }}
                          disabled={!selectedPerson || !selectedWork}
                        >
                          Alterar preço
                        </button>
                      )}
                      {customRate && (
                        <button
                          type="button"
                          style={secondaryButtonStyle}
                          onClick={() => {
                            setCustomRate(false)
                            setForm(current => ({
                              ...current,
                              hourlyCost: selectedWork ? String(selectedWork.defaultHourlyCost ?? 0) : '',
                            }))
                          }}
                        >
                          Repor preço por defeito
                        </button>
                      )}
                    </div>
                  </label>

                  <label style={labelStyle}>
                    Notas
                    <input type="text" name="notes" value={form.notes} onChange={handleChange} placeholder="Opcional" style={inputStyle} />
                  </label>
                </div>

                <div style={{ marginTop: '18px', display: 'grid', gap: '10px' }}>
                  <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--vp-highlight)', color: 'var(--vp-highlight-text)' }}>
                    <strong>Resumo:</strong>{' '}
                    {selectedWork ? `Obra #${selectedWork.number} - ${selectedWork.name}` : 'Escolhe uma obra'}
                    {' | '}
                    {selectedPerson ? `Pessoa: ${selectedPerson.name}` : 'Escolhe uma pessoa'}
                    {' | '}
                    {selectedWork && selectedPerson
                      ? `Preço hora aplicado: ${form.hourlyCost || 0}/h`
                      : 'Seleciona obra e pessoa'}
                  </div>

                  {error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}
                  {success && <p style={{ margin: 0, color: '#1f7a45' }}>{success}</p>}

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="submit" disabled={submitting} style={primaryButtonStyle}>
                      {submitting ? 'A gravar...' : form.id ? 'Guardar alterações' : 'Gravar afetação'}
                    </button>
                    {form.id && (
                      <button type="button" onClick={() => handleDelete(form.id)} disabled={submitting} style={iconDangerButtonStyle} title="Eliminar afetação" aria-label="Eliminar afetação">
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </section>
        )}

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Obras ativas com pessoas afetas</h2>
          {loading && <p>A carregar obras, pessoas e afetações...</p>}
          {!loading && worksWithAssignments.length === 0 && <p>Sem obras registadas.</p>}
          {!loading && worksWithAssignments.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {worksWithAssignments.map(work => (
                <article
                  key={work.id}
                  style={{
                    border: '1px solid var(--vp-border)',
                    borderRadius: '18px',
                    padding: '18px',
                    background: 'var(--vp-surface)',
                    display: 'grid',
                    gap: '14px',
                    minHeight: '220px',
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    const assignmentId = event.dataTransfer.getData('text/plain') || draggedAssignmentId
                    if (assignmentId) {
                      moveAssignmentToWork(Number(assignmentId), work.id)
                    }
                  }}
                >
                  <div>
                    <strong>#{work.number} - {work.name}</strong>
                    <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>
                      Preço hora por defeito: {work.defaultHourlyCost || 0}/h
                    </p>
                  </div>

                  {work.assignments.length === 0 && <p style={{ margin: 0, color: 'var(--vp-text-soft)' }}>Sem pessoas afetas nesta obra.</p>}

                  {work.assignments.length > 0 && (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {work.assignments.map(assignment => (
                        <div
                          key={assignment.id}
                          draggable
                          onDragStart={(event) => {
                            setDraggedAssignmentId(assignment.id)
                            event.dataTransfer.setData('text/plain', String(assignment.id))
                            event.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragEnd={() => {
                            setDraggedAssignmentId(null)
                          }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '12px',
                            alignItems: 'center',
                            border: '1px solid var(--vp-border)',
                            borderRadius: '14px',
                            padding: '14px',
                            background: draggedAssignmentId === assignment.id ? 'var(--vp-highlight)' : 'var(--vp-surface-alt)',
                            cursor: 'grab',
                          }}
                        >
                          <div>
                            <strong>{assignment.person?.name || `Pessoa ${assignment.personId}`}</strong>
                            <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)', fontSize: '13px', fontWeight: 700 }}>
                              {getEntityRoleLabel(assignment.person)}
                            </p>
                            <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>
                              {assignment.date} | {assignment.hours}h | {assignment.hourlyCost}/h | Total {assignment.totalCost}
                            </p>
                            {assignment.notes && <p style={{ margin: '6px 0 0', color: 'var(--vp-text-soft)' }}>{assignment.notes}</p>}
                          </div>

                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => startEdit(assignment)} style={iconButtonStyle} title="Editar afetação" aria-label="Editar afetação">
                              <EditPencilIcon />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
        </ViewportScrollArea>
      </ViewportShell>
    </ViewportPage>
  )
}
