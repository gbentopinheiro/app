'use client'

import { useEffect, useState } from 'react'
import {
  fetchDeveloperDataIntegrity,
  runDeveloperDataIntegrityFix,
} from '../../frontend/controllers/developer-controller.js'

const panelStyle = {
  borderRadius: '30px',
  padding: '24px',
  background: '#ffffff',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 18px 42px rgba(15, 23, 42, 0.08)',
}

const titleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '24px',
  fontWeight: 900,
  letterSpacing: '-0.04em',
}

const textStyle = {
  margin: '10px 0 0',
  color: '#52637a',
  fontSize: '15px',
  lineHeight: 1.7,
}

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
}

const buttonStyle = (variant = 'ghost') => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '38px',
  padding: '0 14px',
  borderRadius: '999px',
  border: variant === 'primary' ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
  background: variant === 'primary' ? '#ff8c00' : '#f8fafc',
  color: variant === 'primary' ? '#ffffff' : '#10233e',
  fontSize: '13px',
  fontWeight: 800,
  cursor: 'pointer',
})

const messageStyle = type => ({
  marginTop: '18px',
  padding: '12px 14px',
  borderRadius: '14px',
  border: type === 'error' ? '1px solid rgba(239, 68, 68, 0.18)' : '1px solid rgba(34, 197, 94, 0.18)',
  background: type === 'error' ? '#fff1f2' : '#f0fdf4',
  color: type === 'error' ? '#9f1239' : '#166534',
  fontSize: '14px',
  fontWeight: 700,
})

const statusBadgeStyle = hasIssues => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  borderRadius: '999px',
  background: hasIssues ? '#fff1f2' : '#ecfdf3',
  color: hasIssues ? '#9f1239' : '#166534',
  fontSize: '13px',
  fontWeight: 800,
  border: hasIssues ? '1px solid rgba(244, 63, 94, 0.18)' : '1px solid rgba(34, 197, 94, 0.18)',
})

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '12px',
  marginTop: '18px',
}

const statCardStyle = {
  padding: '16px',
  borderRadius: '18px',
  background: '#f8fafc',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  textAlign: 'center',
}

const statLabelStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const statValueStyle = {
  margin: '8px 0 0',
  color: '#10233e',
  fontSize: '28px',
  fontWeight: 900,
  letterSpacing: '-0.05em',
}

const issueListStyle = {
  display: 'grid',
  gap: '12px',
  marginTop: '20px',
}

const issueCardStyle = severity => ({
  padding: '18px',
  borderRadius: '22px',
  background:
    severity === 'high'
      ? '#fff1f2'
      : severity === 'medium'
        ? '#fff7ed'
        : '#eff6ff',
  border:
    severity === 'high'
      ? '1px solid rgba(244, 63, 94, 0.18)'
      : severity === 'medium'
        ? '1px solid rgba(249, 115, 22, 0.18)'
        : '1px solid rgba(59, 130, 246, 0.18)',
  display: 'grid',
  gap: '12px',
})

const issueHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '12px',
  flexWrap: 'wrap',
}

const severityBadgeStyle = severity => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '76px',
  padding: '6px 10px',
  borderRadius: '999px',
  background: '#ffffff',
  color:
    severity === 'high'
      ? '#9f1239'
      : severity === 'medium'
        ? '#9a3412'
        : '#1d4ed8',
  fontSize: '12px',
  fontWeight: 900,
  textTransform: 'uppercase',
})

const detailGridStyle = {
  display: 'grid',
  gap: '10px',
}

const detailCardStyle = {
  padding: '14px',
  borderRadius: '16px',
  background: '#ffffff',
  border: '1px solid rgba(148, 163, 184, 0.16)',
}

const detailRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px 12px',
}

const detailLabelStyle = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

function formatDetailValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'n/a'
  }

  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  return String(value)
}

export default function DataIntegrityPanel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedIssueId, setExpandedIssueId] = useState(null)
  const [fixingIssueId, setFixingIssueId] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchIntegrity()
  }, [])

  async function fetchIntegrity() {
    try {
      setLoading(true)
      setError(null)
      const { response, data } = await fetchDeveloperDataIntegrity()

      if (!response.ok) {
        throw new Error('Erro ao carregar integridade dos dados')
      }

      setData(data)
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAutoFix(issueId) {
    const confirmed = window.confirm('Queres aplicar esta correcao automatica?')

    if (!confirmed) {
      return
    }

    try {
      setFixingIssueId(issueId)
      setError(null)
      setMessage(null)
      const { response, data: payload } = await runDeveloperDataIntegrityFix({ issueId })

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao aplicar correcao automatica.')
      }

      setMessage(payload.message || 'Correcao automatica aplicada com sucesso.')
      await fetchIntegrity()
      setExpandedIssueId(issueId)
    } catch (fixError) {
      setError(fixError.message)
    } finally {
      setFixingIssueId(null)
    }
  }

  if (loading) {
    return (
      <section style={panelStyle}>
        <h2 style={titleStyle}>Integridade de Dados</h2>
        <p style={textStyle}>A carregar analise...</p>
      </section>
    )
  }

  return (
    <section style={panelStyle}>
      <div style={topBarStyle}>
        <div>
          <h2 style={titleStyle}>Integridade de Dados</h2>
          <p style={textStyle}>Detecao tecnica de incoerencias com detalhe e correcoes automaticas seguras.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={statusBadgeStyle(data?.hasIssues)}>
            {data?.hasIssues ? 'Com problemas' : 'Sem problemas'}
          </span>
          <button type="button" style={buttonStyle()} onClick={fetchIntegrity}>
            Reanalisar
          </button>
        </div>
      </div>

      {error ? <div style={messageStyle('error')}>{error}</div> : null}
      {message ? <div style={messageStyle('success')}>{message}</div> : null}

      {data ? (
        <>
          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Critico</p>
              <p style={statValueStyle}>{data.issueCounts.high}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Aviso</p>
              <p style={statValueStyle}>{data.issueCounts.medium}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Info</p>
              <p style={statValueStyle}>{data.issueCounts.low}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Contas</p>
              <p style={statValueStyle}>{data.statistics.totalAccounts}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Pessoas</p>
              <p style={statValueStyle}>{data.statistics.totalPeople}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Obras</p>
              <p style={statValueStyle}>{data.statistics.totalWorks}</p>
            </div>
          </div>

          {data.issues.length === 0 ? (
            <div style={messageStyle('success')}>Nenhum problema encontrado. A base esta consistente.</div>
          ) : (
            <div style={issueListStyle}>
              {data.issues.map(issue => {
                const expanded = expandedIssueId === issue.id

                return (
                  <article key={issue.id} style={issueCardStyle(issue.severity)}>
                    <div style={issueHeaderStyle}>
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <p style={{ margin: 0, color: '#10233e', fontSize: '16px', fontWeight: 900 }}>
                          {issue.title}
                        </p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                          {issue.description}
                        </p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px', fontWeight: 800 }}>
                          {issue.affectedCount} item(ns) afetado(s)
                        </p>
                      </div>
                      <span style={severityBadgeStyle(issue.severity)}>{issue.severity}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        style={buttonStyle()}
                        onClick={() => setExpandedIssueId(expanded ? null : issue.id)}
                      >
                        {expanded ? 'Ocultar detalhe' : 'Ver detalhe'}
                      </button>
                      {issue.fixable ? (
                        <button
                          type="button"
                          style={buttonStyle('primary')}
                          onClick={() => handleAutoFix(issue.id)}
                          disabled={fixingIssueId === issue.id}
                        >
                          {fixingIssueId === issue.id ? 'A corrigir...' : issue.fixLabel || 'Corrigir automaticamente'}
                        </button>
                      ) : null}
                    </div>

                    {expanded ? (
                      <div style={detailGridStyle}>
                        {issue.items.length === 0 ? (
                          <p style={{ ...textStyle, margin: 0 }}>Sem detalhe adicional.</p>
                        ) : (
                          issue.items.map((item, index) => (
                            <div key={`${issue.id}-${index}`} style={detailCardStyle}>
                              <div style={detailRowStyle}>
                                {Object.entries(item).map(([key, value]) => (
                                  <div key={key} style={{ display: 'grid', gap: '4px' }}>
                                    <span style={detailLabelStyle}>{key}</span>
                                    <span style={{ color: '#10233e', fontSize: '13px', fontWeight: 700 }}>
                                      {formatDetailValue(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}
        </>
      ) : null}
    </section>
  )
}
