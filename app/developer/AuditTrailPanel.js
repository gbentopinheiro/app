'use client'

import { useState, useEffect } from 'react'

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
  })
  const [expandedLog, setExpandedLog] = useState(null)

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async (appliedFilters = filters) => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })

      const res = await fetch(`/api/developer/audit-trail?${queryParams}`)
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      
      const data = await res.json()
      setLogs(data.logs)
      setStats(data.stats)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    fetchAuditLogs(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = { username: '', action: '', entity: '', result: '' }
    setFilters(clearedFilters)
    fetchAuditLogs(clearedFilters)
  }

  const getActionColor = (action) => {
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
        return '#6b7280'
      case 'login_failed':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const getResultColor = (result) => {
    return result === 'success' ? '#10b981' : '#ef4444'
  }

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

  const logRowStyle = (expanded) => ({
    padding: '1rem',
    marginBottom: '0.5rem',
    backgroundColor: expanded ? '#f3f4f6' : 'white',
    border: `1px solid ${expanded ? '#d1d5db' : '#e5e7eb'}`,
    borderRadius: '0.375rem',
    cursor: 'pointer',
  })

  const badgeStyle = (color) => ({
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: color,
    color: 'white',
  })

  if (loading && !stats) {
    return (
      <div style={panelStyle}>
        <p style={{ textAlign: 'center', color: '#6b7280' }}>A carregar audit trail...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={panelStyle}>
        <p style={{ color: '#ef4444' }}>Erro: {error}</p>
      </div>
    )
  }

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: '0 0 1rem 0' }}>
          📋 Audit Trail (Quem Mudou O Quê)
        </h2>
      </div>

      {/* Statistics */}
      {stats && (
        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>Total de Eventos</div>
            <div style={statValueStyle}>{stats.totalEvents}</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>Taxa de Sucesso</div>
            <div style={{ ...statValueStyle, color: getResultColor('success') }}>
              {stats.successRate}%
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={filterBoxStyle}>
        <div>
          <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
            Utilizador
          </label>
          <input
            type="text"
            placeholder="Filtrar por utilizador"
            style={inputStyle}
            value={filters.username}
            onChange={(e) => handleFilterChange('username', e.target.value)}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
            Ação
          </label>
          <select
            style={inputStyle}
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">Todas as ações</option>
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
            onChange={(e) => handleFilterChange('result', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="success">Sucesso</option>
            <option value="failure">Falha</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
          <button
            onClick={clearFilters}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem' }}>
          Últimos {logs.length} Eventos
        </h3>

        {logs.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center' }}>Nenhum evento encontrado</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={logRowStyle(expandedLog === log.id)}
              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Utilizador</div>
                  <div style={{ fontWeight: 500, color: '#1f2937' }}>{log.username}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ação</div>
                  <span style={badgeStyle(getActionColor(log.action))}>
                    {log.action}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Data/Hora</div>
                  <div style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                    {new Date(log.timestamp).toLocaleString('pt-PT')}
                  </div>
                </div>

                <div>
                  <span style={badgeStyle(getResultColor(log.result))}>
                    {log.result}
                  </span>
                </div>
              </div>

              {expandedLog === log.id && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #d1d5db', fontSize: '0.875rem' }}>
                  {log.entity && <div><span style={{ fontWeight: 500 }}>Entidade:</span> {log.entity}</div>}
                  {log.entityId && <div><span style={{ fontWeight: 500 }}>ID:</span> {log.entityId}</div>}
                  {log.errorMessage && (
                    <div style={{ color: '#ef4444' }}>
                      <span style={{ fontWeight: 500 }}>Erro:</span> {log.errorMessage}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
