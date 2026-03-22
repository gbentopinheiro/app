'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
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

const panelStyle = {
  background: 'rgba(255, 252, 247, 0.9)',
  border: '1px solid #d4d2c8',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 16px 40px rgba(54, 72, 63, 0.08)',
}

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '14px',
}

const statCardStyle = {
  borderRadius: '18px',
  padding: '18px',
  background: '#fff',
  border: '1px solid #d7ddd6',
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
  width: 'min(680px, 100%)',
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  background: 'rgba(255, 252, 247, 0.98)',
  border: '1px solid #d4d2c8',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: '0 24px 70px rgba(28, 36, 32, 0.18)',
}

const secondaryButtonStyle = {
  border: '1px solid #285943',
  borderRadius: '999px',
  padding: '12px 18px',
  background: 'transparent',
  color: '#285943',
  fontWeight: 700,
  cursor: 'pointer',
}

const clientButtonStyle = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: '#285943',
  fontSize: 'inherit',
  fontFamily: 'inherit',
  fontWeight: 700,
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
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

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

export default function WorkDetailPage() {
  const params = useParams()
  const workId = Array.isArray(params.id) ? params.id[0] : params.id
  const [work, setWork] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [showClientModal, setShowClientModal] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workId) {
      return
    }

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const [workResponse, assignmentsResponse] = await Promise.all([
          fetch(`/api/works/${workId}`),
          fetch(`/api/work-assignments?workId=${workId}`),
        ])

        const workData = await workResponse.json()
        const assignmentsData = await assignmentsResponse.json()

        if (!workResponse.ok) throw new Error(workData.error || 'Erro ao carregar obra')
        if (!assignmentsResponse.ok) throw new Error(assignmentsData.error || 'Erro ao carregar afetacoes')

        setWork(workData)
        setAssignments(assignmentsData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [workId])

  const totals = useMemo(() => {
    const totalHours = assignments.reduce((sum, assignment) => sum + (Number(assignment.hours) || 0), 0)
    const totalCost = assignments.reduce((sum, assignment) => sum + (Number(assignment.totalCost) || 0), 0)

    return {
      totalHours,
      totalCost: Number(totalCost.toFixed(2)),
    }
  }, [assignments])

  const assignmentsByMonth = useMemo(() => {
    const monthMap = new Map()

    assignments.forEach(assignment => {
      const monthKey = assignment.date ? String(assignment.date).slice(0, 7) : 'Sem data'
      const currentMonth = monthMap.get(monthKey) || {
        monthKey,
        label: monthKey === 'Sem data' ? monthKey : formatMonthLabel(monthKey),
        totalHours: 0,
        totalCost: 0,
        days: new Map(),
      }
      const dayKey = assignment.date || 'Sem data'
      const currentDay = currentMonth.days.get(dayKey) || {
        date: dayKey,
        totalHours: 0,
        totalCost: 0,
        people: [],
      }

      currentMonth.totalHours += Number(assignment.hours) || 0
      currentMonth.totalCost += Number(assignment.totalCost) || 0
      currentDay.totalHours += Number(assignment.hours) || 0
      currentDay.totalCost += Number(assignment.totalCost) || 0
      currentDay.people.push(assignment)
      currentMonth.days.set(dayKey, currentDay)
      monthMap.set(monthKey, currentMonth)
    })

    return Array.from(monthMap.values())
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      .map(month => ({
        ...month,
        totalHours: Number(month.totalHours.toFixed(2)),
        totalCost: Number(month.totalCost.toFixed(2)),
        days: Array.from(month.days.values())
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(day => ({
            ...day,
            totalHours: Number(day.totalHours.toFixed(2)),
            totalCost: Number(day.totalCost.toFixed(2)),
            people: day.people.sort((a, b) => {
              const personA = a.person?.name || `Pessoa ${a.personId}`
              const personB = b.person?.name || `Pessoa ${b.personId}`
              return personA.localeCompare(personB)
            }),
          })),
      }))
  }, [assignments])

  const client = work?.client ?? null

  function openClientModal() {
    if (!client) return
    setShowClientModal(true)
  }

  function closeClientModal() {
    setShowClientModal(false)
  }

  function exportMonth(month) {
    const rows = [
      ['Mes', month.label],
      ['Obra', work?.name || ''],
      ['Total horas', String(month.totalHours)],
      ['Total custo', String(month.totalCost)],
      [],
      ['Data', 'Homem', 'Horas', 'Preco hora', 'Total', 'Notas'],
    ]

    month.days.forEach(day => {
      day.people.forEach(assignment => {
        rows.push([
          day.date,
          assignment.person?.name || `Pessoa ${assignment.personId}`,
          String(assignment.hours ?? 0),
          String(assignment.hourlyCost ?? 0),
          String(assignment.totalCost ?? 0),
          assignment.notes || '',
        ])
      })
    })

    const csvContent = rows
      .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `obra-${work?.number || workId}-${month.monthKey}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={panelStyle}>
          <Link href="/works" style={{ color: '#285943', textDecoration: 'none', fontWeight: 700 }}>
            ← Voltar a gestao de obra
          </Link>

          {loading && <p style={{ marginTop: '18px' }}>A carregar obra...</p>}
          {error && <p style={{ marginTop: '18px', color: '#b42318' }}>{error}</p>}

          {!loading && !error && work && (
            <>
              <p style={{ margin: '18px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: '#5f6f66' }}>
                Obra #{work.number}
              </p>
              <h1 style={{ margin: '10px 0 12px', fontSize: '44px', lineHeight: 1.05 }}>
                {work.name}
              </h1>
              <p style={{ margin: 0, maxWidth: '760px', color: '#4d5c55', fontSize: '17px', lineHeight: 1.7 }}>
                Consulta aqui o resumo completo da obra e todas as afetacoes relacionadas com esta obra.
              </p>
            </>
          )}
        </section>

        {!loading && !error && work && (
          <>
            <section style={statGridStyle}>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Estado</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{work.status}</div>
              </article>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Preco hora defeito</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{work.defaultHourlyCost || 0}/h</div>
              </article>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Horas totais</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{totals.totalHours}</div>
              </article>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Custo acumulado</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{totals.totalCost}</div>
              </article>
            </section>

            <section style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Informacao da obra</h2>
              <div style={{ display: 'grid', gap: '10px', color: '#4f5d56' }}>
                <p style={{ margin: 0 }}>
                  <strong>Cliente:</strong>{' '}
                  {client ? (
                    <button type="button" onClick={openClientModal} style={clientButtonStyle}>
                      {client.name}
                    </button>
                  ) : (
                    'Sem cliente'
                  )}
                </p>
                <p style={{ margin: 0 }}><strong>Localizacao:</strong> {work.location || 'Sem localizacao'}</p>
                <p style={{ margin: 0 }}><strong>Data de comeco:</strong> {work.startDate || 'Sem data'}</p>
                <p style={{ margin: 0 }}><strong>Data de finalizacao:</strong> {work.endDate || 'Em aberto'}</p>
                <p style={{ margin: 0 }}><strong>Orcamento:</strong> {work.budget || 0}</p>
                <p style={{ margin: 0 }}><strong>Notas:</strong> {work.notes || 'Sem notas'}</p>
              </div>
            </section>

            <section style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>Afetacoes desta obra por mes</h2>
              {assignments.length === 0 && <p>Sem afetacoes registadas para esta obra.</p>}
              {assignments.length > 0 && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {assignmentsByMonth.map(month => (
                    <details
                      key={month.monthKey}
                      open={assignmentsByMonth[0]?.monthKey === month.monthKey}
                      style={{
                        border: '1px solid #d7ddd6',
                        borderRadius: '18px',
                        padding: '16px',
                        background: '#fff',
                      }}
                    >
                      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                        <span>
                          {month.label} | {month.totalHours}h | Total {month.totalCost}
                        </span>
                      </summary>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <button type="button" onClick={() => exportMonth(month)} style={secondaryButtonStyle}>
                          Exportar
                        </button>
                      </div>

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
                              <strong>{day.date === 'Sem data' ? day.date : formatDateLabel(day.date)}</strong>
                              <span style={{ color: '#4f5d56' }}>
                                {day.totalHours}h | Total {day.totalCost}
                              </span>
                            </div>

                            <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
                              {day.people.map(assignment => (
                                <div
                                  key={assignment.id}
                                  style={{
                                    border: '1px solid #ebe7dd',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    background: '#fff',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                    <strong>{assignment.person?.name || `Pessoa ${assignment.personId}`}</strong>
                                    <strong>{assignment.hours}h</strong>
                                  </div>
                                  <p style={{ margin: '6px 0 0', color: '#4f5d56' }}>
                                    {assignment.hourlyCost}/h | Total {assignment.totalCost}
                                  </p>
                                  {assignment.notes && <p style={{ margin: '6px 0 0', color: '#6a756f' }}>{assignment.notes}</p>}
                                </div>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {showClientModal && client && (
        <div style={modalBackdropStyle} onClick={closeClientModal}>
          <section style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: '#5f6f66' }}>
                  Cliente associado
                </p>
                <h2 style={{ margin: '10px 0 0', fontSize: '34px', lineHeight: 1.1 }}>
                  {client.name}
                </h2>
              </div>
              <button type="button" onClick={closeClientModal} style={secondaryButtonStyle}>
                Fechar
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px', marginTop: '22px', color: '#4f5d56' }}>
              <p style={{ margin: 0 }}><strong>NIF:</strong> {client.vatNumber || 'Sem NIF'}</p>
              <p style={{ margin: 0 }}><strong>Contacto:</strong> {client.contactName || 'Sem contacto'}</p>
              <p style={{ margin: 0 }}><strong>Email:</strong> {client.email || 'Sem email'}</p>
              <p style={{ margin: 0 }}><strong>Telefone:</strong> {client.phone || 'Sem telefone'}</p>
              <p style={{ margin: 0 }}><strong>Notas:</strong> {client.notes || 'Sem notas'}</p>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
