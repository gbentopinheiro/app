'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  approveWorkAssignment,
  listWorkAssignments,
} from '../../frontend/controllers/work-assignments-controller.js'
import { isAssignmentApproved } from '../../lib/work-assignment-approval.js'
import {
  BentixContent,
  BentixPage,
  BentixResponsiveGrid,
  BentixSection,
} from '../components/ViewportLayout.js'

const pageStyle = {
  padding: 'clamp(18px, 4vw, 40px) clamp(14px, 3vw, 24px) 60px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: 'var(--btx-font-family)',
}

const shellStyle = {
  '--btx-content-gap': '24px',
}

const heroStyle = {
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--vp-module-hero)',
  border: '1px solid var(--vp-module-hero-border)',
  borderRadius: '32px',
  padding: 'clamp(20px, 4vw, 28px)',
  boxShadow: 'var(--vp-hero-shadow-strong)',
  color: '#ffffff',
  '--vp-text-muted': 'var(--vp-hero-text-muted)',
  '--vp-text-soft': 'var(--vp-hero-text-soft)',
  '--vp-surface': 'var(--vp-hero-surface)',
  '--vp-border': 'var(--vp-hero-border)',
}

const contentFlowStyle = {
  display: 'grid',
  gap: '24px',
  minWidth: 0,
}

const statGridStyle = {
  '--vp-grid-gap': '14px',
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

const rowCardStyle = {
  border: '1px solid var(--vp-border)',
  borderRadius: '12px',
  padding: '16px',
  background: 'var(--vp-surface)',
}

const rowListStyle = {
  display: 'grid',
  gap: '12px',
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

const sectionTitleStyle = {
  margin: '0 0 18px',
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
      const data = await listWorkAssignments({}, 'Erro ao carregar afetaÃ§Ãµes')

      setAssignments(data)

      // Initialize approval values with the chef-reported hours.
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
        setError('Horas tÃªm de ser um nÃºmero igual ou maior que 0.')
        setApprovingId(null)
        return
      }

      await approveWorkAssignment(
        assignmentId,
        { approvedHours: hoursValue },
        'Erro ao aprovar horas',
      )

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
        className="btx-hours-approval-entry-grid"
        style={rowCardStyle}
      >
        <div className="btx-hours-approval-wrap-text">
          <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
            Pessoa
          </div>
          <div style={{ fontWeight: 700 }}>{assignment.person?.name || `#${assignment.personId}`}</div>
        </div>

        <div className="btx-hours-approval-wrap-text">
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
            Horas DiÃ¡rias
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
          style={
            approvingId === assignment.id
              ? { ...primaryButtonStyle, background: 'var(--vp-disabled)', cursor: 'not-allowed' }
              : primaryButtonStyle
          }
        >
          {approvingId === assignment.id ? 'A aprovar...' : 'Aprovar'}
        </button>
      </article>
    )
  }

  return (
    <BentixPage style={pageStyle}>
      <BentixContent width="app" gap="lg" style={shellStyle}>
        <section style={heroStyle}>
          <div className="btx-hours-approval-detail-header">
            <Link href="/" style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}>
              Voltar ao menu
            </Link>
            <p
              style={{
                margin: '18px 0 0',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontSize: '12px',
                color: 'var(--vp-text-soft)',
              }}
            >
              GestÃ£o de Horas
            </p>
            <h1 style={{ margin: '10px 0 12px', fontSize: 'clamp(38px, 5.5vw, 46px)', lineHeight: 1.05 }}>
              AprovaÃ§Ã£o de Horas
            </h1>
          </div>
        </section>

        <div style={contentFlowStyle} className="btx-hours-approval-main-grid">
          <section className="btx-hours-approval-toolbar">
            <BentixResponsiveGrid preset="stats" style={statGridStyle}>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
                  Pendentes de AprovaÃ§Ã£o
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
            </BentixResponsiveGrid>
          </section>

          {error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}
          {success && <p style={{ margin: 0, color: '#1f7a45' }}>{success}</p>}

          {loading && (
            <BentixSection style={panelStyle}>
              <p>A carregar afetaÃ§Ãµes...</p>
            </BentixSection>
          )}

          {!loading && pendingApprovals.length > 0 && (
            <BentixSection style={panelStyle}>
              <h2 style={sectionTitleStyle}>Pendentes de AprovaÃ§Ã£o</h2>
              <div style={rowListStyle}>
                {pendingApprovals.map(renderAssignmentRow)}
              </div>
            </BentixSection>
          )}

          {!loading && pendingApprovals.length === 0 && (
            <BentixSection style={panelStyle}>
              <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>
                Nenhuma afetaÃ§Ã£o pendente de aprovaÃ§Ã£o.
              </p>
            </BentixSection>
          )}

          {!loading && approvedAssignments.length > 0 && (
            <BentixSection style={panelStyle}>
              <h2 style={sectionTitleStyle}>Aprovadas</h2>
              <div style={rowListStyle}>
                {approvedAssignments.map(assignment => (
                  <article
                    key={assignment.id}
                    className="btx-hours-approval-entry-grid"
                    style={rowCardStyle}
                  >
                    <div className="btx-hours-approval-wrap-text">
                      <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
                        Pessoa
                      </div>
                      <div style={{ fontWeight: 700 }}>{assignment.person?.name || `#${assignment.personId}`}</div>
                    </div>

                    <div className="btx-hours-approval-wrap-text">
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
                        Horas DiÃ¡rias
                      </div>
                      <div style={{ fontWeight: 700 }}>{assignment.hours ?? assignment.dailyHours}h</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
                        Horas Aprovadas
                      </div>
                      <div style={{ fontWeight: 700, color: '#1f7a45' }}>{assignment.approvedHours}h âœ“</div>
                    </div>
                  </article>
                ))}
              </div>
            </BentixSection>
          )}
        </div>
      </BentixContent>
    </BentixPage>
  )
}

