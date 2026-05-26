'use client'

import { useState } from 'react'

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

const listStyle = {
  display: 'grid',
  gap: '14px',
  marginTop: '18px',
}

const itemStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '14px',
  alignItems: 'center',
  padding: '18px',
  borderRadius: '22px',
  background: '#f8fafc',
  border: '1px solid rgba(148, 163, 184, 0.18)',
}

const itemTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '17px',
  fontWeight: 900,
}

const itemTextStyle = {
  margin: '6px 0 0',
  color: '#52637a',
  fontSize: '14px',
  lineHeight: 1.65,
}

const statusStyle = enabled => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '98px',
  minHeight: '34px',
  padding: '0 12px',
  borderRadius: '999px',
  background: enabled ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.12)',
  color: enabled ? '#166534' : '#b42318',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
})

const buttonStyle = enabled => ({
  minHeight: '42px',
  border: 'none',
  borderRadius: '999px',
  padding: '0 16px',
  background: enabled ? '#10233e' : '#ff8c00',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer',
  opacity: 1,
})

const messageStyle = type => ({
  margin: '18px 0 0',
  padding: '12px 14px',
  borderRadius: '14px',
  border: type === 'error' ? '1px solid rgba(239, 68, 68, 0.18)' : '1px solid rgba(34, 197, 94, 0.18)',
  background: type === 'error' ? '#fff1f2' : '#f0fdf4',
  color: type === 'error' ? '#9f1239' : '#166534',
  fontSize: '14px',
  fontWeight: 700,
})

export default function FeatureFlagsPanel({ initialFlags }) {
  const [flags, setFlags] = useState(initialFlags)
  const [savingKey, setSavingKey] = useState('')
  const [feedback, setFeedback] = useState({ type: '', text: '' })

  async function handleToggle(flag) {
    const nextEnabled = !flag.enabled
    setSavingKey(flag.key)
    setFeedback({ type: '', text: '' })

    try {
      const response = await fetch('/api/developer/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: flag.key,
          enabled: nextEnabled,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel atualizar a funcionalidade.')
      }

      setFlags(data.flags)
      setFeedback({
        type: 'success',
        text: `${flag.title} ${nextEnabled ? 'ativada' : 'desativada'} com sucesso.`,
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error.message,
      })
    } finally {
      setSavingKey('')
    }
  }

  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>Controlo de funcionalidades</h2>
      <p style={textStyle}>
        Ativa ou desativa partes especificas da aplicacao sem teres de alterar o codigo. Os bloqueios
        passam a ser respeitados pelas paginas e APIs ligadas a cada funcao.
      </p>

      <div style={listStyle}>
        {flags.map(flag => (
          <article key={flag.key} style={itemStyle}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={itemTitleStyle}>{flag.title}</h3>
                <span style={statusStyle(flag.enabled)}>{flag.enabled ? 'Ativa' : 'Desativa'}</span>
              </div>
              <p style={itemTextStyle}>{flag.description}</p>
            </div>

            <button
              type="button"
              onClick={() => handleToggle(flag)}
              disabled={savingKey === flag.key}
              style={{
                ...buttonStyle(flag.enabled),
                opacity: savingKey === flag.key ? 0.65 : 1,
                cursor: savingKey === flag.key ? 'not-allowed' : 'pointer',
              }}
            >
              {savingKey === flag.key ? 'A guardar...' : flag.enabled ? 'Desativar' : 'Ativar'}
            </button>
          </article>
        ))}
      </div>

      {feedback.text ? <p style={messageStyle(feedback.type)}>{feedback.text}</p> : null}
    </section>
  )
}
