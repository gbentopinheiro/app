'use client'

import { useState, useEffect } from 'react'

export default function DataManagementPanel() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/developer/data-management?action=stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type = 'full') => {
    try {
      setExporting(true)
      const res = await fetch(`/api/developer/data-management?action=export&type=${type}`)
      if (!res.ok) throw new Error('Export failed')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-${type}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('Erro ao exportar: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const panelStyle = {
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
  }

  const sectionStyle = {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
  }

  const cardStyle = {
    padding: '1rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    textAlign: 'center',
  }

  const labelStyle = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.5rem',
  }

  const valueStyle = {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1f2937',
  }

  const buttonStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    marginRight: '0.5rem',
    marginBottom: '0.5rem',
  }

  if (loading) {
    return (
      <div style={panelStyle}>
        <p style={{ textAlign: 'center', color: '#6b7280' }}>A carregar estatísticas...</p>
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
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
          💾 Gestão de Dados (Backup & Export)
        </h2>
      </div>

      {/* Statistics */}
      {stats && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: '0 0 1rem 0' }}>
            📊 Estatísticas
          </h3>
          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={labelStyle}>Total Ficheiros</div>
              <div style={valueStyle}>{Object.keys(stats.files).length}</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Tamanho Total</div>
              <div style={valueStyle}>{stats.totalSizeMB.toFixed(2)} MB</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Total Pessoas</div>
              <div style={valueStyle}>{stats.entityCounts['people.json'] || 0}</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Total Obras</div>
              <div style={valueStyle}>{stats.entityCounts['works.json'] || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: '0 0 1rem 0' }}>
          📥 Exportar Dados
        </h3>
        <div>
          <button
            onClick={() => handleExport('full')}
            disabled={exporting}
            style={{ ...buttonStyle, backgroundColor: exporting ? '#9ca3af' : '#3b82f6' }}
          >
            {exporting ? 'A exportar...' : '📦 Tudo'}
          </button>
          <button
            onClick={() => handleExport('people')}
            disabled={exporting}
            style={{ ...buttonStyle, backgroundColor: exporting ? '#9ca3af' : '#10b981' }}
          >
            👥 Pessoas
          </button>
          <button
            onClick={() => handleExport('works')}
            disabled={exporting}
            style={{ ...buttonStyle, backgroundColor: exporting ? '#9ca3af' : '#f59e0b' }}
          >
            🏗️ Obras
          </button>
          <button
            onClick={() => handleExport('clients')}
            disabled={exporting}
            style={{ ...buttonStyle, backgroundColor: exporting ? '#9ca3af' : '#8b5cf6' }}
          >
            🏢 Clientes
          </button>
          <button
            onClick={() => handleExport('assignments')}
            disabled={exporting}
            style={{ ...buttonStyle, backgroundColor: exporting ? '#9ca3af' : '#ec4899' }}
          >
            📋 Atribuições
          </button>
        </div>
      </div>

      {/* File Details */}
      {stats && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: '0 0 1rem 0' }}>
            📁 Detalhes dos Ficheiros
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #d1d5db' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Ficheiro</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Tamanho</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Entidades</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Modificado</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.files).map(([filename, file]) => (
                  <tr key={filename} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.5rem' }}>{filename}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', color: '#6b7280' }}>
                      {file.sizeMB > 1 ? `${file.sizeMB.toFixed(2)} MB` : `${file.sizeKB} KB`}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 500 }}>
                      {file.count || '—'}
                    </td>
                    <td style={{ padding: '0.5rem', color: '#6b7280', fontSize: '0.8rem' }}>
                      {file.lastModified ? new Date(file.lastModified).toLocaleDateString('pt-PT') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
