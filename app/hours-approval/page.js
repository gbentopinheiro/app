'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { isAssignmentApproved } from '../../lib/work-assignment-approval.js'

const pageStyle = {
  minHeight: '100vh',
  padding: '40px 24px 60px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const shellStyle = {
  maxWidth: '1240px',
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
  padding: '10px 16px',
  background: 'var(--vp-accent)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: '13px',
}

const secondaryButtonStyle = {
  border: '1px solid var(--vp-accent)',
  borderRadius: '999px',
  padding: '10px 16px',
  background: 'transparent',
  color: 'var(--vp-accent)',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: '13px',
}

export default function HoursApprovalPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [approvingId, setApprovingId] = useState(null)
  const [approvalValues, setApprovalValues] = useState({})

  useEffect(() => {
    loadAssignments()
  }, [])

  const pendingApprovals = useMemo(() => {
    return assignments.filter(a => !isAssignmentApproved(a))
  }, [assignments])

  const approvedAssignments = useMemo(() => {
    return assignments.filter(a => isAssignmentApproved(a))
  }, [assignments])

  async function loadAssignments() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/work-assignments')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar afetações')
      }

      setAssignments(data)
      
      // Initialize approval values with the chef-reported hours
      const initialValues = {}
      data.forEach(a => {
        initialValues[a.id] = a.approvedHours ?? a.hours ?? a.dailyHours
      })
      setApprovalValues(initialValues)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleApprovalChange(assignmentId, value) {
    setApprovalValues(current => ({
      ...current,
      [assignmentId]: value,
    }))
  }

  async function handleApproveHours(assignmentId) {
    setError('')
    setSuccess('')
    setApprovingId(assignmentId)

    try {
      const hoursValue = Number(approvalValues[assignmentId])

      if (Number.isNaN(hoursValue) || hoursValue < 0) {
        setError('Horas têm de ser um número igual ou maior que 0.')
        setApprovingId(null)
        return
      }

      const response = await fetch(`/api/work-assignments/${assignmentId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedHours: hoursValue }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aprovar horas')
      }

      setSuccess('Horas aprovadas com sucesso.')
      await loadAssignments()
    } catch (err) {
      setError(err.message)
    } finally {
      setApprovingId(null)
    }
  }

  function renderAssignmentRow(assignment) {
    return (
      <article
        key={assignment.id}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          border: '1px solid var(--vp-border)',
          borderRadius: '12px',
          padding: '16px',
          background: 'var(--vp-surface)',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
            Pessoa
          </div>
          <div style={{ fontWeight: 700 }}>{assignment.person?.name || `#${assignment.personId}`}</div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
            Obra
          </div>
          <div style={{ fontWeight: 700 }}>{assignment.work?.name || `#${assignment.workId}`}</div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
            Horas Reais
          </div>
          <div style={{ fontWeight: 700 }}>{assignment.hours}h</div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
            Horas Diárias
          </div>
          <div style={{ fontWeight: 700 }}>{assignment.hours ?? assignment.dailyHours}h</div>
        </div>

        <div>
          <label style={labelStyle}>
            Horas Aprovadas
            <input
              type="number"
              min="0"
              step="1"
              value={approvalValues[assignment.id] ?? ''}
              onChange={(event) => handleApprovalChange(assignment.id, event.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => handleApproveHours(assignment.id)}
          disabled={approvingId === assignment.id}
          style={approvingId === assignment.id ? { ...primaryButtonStyle, background: 'var(--vp-disabled)', cursor: 'not-allowed' } : primaryButtonStyle}
        >
          {approvingId === assignment.id ? 'A aprovar...' : 'Aprovar'}
        </button>
      </article>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/" style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}>
            Voltar ao menu
          </Link>
          <p style={{ margin: '18px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: 'var(--vp-text-soft)' }}>
            Gestão de Horas
          </p>
          <h1 style={{ margin: '10px 0 12px', fontSize: '46px', lineHeight: 1.05 }}>
            Aprovação de Horas
          </h1>

        </section>

        <section style={topBarStyle}>
          <div style={statGridStyle}>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
                Pendentes de Aprovação
              </div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>
                {pendingApprovals.length}
              </div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
                Aprovadas
              </div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>
                {approvedAssignments.length}
              </div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
                Total
              </div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>
                {assignments.length}
              </div>
            </article>
          </div>
        </section>

        {error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}
        {success && <p style={{ margin: 0, color: '#1f7a45' }}>{success}</p>}

        {loading && (
          <section style={panelStyle}>
            <p>A carregar afetações...</p>
          </section>
        )}

        {!loading && pendingApprovals.length > 0 && (
          <section style={panelStyle}>
            <h2 style={{ margin: '0 0 18px' }}>Pendentes de Aprovação</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {pendingApprovals.map(renderAssignmentRow)}
            </div>
          </section>
        )}

        {!loading && pendingApprovals.length === 0 && (
          <section style={panelStyle}>
            <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>
              Nenhuma afetação pendente de aprovação.
            </p>
          </section>
        )}

        {!loading && approvedAssignments.length > 0 && (
          <section style={panelStyle}>
            <h2 style={{ margin: '0 0 18px' }}>Aprovadas</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {approvedAssignments.map(assignment => (
                <article
                  key={assignment.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px',
                    border: '1px solid var(--vp-border)',
                    borderRadius: '12px',
                    padding: '16px',
                    background: 'var(--vp-surface)',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
                      Pessoa
                    </div>
                    <div style={{ fontWeight: 700 }}>{assignment.person?.name || `#${assignment.personId}`}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
                      Obra
                    </div>
                    <div style={{ fontWeight: 700 }}>{assignment.work?.name || `#${assignment.workId}`}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
                      Horas Reais
                    </div>
                    <div style={{ fontWeight: 700 }}>{assignment.hours}h</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
                      Horas Diárias
                    </div>
                    <div style={{ fontWeight: 700 }}>{assignment.hours ?? assignment.dailyHours}h</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
                      Horas Aprovadas
                    </div>
                    <div style={{ fontWeight: 700, color: '#1f7a45' }}>{assignment.approvedHours}h ✓</div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
