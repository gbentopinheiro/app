'use client'

import { useState, useEffect } from 'react'

export default function SystemDiagnosticsPanel() {
  const [diagnostics, setDiagnostics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    memory: true,
    fileIO: true,
    errors: false,
    processor: false,
    dataFiles: false,
  })

  useEffect(() => {
    fetchDiagnostics()
  }, [])

  const fetchDiagnostics = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/developer/system-diagnostics')
      if (!res.ok) throw new Error('Failed to fetch diagnostics')
      const data = await res.json()
      setDiagnostics(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return '#10b981'
      case 'warning':
        return '#f59e0b'
      case 'slow':
        return '#f59e0b'
      case 'critical':
        return '#ef4444'
      case 'error':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const panelStyle = {
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
  }

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    cursor: 'pointer',
    userSelect: 'none',
  }

  const titleStyle = {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
  }

  const statusBadgeStyle = (status) => ({
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: getStatusColor(status),
    color: 'white',
  })

  const sectionHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #d1d5db',
    marginBottom: '0.75rem',
    cursor: 'pointer',
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
  }

  const metricCardStyle = {
    padding: '1rem',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
  }

  const metricLabelStyle = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.25rem',
  }

  const metricValueStyle = {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1f2937',
  }

  if (loading) {
    return (
      <div style={panelStyle}>
        <p style={{ textAlign: 'center', color: '#6b7280' }}>A carregar diagnósticos do sistema...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={panelStyle}>
        <p style={{ color: '#ef4444' }}>Erro ao carregar diagnósticos: {error}</p>
      </div>
    )
  }

  if (!diagnostics) {
    return null
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>🔍 Diagnósticos do Sistema</h2>
        <button
          onClick={fetchDiagnostics}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          🔄 Reanalysar
        </button>
      </div>

      {/* Memory Section */}
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.375rem',
        }}
      >
        <div
          style={sectionHeaderStyle}
          onClick={() => toggleSection('memory')}
        >
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
            💾 Memória
          </h3>
          <span style={statusBadgeStyle(diagnostics.memory.status)}>
            {diagnostics.memory.status}
          </span>
        </div>

        {expandedSections.memory && (
          <div style={gridStyle}>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>Heap Usado</div>
              <div style={metricValueStyle}>{diagnostics.memory.heapUsedMB} MB</div>
            </div>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>Heap Total</div>
              <div style={metricValueStyle}>{diagnostics.memory.heapTotalMB} MB</div>
            </div>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>Percentagem</div>
              <div style={metricValueStyle}>{diagnostics.memory.heapPercentage}%</div>
            </div>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>Externo</div>
              <div style={metricValueStyle}>{diagnostics.memory.externalMemMB} MB</div>
            </div>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>RSS</div>
              <div style={metricValueStyle}>{diagnostics.memory.rssMemMB} MB</div>
            </div>
          </div>
        )}
      </div>

      {/* File I/O Section */}
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.375rem',
        }}
      >
        <div
          style={sectionHeaderStyle}
          onClick={() => toggleSection('fileIO')}
        >
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
            📁 I/O de Ficheiros
          </h3>
          <span style={statusBadgeStyle(diagnostics.fileIO.status)}>
            {diagnostics.fileIO.status}
          </span>
        </div>

        {expandedSections.fileIO && (
          <div style={gridStyle}>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>Tempo Escrita</div>
              <div style={metricValueStyle}>
                {diagnostics.fileIO.writeTimeMs || diagnostics.fileIO.error}
              </div>
              {!diagnostics.fileIO.error && (
                <div style={{ ...metricLabelStyle, marginTop: '0.25rem' }}>ms</div>
              )}
            </div>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>Tempo Leitura</div>
              <div style={metricValueStyle}>
                {diagnostics.fileIO.readTimeMs || '—'}
              </div>
              {!diagnostics.fileIO.error && (
                <div style={{ ...metricLabelStyle, marginTop: '0.25rem' }}>ms</div>
              )}
            </div>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>Tempo Médio</div>
              <div style={metricValueStyle}>
                {diagnostics.fileIO.averageTimeMs || '—'}
              </div>
              {!diagnostics.fileIO.error && (
                <div style={{ ...metricLabelStyle, marginTop: '0.25rem' }}>ms</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Processor Section */}
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.375rem',
        }}
      >
        <div
          style={sectionHeaderStyle}
          onClick={() => toggleSection('processor')}
        >
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
            ⚙️ Processador & Uptime
          </h3>
        </div>

        {expandedSections.processor && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginTop: '1rem',
            }}
          >
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>Uptime</div>
              <div style={metricValueStyle} title={diagnostics.processor.uptimeFormatted}>
                {diagnostics.processor.uptimeFormatted}
              </div>
            </div>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>Node.js</div>
              <div style={metricValueStyle}>{diagnostics.processor.nodeVersion}</div>
            </div>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>Ambiente</div>
              <div style={metricValueStyle}>{diagnostics.processor.environment}</div>
            </div>
            <div style={metricCardStyle}>
              <div style={metricLabelStyle}>CPU User</div>
              <div style={metricValueStyle}>
                {Math.round(diagnostics.processor.cpuUsage.user / 1000)}ms
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Errors Section */}
      {diagnostics.recentErrors && diagnostics.recentErrors.recentCount > 0 && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: '0.375rem',
          }}
        >
          <div
            style={sectionHeaderStyle}
            onClick={() => toggleSection('errors')}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              ⚠️ Erros Recentes ({diagnostics.recentErrors.totalErrorsLogged})
            </h3>
            <span style={statusBadgeStyle('warning')}>
              {diagnostics.recentErrors.recentCount} recentes
            </span>
          </div>

          {expandedSections.errors && (
            <div style={{ marginTop: '1rem' }}>
              {diagnostics.recentErrors.errors.map((err, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: 'white',
                    border: '1px solid #fee2e2',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ color: '#991b1b', fontWeight: 500 }}>
                    {err.message}
                  </div>
                  <div style={{ color: '#7f1d1d', fontSize: '0.8rem' }}>
                    {err.endpoint} • {new Date(err.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Data Files Section */}
      <div
        style={{
          padding: '1rem',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.375rem',
        }}
      >
        <div
          style={sectionHeaderStyle}
          onClick={() => toggleSection('dataFiles')}
        >
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
            📊 Ficheiros de Dados
          </h3>
        </div>

        {expandedSections.dataFiles && (
          <div style={{ marginTop: '1rem' }}>
            {Object.entries(diagnostics.dataFileStatus).map(([filename, stats]) => (
              <div
                key={filename}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  backgroundColor: stats.exists ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${stats.exists ? '#bbf7d0' : '#fee2e2'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 500 }}>
                    {stats.exists ? '✅' : '❌'} {filename}
                  </div>
                  {stats.exists && (
                    <div style={{ color: '#6b7280' }}>
                      {stats.sizeMB > 1 ? `${stats.sizeMB}MB` : `${stats.sizeKB}KB`}
                    </div>
                  )}
                </div>
                {stats.exists && (
                  <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                    Modificado há {stats.lastModifiedMinutesAgo} minuto(s)
                  </div>
                )}
                {!stats.exists && (
                  <div style={{ color: '#7f1d1d', fontSize: '0.8rem' }}>
                    {stats.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
