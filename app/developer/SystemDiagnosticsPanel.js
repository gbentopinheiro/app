'use client'

import { useEffect, useMemo, useState } from 'react'

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

const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '38px',
  padding: '0 14px',
  borderRadius: '999px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: '#f8fafc',
  color: '#10233e',
  fontSize: '13px',
  fontWeight: 800,
  cursor: 'pointer',
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '14px',
  marginTop: '20px',
}

const cardStyle = tone => ({
  padding: '18px',
  borderRadius: '22px',
  background:
    tone === 'success'
      ? 'linear-gradient(135deg, #ecfdf3 0%, #ffffff 100%)'
      : tone === 'warning'
        ? 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)'
        : tone === 'danger'
          ? 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)'
          : '#f8fafc',
  border:
    tone === 'success'
      ? '1px solid rgba(34, 197, 94, 0.18)'
      : tone === 'warning'
        ? '1px solid rgba(249, 115, 22, 0.18)'
        : tone === 'danger'
          ? '1px solid rgba(244, 63, 94, 0.18)'
          : '1px solid rgba(148, 163, 184, 0.18)',
  display: 'grid',
  gap: '10px',
})

const cardLabelStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const cardValueStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '28px',
  lineHeight: 1.05,
  fontWeight: 900,
  letterSpacing: '-0.05em',
}

const cardHelperStyle = {
  margin: 0,
  color: '#52637a',
  fontSize: '13px',
  lineHeight: 1.6,
}

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

const sectionStyle = {
  marginTop: '20px',
  display: 'grid',
  gap: '14px',
}

const sectionTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '18px',
  fontWeight: 900,
}

const summaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '12px',
}

const summaryCardStyle = {
  padding: '14px 16px',
  borderRadius: '18px',
  background: '#f8fafc',
  border: '1px solid rgba(148, 163, 184, 0.18)',
}

const migrationWarningStyle = {
  padding: '14px 16px',
  borderRadius: '18px',
  background: '#fff7ed',
  border: '1px solid rgba(249, 115, 22, 0.18)',
  color: '#9a3412',
  display: 'grid',
  gap: '6px',
}

const migrationGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '14px',
}

const migrationColumnStyle = source => ({
  padding: '18px',
  borderRadius: '22px',
  background:
    source === 'mysql'
      ? 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)'
      : source === 'json'
        ? 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)'
        : 'linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)',
  border:
    source === 'mysql'
      ? '1px solid rgba(59, 130, 246, 0.18)'
      : source === 'json'
        ? '1px solid rgba(249, 115, 22, 0.18)'
        : '1px solid rgba(217, 119, 6, 0.18)',
  display: 'grid',
  gap: '12px',
})

const migrationItemStyle = {
  padding: '12px 14px',
  borderRadius: '16px',
  background: '#ffffff',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  display: 'grid',
  gap: '6px',
}

function formatGeneratedAt(value) {
  if (!value) {
    return 'Sem registo'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Sem registo'
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function SystemDiagnosticsPanel() {
  const [systemState, setSystemState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSystemState()
  }, [])

  async function fetchSystemState() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/developer/system-diagnostics')

      if (!response.ok) {
        throw new Error('Erro ao carregar estado do sistema')
      }

      setSystemState(await response.json())
    } catch (fetchError) {
      setError(fetchError.message || 'Erro ao carregar estado do sistema')
    } finally {
      setLoading(false)
    }
  }

  const migrationGroups = useMemo(() => {
    if (!systemState?.migration?.entities) {
      return []
    }

    return [
      {
        id: 'mysql',
        label: 'MySQL',
        items: systemState.migration.entities.filter(entity => entity.source === 'mysql'),
      },
      {
        id: 'json',
        label: 'JSON',
        items: systemState.migration.entities.filter(entity => entity.source === 'json'),
      },
      {
        id: 'hybrid',
        label: 'Hibrido',
        items: systemState.migration.entities.filter(entity => entity.source === 'hybrid'),
      },
    ]
  }, [systemState])

  if (loading) {
    return (
      <section style={panelStyle}>
        <h2 style={titleStyle}>Estado do Sistema</h2>
        <p style={textStyle}>A carregar estado tecnico...</p>
      </section>
    )
  }

  return (
    <section style={panelStyle}>
      <div style={topBarStyle}>
        <div>
          <h2 style={titleStyle}>Estado do Sistema</h2>
          <p style={textStyle}>
            Resumo tecnico de runtime, origem de dados e estado da migracao para MySQL.
          </p>
        </div>
        <button type="button" style={buttonStyle} onClick={fetchSystemState}>
          Recarregar
        </button>
      </div>

      {error ? <div style={messageStyle('error')}>{error}</div> : null}

      {systemState ? (
        <>
          <div style={gridStyle}>
            {systemState.cards.map(card => (
              <article key={card.id} style={cardStyle(card.tone)}>
                <p style={cardLabelStyle}>{card.label}</p>
                <p style={cardValueStyle}>{card.value}</p>
                <p style={cardHelperStyle}>{card.helper}</p>
              </article>
            ))}
          </div>

          {systemState.migration ? (
            <>
              <section style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Migracao MySQL</h3>
                <div style={summaryGridStyle}>
                  <article style={{ ...summaryCardStyle, background: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <p style={cardLabelStyle}>Origem principal dos dados</p>
                    <p style={{ ...cardValueStyle, fontSize: '24px', color: '#1e40af' }}>{systemState.migration.primaryDataSource}</p>
                  </article>
                  <article style={{ ...summaryCardStyle, background: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <p style={cardLabelStyle}>Entidades MySQL</p>
                    <p style={{ ...cardValueStyle, fontSize: '24px', color: '#1e40af' }}>{systemState.migration.summary.mysql}</p>
                  </article>
                  <article style={{ ...summaryCardStyle, background: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                    <p style={cardLabelStyle}>Entidades JSON</p>
                    <p style={{ ...cardValueStyle, fontSize: '24px', color: '#92400e' }}>{systemState.migration.summary.json}</p>
                  </article>
                  <article style={{ ...summaryCardStyle, background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                    <p style={cardLabelStyle}>Entidades Hibridas</p>
                    <p style={{ ...cardValueStyle, fontSize: '24px', color: '#9a3412' }}>{systemState.migration.summary.hybrid}</p>
                  </article>
                </div>

                {systemState.migration.summary.json > 0 || systemState.migration.summary.hybrid > 0 ? (
                  <article style={migrationWarningStyle}>
                    <strong>Aviso de migracao</strong>
                    <span>
                      A migracao MySQL ainda tem entidades hibridas. Ver auditoria tecnica antes de remover JSON.
                    </span>
                  </article>
                ) : null}
              </section>

              <section style={sectionStyle}>
                <div style={migrationGridStyle}>
                  {migrationGroups.map(group => (
                    <div key={group.id} style={migrationColumnStyle(group.id)}>
                      <h4 style={{ ...sectionTitleStyle, fontSize: '16px' }}>
                        {group.label} ({group.items.length})
                      </h4>
                      {group.items.length > 0 ? (
                        group.items.map(item => (
                          <article key={item.id} style={migrationItemStyle}>
                            <strong style={{ color: '#10233e', fontSize: '14px' }}>{item.label}</strong>
                            <span style={{ color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>{item.helper}</span>
                          </article>
                        ))
                      ) : (
                        <article style={migrationItemStyle}>
                          <strong style={{ color: '#10233e', fontSize: '14px' }}>Sem entidades</strong>
                          <span style={{ color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>
                            Nenhum item classificado neste grupo.
                          </span>
                        </article>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          <p style={{ ...textStyle, marginTop: '18px' }}>
            Ultima leitura: {formatGeneratedAt(systemState.generatedAt)}
          </p>
        </>
      ) : null}
    </section>
  )
}
