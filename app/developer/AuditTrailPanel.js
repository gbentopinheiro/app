'use client'

import { useEffect, useMemo, useState } from 'react'
import { fetchDeveloperAuditTrail } from '../../frontend/controllers/developer-controller.js'

const panelStyle = {
  marginBottom: '2rem',
  padding: '1.5rem',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
}

const filterBoxStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  marginBottom: '1.5rem',
  padding: '1rem',
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '0.375rem',
}

const inputStyle = {
  padding: '0.5rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
}

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '1rem',
  marginBottom: '1.5rem',
}

const statCardStyle = {
  padding: '1rem',
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '0.375rem',
  textAlign: 'center',
}

const statLabelStyle = {
  fontSize: '0.875rem',
  color: '#6b7280',
  marginBottom: '0.5rem',
}

const statValueStyle = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#1f2937',
}

const rowStyle = expanded => ({
  padding: '1rem',
  marginBottom: '0.75rem',
  backgroundColor: expanded ? '#f8fafc' : 'white',
  border: `1px solid ${expanded ? '#cbd5e1' : '#e5e7eb'}`,
  borderRadius: '0.75rem',
})

const badgeStyle = color => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.25rem 0.75rem',
  borderRadius: '9999px',
  fontSize: '0.75rem',
  fontWeight: 700,
  backgroundColor: color,
  color: 'white',
})

const actionRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
  flexWrap: 'wrap',
}

const buttonStyle = variant => ({
  padding: '0.6rem 1rem',
  borderRadius: '999px',
  border: variant === 'primary' ? '1px solid rgba(255, 140, 0, 0.24)' : '1px solid #d1d5db',
  backgroundColor: variant === 'primary' ? '#ff8c00' : '#ffffff',
  color: variant === 'primary' ? '#ffffff' : '#10233e',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 700,
})

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(7, 18, 38, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  zIndex: 1100,
}

const modalStyle = {
  width: 'min(920px, 100%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#ffffff',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 28px 60px rgba(15, 23, 42, 0.28)',
  display: 'grid',
  gap: '18px',
}

const detailGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '12px',
}

const detailCardStyle = {
  padding: '14px 16px',
  borderRadius: '16px',
  background: '#f8fafc',
  border: '1px solid rgba(148, 163, 184, 0.16)',
}

const detailLabelStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 900,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const detailValueStyle = {
  margin: '8px 0 0',
  color: '#10233e',
  fontSize: '14px',
  lineHeight: 1.6,
  fontWeight: 700,
}

const preStyle = {
  margin: 0,
  padding: '14px',
  borderRadius: '16px',
  background: '#0f172a',
  color: '#e2e8f0',
  fontSize: '12px',
  lineHeight: 1.7,
  overflowX: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

function getActionColor(action) {
  switch (action) {
    case 'create':
      return '#10b981'
    case 'update':
      return '#3b82f6'
    case 'delete':
      return '#ef4444'
    case 'login':
      return '#8b5cf6'
    case 'logout':
      return '#64748b'
    case 'login_failed':
      return '#ef4444'
    default:
      return '#475569'
  }
}

function getResultColor(result) {
  return result === 'success' ? '#10b981' : '#ef4444'
}

function formatDateTime(value) {
  if (!value) {
    return 'Sem registo'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatJsonBlock(value) {
  if (value === null || value === undefined || value === '') {
    return 'Sem dados'
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch (error) {
    return String(value)
  }
}

function getLogReason(log) {
  return log?.details?.reason || log?.details?.motivo || log?.details?.note || null
}

function getLogPermissionKey(log) {
  return log?.details?.permissionKeyUsed || log?.details?.permissionKey || null
}

function getLogBeforeState(log) {
  return log?.details?.beforeState ?? log?.details?.before ?? null
}

function getLogAfterState(log) {
  return log?.details?.afterState ?? log?.details?.after ?? null
}

export default function AuditTrailPanel() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    username: '',
    action: '',
    entity: '',
    result: '',
    search: '',
  })
  const [expandedLogId, setExpandedLogId] = useState(null)
  const [selectedLog, setSelectedLog] = useState(null)

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  async function fetchAuditLogs(appliedFilters = filters) {
    try {
      setLoading(true)
      setError(null)
      const { response, data } = await fetchDeveloperAuditTrail(appliedFilters)
      if (!response.ok) {
        throw new Error('Erro ao carregar audit trail.')
      }

      setLogs(Array.isArray(data.logs) ? data.logs : [])
      setStats(data.stats || null)
    } catch (fetchError) {
      setError(fetchError.message || 'Erro ao carregar audit trail.')
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(key, value) {
    const nextFilters = { ...filters, [key]: value }
    setFilters(nextFilters)
    fetchAuditLogs(nextFilters)
  }

  function clearFilters() {
    const emptyFilters = {
      username: '',
      action: '',
      entity: '',
      result: '',
      search: '',
    }
    setFilters(emptyFilters)
    fetchAuditLogs(emptyFilters)
  }

  const selectedLogSummary = useMemo(() => {
    if (!selectedLog) {
      return null
    }

    return {
      reason: getLogReason(selectedLog),
      permissionKeyUsed: getLogPermissionKey(selectedLog),
      beforeState: getLogBeforeState(selectedLog),
      afterState: getLogAfterState(selectedLog),
    }
  }, [selectedLog])

  if (loading && !stats) {
    return (
      <section style={panelStyle}>
        <p style={{ textAlign: 'center', color: '#6b7280' }}>A carregar audit trail...</p>
      </section>
    )
  }

  return (
    <>
      <section style={panelStyle}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
            Audit Trail
          </h2>
        </div>

        {error ? <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div> : null}

        {stats ? (
          <div style={statsGridStyle}>
            <article style={statCardStyle}>
              <div style={statLabelStyle}>Total de eventos</div>
              <div style={statValueStyle}>{stats.totalEvents}</div>
            </article>
            <article style={statCardStyle}>
              <div style={statLabelStyle}>Taxa de sucesso</div>
              <div style={{ ...statValueStyle, color: getResultColor('success') }}>{stats.successRate}%</div>
            </article>
          </div>
        ) : null}

        <div style={filterBoxStyle}>
          <div>
            <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
              Pesquisa
            </label>
            <input
              type="search"
              placeholder="Pesquisar por motivo, erro, etc."
              style={inputStyle}
              value={filters.search}
              onChange={event => handleFilterChange('search', event.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
              Utilizador
            </label>
            <input
              type="text"
              placeholder="Filtrar por utilizador"
              style={inputStyle}
              value={filters.username}
              onChange={event => handleFilterChange('username', event.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
              Entidade
            </label>
            <input
              type="text"
              placeholder="Filtrar por entidade"
              style={inputStyle}
              value={filters.entity}
              onChange={event => handleFilterChange('entity', event.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
              Acao
            </label>
            <select
              style={inputStyle}
              value={filters.action}
              onChange={event => handleFilterChange('action', event.target.value)}
            >
              <option value="">Todas</option>
              <option value="create">Criar</option>
              <option value="update">Atualizar</option>
              <option value="delete">Eliminar</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
              Resultado
            </label>
            <select
              style={inputStyle}
              value={filters.result}
              onChange={event => handleFilterChange('result', event.target.value)}
            >
              <option value="">Todos</option>
              <option value="success">Sucesso</option>
              <option value="failure">Falha</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={clearFilters} style={buttonStyle('primary')}>
              Limpar filtros
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>
            Ultimos {logs.length} eventos
          </h3>

          {logs.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center' }}>Nenhum evento encontrado.</p>
          ) : (
            logs.map(log => {
              const expanded = expandedLogId === log.id

              return (
                <article key={log.id} style={rowStyle(expanded)}>
                  <div style={actionRowStyle}>
                    <div style={{ display: 'grid', gap: '0.75rem', flex: '1 1 520px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.3rem' }}>Utilizador</div>
                          <div style={{ fontWeight: 700, color: '#1f2937' }}>{log.username}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.3rem' }}>Acao</div>
                          <span style={badgeStyle(getActionColor(log.action))}>{log.action}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.3rem' }}>Data/Hora</div>
                          <div style={{ color: '#1f2937', fontSize: '0.875rem' }}>{formatDateTime(log.timestamp)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.3rem' }}>Resultado</div>
                          <span style={badgeStyle(getResultColor(log.result))}>
                            {log.result === 'success' ? 'Sucesso' : 'Falha'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        style={buttonStyle()}
                        onClick={() => setExpandedLogId(expanded ? null : log.id)}
                      >
                        {expanded ? 'Ocultar' : 'Resumo'}
                      </button>
                      <button
                        type="button"
                        style={buttonStyle('primary')}
                        onClick={() => setSelectedLog(log)}
                      >
                        Ver detalhe
                      </button>
                    </div>
                  </div>

                  {expanded ? (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'grid', gap: '0.4rem' }}>
                      {log.entity ? (
                        <div style={{ color: '#334155', fontSize: '0.875rem' }}>
                          <strong>Entidade:</strong> {log.entity}
                        </div>
                      ) : null}
                      {log.entityId ? (
                        <div style={{ color: '#334155', fontSize: '0.875rem' }}>
                          <strong>ID:</strong> {log.entityId}
                        </div>
                      ) : null}
                      {getLogReason(log) ? (
                        <div style={{ color: '#334155', fontSize: '0.875rem' }}>
                          <strong>Motivo:</strong> {getLogReason(log)}
                        </div>
                      ) : null}
                      {log.errorMessage ? (
                        <div style={{ color: '#9f1239', fontSize: '0.875rem' }}>
                          <strong>Erro:</strong> {log.errorMessage}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              )
            })
          )}
        </div>
      </section>

      {selectedLog ? (
        <div style={modalOverlayStyle} onClick={() => setSelectedLog(null)}>
          <div style={modalStyle} onClick={event => event.stopPropagation()}>
            <div style={actionRowStyle}>
              <div>
                <h3 style={{ margin: 0, color: '#10233e', fontSize: '1.4rem', fontWeight: 800 }}>
                  Detalhe do audit trail
                </h3>
              </div>
              <button type="button" style={buttonStyle()} onClick={() => setSelectedLog(null)}>
                Fechar
              </button>
            </div>

            <div style={detailGridStyle}>
              <article style={detailCardStyle}>
                <p style={detailLabelStyle}>Utilizador</p>
                <p style={detailValueStyle}>{selectedLog.username || 'Sem utilizador'}</p>
              </article>
              <article style={detailCardStyle}>
                <p style={detailLabelStyle}>Data</p>
                <p style={detailValueStyle}>{formatDateTime(selectedLog.timestamp)}</p>
              </article>
              <article style={detailCardStyle}>
                <p style={detailLabelStyle}>Acao</p>
                <p style={detailValueStyle}>{selectedLog.action || 'Sem acao'}</p>
              </article>
              <article style={detailCardStyle}>
                <p style={detailLabelStyle}>Resultado</p>
                <p style={detailValueStyle}>{selectedLog.result || 'Sem resultado'}</p>
              </article>
              <article style={detailCardStyle}>
                <p style={detailLabelStyle}>Entidade</p>
                <p style={detailValueStyle}>
                  {selectedLog.entity || 'Sem entidade'}
                  {selectedLog.entityId ? ` #${selectedLog.entityId}` : ''}
                </p>
              </article>
              <article style={detailCardStyle}>
                <p style={detailLabelStyle}>Permissao usada</p>
                <p style={detailValueStyle}>{selectedLogSummary?.permissionKeyUsed || 'Sem permissao registada'}</p>
              </article>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <article style={detailCardStyle}>
                <p style={detailLabelStyle}>Motivo</p>
                <p style={detailValueStyle}>{selectedLogSummary?.reason || 'Sem motivo registado'}</p>
              </article>

              {selectedLog.errorMessage ? (
                <article style={{ ...detailCardStyle, border: '1px solid rgba(239, 68, 68, 0.18)', background: '#fff1f2' }}>
                  <p style={detailLabelStyle}>Error message</p>
                  <p style={{ ...detailValueStyle, color: '#9f1239' }}>{selectedLog.errorMessage}</p>
                </article>
              ) : null}

              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <p style={{ ...detailLabelStyle, marginBottom: '8px' }}>Before state</p>
                  <pre style={preStyle}>{formatJsonBlock(selectedLogSummary?.beforeState)}</pre>
                </div>
                <div>
                  <p style={{ ...detailLabelStyle, marginBottom: '8px' }}>After state</p>
                  <pre style={preStyle}>{formatJsonBlock(selectedLogSummary?.afterState)}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
