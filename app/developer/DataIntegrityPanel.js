'use client'

import { useEffect, useState } from 'react'

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

const statusBadgeStyle = (hasIssues) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  borderRadius: '999px',
  background: hasIssues ? '#fee2e2' : '#dcfce7',
  color: hasIssues ? '#7f1d1d' : '#166534',
  fontSize: '13px',
  fontWeight: 700,
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
  marginTop: '18px',
}

const issueCardStyle = (severity) => {
  const baseStyle = {
    padding: '16px 18px',
    borderRadius: '20px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }

  if (severity === 'high') {
    return {
      ...baseStyle,
      background: '#fff1f2',
      borderColor: 'rgba(244, 63, 94, 0.22)',
      color: '#9f1239',
    }
  }

  if (severity === 'medium') {
    return {
      ...baseStyle,
      background: '#fff7ed',
      borderColor: 'rgba(249, 115, 22, 0.22)',
      color: '#9a3412',
    }
  }

  return {
    ...baseStyle,
    background: '#eff6ff',
    borderColor: 'rgba(59, 130, 246, 0.22)',
    color: '#1d4ed8',
  }
}

const issueTitleStyle = {
  margin: 0,
  fontSize: '16px',
  fontWeight: 900,
  marginBottom: '4px',
}

const issueTextStyle = {
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.65,
  opacity: 0.9,
}

const issueCountStyle = {
  fontSize: '12px',
  marginTop: '8px',
  opacity: 0.8,
}

const messageStyle = (type) => ({
  margin: '18px 0 0',
  padding: '12px 14px',
  borderRadius: '14px',
  border: type === 'error' ? '1px solid rgba(239, 68, 68, 0.18)' : '1px solid rgba(34, 197, 94, 0.18)',
  background: type === 'error' ? '#fff1f2' : '#f0fdf4',
  color: type === 'error' ? '#9f1239' : '#166534',
  fontSize: '14px',
  fontWeight: 700,
})

const statusRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '12px',
  marginTop: '16px',
}

const statusItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 12px',
  borderRadius: '12px',
  background: '#f8fafc',
  border: '1px solid rgba(148, 163, 184, 0.18)',
}

const countCircleStyle = (severity) => {
  const colors = {
    high: '#dc2626',
    medium: '#f97316',
    low: '#2563eb',
  }
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '28px',
    height: '28px',
    borderRadius: '50%',
    background: colors[severity],
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 900,
  }
}

const labelStyle = {
  color: '#52637a',
  fontSize: '13px',
  fontWeight: 700,
  margin: 0,
}

export default function DataIntegrityPanel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedIssue, setExpandedIssue] = useState(null)

  useEffect(() => {
    fetchIntegrity()
  }, [])

  async function fetchIntegrity() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/developer/data-integrity')
      if (!res.ok) throw new Error('Erro ao carregar integridade dos dados')
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div>
          <h2 style={titleStyle}>Integridade de Dados</h2>
          <p style={textStyle}>
            Verifica a consistencia da base de dados: referencias orfas, usernames duplicados, e dados invalidos.
          </p>
        </div>
        <div style={statusBadgeStyle(data?.hasIssues)}>
          <span>{data?.hasIssues ? '🔴 Problemas' : '✅ OK'}</span>
        </div>
      </div>

      {error && <div style={messageStyle('error')}>{error}</div>}

      {data && (
        <>
          <div style={statusRowStyle}>
            <div style={statusItemStyle}>
              <div style={countCircleStyle('high')}>{data.issueCounts.high}</div>
              <p style={labelStyle}>Critico</p>
            </div>
            <div style={statusItemStyle}>
              <div style={countCircleStyle('medium')}>{data.issueCounts.medium}</div>
              <p style={labelStyle}>Aviso</p>
            </div>
            <div style={statusItemStyle}>
              <div style={countCircleStyle('low')}>{data.issueCounts.low}</div>
              <p style={labelStyle}>Informacao</p>
            </div>
          </div>

          {data.issues.length === 0 ? (
            <div style={messageStyle('success')}>
              Nenhum problema encontrado. A integridade dos dados esta OK!
            </div>
          ) : (
            <>
              <div style={issueListStyle}>
                {data.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    style={issueCardStyle(issue.severity)}
                    onClick={() => setExpandedIssue(expandedIssue === idx ? null : idx)}
                  >
                    <p style={issueTitleStyle}>{issue.title}</p>
                    <p style={issueTextStyle}>{issue.description}</p>
                    <p style={issueCountStyle}>🔹 {issue.affectedCount} item(ns) afetado(s)</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(148, 163, 184, 0.18)' }}>
            <p style={{ ...titleStyle, fontSize: '18px', marginBottom: '12px' }}>Estatísticas da Base de Dados</p>
            <div style={statsGridStyle}>
              <div style={statCardStyle}>
                <p style={statLabelStyle}>Pessoas</p>
                <p style={statValueStyle}>{data.statistics.totalPeople}</p>
              </div>
              <div style={statCardStyle}>
                <p style={statLabelStyle}>Obras</p>
                <p style={statValueStyle}>{data.statistics.totalWorks}</p>
              </div>
              <div style={statCardStyle}>
                <p style={statLabelStyle}>Clientes</p>
                <p style={statValueStyle}>{data.statistics.totalClients}</p>
              </div>
              <div style={statCardStyle}>
                <p style={statLabelStyle}>Atribuições</p>
                <p style={statValueStyle}>{data.statistics.totalAssignments}</p>
              </div>
              <div style={statCardStyle}>
                <p style={statLabelStyle}>Planos</p>
                <p style={statValueStyle}>{data.statistics.totalWorkPlans}</p>
              </div>
              <div style={statCardStyle}>
                <p style={statLabelStyle}>Notas Diárias</p>
                <p style={statValueStyle}>{data.statistics.totalDailyNotes}</p>
              </div>
              <div style={statCardStyle}>
                <p style={statLabelStyle}>Contas</p>
                <p style={statValueStyle}>{data.statistics.totalAccounts}</p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchIntegrity}
            style={{
              marginTop: '16px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔄 Reanalysar
          </button>
        </>
      )}
    </section>
  )
}
