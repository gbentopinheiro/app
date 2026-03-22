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
  maxWidth: '1240px',
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
  borderRadius: '18px',
  padding: '18px',
  background: '#fff',
  border: '1px solid #d7ddd6',
}

const layoutStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(320px, 0.95fr) minmax(0, 1.35fr)',
  gap: '24px',
}

const panelStyle = {
  background: 'rgba(255, 252, 247, 0.9)',
  border: '1px solid #d4d2c8',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 16px 40px rgba(54, 72, 63, 0.08)',
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
  padding: '13px 20px',
  background: 'transparent',
  color: '#285943',
  fontWeight: 700,
  cursor: 'pointer',
}

const dangerButtonStyle = {
  border: '1px solid #b42318',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'transparent',
  color: '#b42318',
  fontWeight: 700,
  cursor: 'pointer',
}

const emptyPersonForm = {
  id: null,
  name: '',
  price: '',
  monthlyPrice: '',
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
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

export default function PeoplePage() {
  const [people, setPeople] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [form, setForm] = useState(emptyPersonForm)
  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadPeople()
  }, [])

  const selectedPerson = useMemo(
    () => people.find(person => Number(person.id) === Number(selectedPersonId)) || people[0] || null,
    [people, selectedPersonId],
  )

  useEffect(() => {
    if (!selectedPersonId && people[0]) {
      setSelectedPersonId(people[0].id)
    }
  }, [selectedPersonId, people])

  const monthlyPeople = useMemo(() => people.filter(person => person.isMonthlyBilling), [people])
  const hourlyPeople = useMemo(() => people.filter(person => !person.isMonthlyBilling), [people])
  const monthlyAssignmentSummary = useMemo(() => {
    if (!selectedPerson) return []

    const personAssignments = assignments.filter(
      assignment => Number(assignment.personId) === Number(selectedPerson.id) && assignment.date,
    )

    const monthMap = new Map()

    personAssignments.forEach(assignment => {
      const monthKey = String(assignment.date).slice(0, 7)
      const currentMonth = monthMap.get(monthKey) || {
        monthKey,
        totalHours: 0,
        days: new Map(),
      }

      currentMonth.totalHours += Number(assignment.hours) || 0

      const currentDay = currentMonth.days.get(assignment.date) || {
        date: assignment.date,
        totalHours: 0,
        works: new Map(),
      }

      currentDay.totalHours += Number(assignment.hours) || 0

      const workName = assignment.work?.name || `Obra ${assignment.workId}`
      const currentWork = currentDay.works.get(workName) || {
        name: workName,
        hours: 0,
      }

      currentWork.hours += Number(assignment.hours) || 0
      currentDay.works.set(workName, currentWork)
      currentMonth.days.set(assignment.date, currentDay)
      monthMap.set(monthKey, currentMonth)
    })

    return Array.from(monthMap.values())
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      .map(month => ({
        monthKey: month.monthKey,
        label: formatMonthLabel(month.monthKey),
        totalHours: Number(month.totalHours.toFixed(2)),
        days: Array.from(month.days.values())
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(day => ({
            ...day,
            totalHours: Number(day.totalHours.toFixed(2)),
            works: Array.from(day.works.values()).sort((a, b) => a.name.localeCompare(b.name)).map(work => ({
              ...work,
              hours: Number(work.hours.toFixed(2)),
            })),
          })),
      }))
  }, [assignments, selectedPerson])

  async function loadPeople() {
    setLoading(true)
    setError('')

    try {
      const [peopleResponse, assignmentsResponse] = await Promise.all([
        fetch('/api/people'),
        fetch('/api/work-assignments'),
      ])

      const peopleData = await peopleResponse.json()
      const assignmentsData = await assignmentsResponse.json()

      if (!peopleResponse.ok) throw new Error(peopleData.error || 'Erro ao carregar pessoas')
      if (!assignmentsResponse.ok) throw new Error(assignmentsData.error || 'Erro ao carregar afetacoes')

      setPeople(peopleData)
      setAssignments(assignmentsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setFormErrors(current => ({ ...current, [name]: '' }))
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = 'O nome e obrigatorio.'
    if (form.price === '' || Number(form.price) < 0) nextErrors.price = 'O preco hora nao pode ser negativo.'
    if (form.monthlyPrice === '' || Number(form.monthlyPrice) < 0) nextErrors.monthlyPrice = 'O preco mensal nao pode ser negativo.'

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function startCreate() {
    setForm(emptyPersonForm)
    setShowForm(true)
    setError('')
    setSuccess('')
    setFormErrors({})
  }

  function startEdit(person) {
    setForm({
      id: person.id,
      name: person.name ?? '',
      price: person.price ?? 0,
      monthlyPrice: person.monthlyPrice ?? 0,
    })
    setShowForm(true)
    setError('')
    setSuccess('')
    setFormErrors({})
  }

  function cancelForm() {
    setShowForm(false)
    setForm(emptyPersonForm)
    setFormErrors({})
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setSubmitting(true)

    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        monthlyPrice: Number(form.monthlyPrice),
      }

      const url = form.id ? `/api/people/${form.id}` : '/api/people'
      const method = form.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao gravar pessoa')

      await loadPeople()
      setSelectedPersonId(data.id)
      setSuccess(form.id ? 'Pessoa atualizada com sucesso.' : 'Pessoa criada com sucesso.')
      setShowForm(false)
      setForm(emptyPersonForm)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(personId) {
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/people/${personId}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao eliminar pessoa')

      await loadPeople()
      setSelectedPersonId(null)
      setSuccess('Pessoa removida com sucesso.')
      setShowForm(false)
      setForm(emptyPersonForm)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function renderPersonRow(person) {
    const selected = Number(selectedPerson?.id) === Number(person.id)

    return (
      <button
        key={person.id}
        type="button"
        onClick={() => setSelectedPersonId(person.id)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '16px',
          borderRadius: '16px',
          border: selected ? '1px solid #285943' : '1px solid #d7ddd6',
          background: selected ? '#eef5f0' : '#fff',
          cursor: 'pointer',
        }}
      >
        <strong>{person.name}</strong>
        <p style={{ margin: '6px 0 0', color: '#4f5d56' }}>Preco hora: {person.price || 0}/h</p>
        <p style={{ margin: '6px 0 0', color: '#4f5d56' }}>
          {person.isMonthlyBilling ? `Mensal: ${person.monthlyPrice || 0}` : 'Faturacao horaria'}
        </p>
      </button>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/" style={{ color: '#285943', textDecoration: 'none', fontWeight: 700 }}>
            ← Voltar ao menu
          </Link>
          <p style={{ margin: '18px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: '#5f6f66' }}>
            Gestao de pessoas
          </p>
          <h1 style={{ margin: '10px 0 12px', fontSize: '46px', lineHeight: 1.05 }}>
            Lista e manutencao de pessoas
          </h1>
          <p style={{ margin: 0, maxWidth: '780px', color: '#4d5c55', fontSize: '17px', lineHeight: 1.7 }}>
            Consulta, cria, edita e elimina pessoas diretamente nesta area. A lista fica separada do detalhe para uma
            navegacao mais clara e mais profissional.
          </p>
        </section>

        <section style={topBarStyle}>
          <div style={statGridStyle}>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Pessoas totais</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{people.length}</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Mensais</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{monthlyPeople.length}</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Horarias</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{hourlyPeople.length}</div>
            </article>
          </div>

          <button type="button" onClick={startCreate} style={primaryButtonStyle}>
            Adicionar pessoa
          </button>
        </section>

        {showForm && (
          <section style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>{form.id ? 'Editar pessoa' : 'Adicionar nova pessoa'}</h2>
                <p style={{ margin: '8px 0 0', color: '#4d5c55' }}>
                  Define o nome e os valores da pessoa. Se houver mensalidade, o sistema marca automaticamente o perfil como mensal.
                </p>
              </div>
              <button type="button" onClick={cancelForm} style={secondaryButtonStyle}>
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <label style={labelStyle}>
                  Nome
                  <input type="text" name="name" value={form.name} onChange={handleChange} style={inputStyle} />
                  {formErrors.name && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.name}</span>}
                </label>

                <label style={labelStyle}>
                  Preco hora
                  <input type="number" name="price" min="0" step="0.01" value={form.price} onChange={handleChange} style={inputStyle} />
                  {formErrors.price && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.price}</span>}
                </label>

                <label style={labelStyle}>
                  Preco mensal
                  <input
                    type="number"
                    name="monthlyPrice"
                    min="0"
                    step="0.01"
                    value={form.monthlyPrice}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                  {formErrors.monthlyPrice && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.monthlyPrice}</span>}
                </label>
              </div>

              {error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}
              {success && <p style={{ margin: 0, color: '#1f7a45' }}>{success}</p>}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="submit" disabled={submitting} style={primaryButtonStyle}>
                  {submitting ? 'A gravar...' : form.id ? 'Guardar alteracoes' : 'Criar pessoa'}
                </button>
                {form.id && (
                  <button type="button" onClick={() => handleDelete(form.id)} disabled={submitting} style={dangerButtonStyle}>
                    Eliminar pessoa
                  </button>
                )}
              </div>
            </form>
          </section>
        )}

        <div style={layoutStyle}>
          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Lista de pessoas</h2>
            {loading && <p>A carregar pessoas...</p>}
            {!loading && error && <p style={{ color: '#b42318' }}>{error}</p>}
            {!loading && !error && people.length === 0 && <p>Sem pessoas registadas.</p>}
            {!loading && !error && people.length > 0 && (
              <div style={{ display: 'grid', gap: '12px' }}>
                {people.map(renderPersonRow)}
              </div>
            )}
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Detalhe da pessoa</h2>
            {!selectedPerson && <p>Seleciona uma pessoa para veres o detalhe.</p>}
            {selectedPerson && (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#66756d', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Pessoa #{selectedPerson.id}
                    </p>
                    <h3 style={{ margin: '6px 0 0', fontSize: '30px' }}>{selectedPerson.name}</h3>
                  </div>
                  <button type="button" onClick={() => startEdit(selectedPerson)} style={secondaryButtonStyle}>
                    Editar pessoa
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <article style={statCardStyle}>
                    <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Preco hora</div>
                    <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{selectedPerson.price || 0}/h</div>
                  </article>
                  <article style={statCardStyle}>
                    <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Preco mensal</div>
                    <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{selectedPerson.monthlyPrice || 0}</div>
                  </article>
                  <article style={statCardStyle}>
                    <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Tipo</div>
                    <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>
                      {selectedPerson.isMonthlyBilling ? 'Mensal' : 'Horaria'}
                    </div>
                  </article>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '24px' }}>Acesso mensal</h3>
                    <p style={{ margin: '6px 0 0', color: '#4f5d56' }}>
                      Consulta as horas agrupadas por mes, com detalhe por dia e por obra.
                    </p>
                  </div>

                  {monthlyAssignmentSummary.length === 0 && (
                    <p style={{ margin: 0, color: '#4f5d56' }}>
                      Sem afetacoes registadas para esta pessoa.
                    </p>
                  )}

                  {monthlyAssignmentSummary.map(month => (
                    <details
                      key={month.monthKey}
                      open={monthlyAssignmentSummary[0]?.monthKey === month.monthKey}
                      style={{
                        border: '1px solid #d7ddd6',
                        borderRadius: '18px',
                        background: '#fff',
                        padding: '16px',
                      }}
                    >
                      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                        {month.label} | {month.totalHours}h
                      </summary>

                      <div style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
                        {month.days.map(day => (
                          <article
                            key={day.date}
                            style={{
                              border: '1px solid #e5e2d9',
                              borderRadius: '14px',
                              padding: '14px',
                              background: '#fcfaf6',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                              <strong>{formatDateLabel(day.date)}</strong>
                              <span style={{ color: '#4f5d56' }}>{day.totalHours}h</span>
                            </div>

                            <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                              {day.works.map(work => (
                                <div
                                  key={`${day.date}-${work.name}`}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: '12px',
                                    padding: '10px 12px',
                                    borderRadius: '12px',
                                    background: '#fff',
                                  }}
                                >
                                  <span>{work.name}</span>
                                  <strong>{work.hours}h</strong>
                                </div>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
