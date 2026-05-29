'use client'

import { useEffect, useState } from 'react'
import {
  DEFAULT_REMINDER_SETTINGS,
  REMINDER_SETTINGS_STORAGE_KEY,
  normalizeReminderSettings,
} from '../../lib/reminder-settings.js'

const formStyle = ({ withTopBorder = true, marginTop = '24px' } = {}) => ({
  display: 'grid',
  gap: '16px',
  marginTop,
  paddingTop: withTopBorder ? '24px' : 0,
  borderTop: withTopBorder ? '1px solid var(--vp-border)' : 'none',
})

const formTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '24px',
  lineHeight: 1.1,
  letterSpacing: '-0.04em',
  fontWeight: 900,
}

const formTextStyle = {
  margin: '6px 0 0',
  color: 'var(--vp-text-muted)',
  fontSize: '14px',
  lineHeight: 1.6,
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '14px',
}

const labelStyle = {
  display: 'grid',
  gap: '8px',
  color: '#10233e',
  fontSize: '13px',
  fontWeight: 800,
}

const inputStyle = {
  width: '100%',
  minHeight: '52px',
  borderRadius: '16px',
  border: '1px solid var(--vp-border)',
  background: '#ffffff',
  color: '#10233e',
  padding: '0 14px',
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box',
}

const buttonStyle = {
  width: 'fit-content',
  minHeight: '52px',
  border: 0,
  borderRadius: '16px',
  padding: '0 22px',
  background: 'linear-gradient(135deg, #2563eb 0%, #ff8c00 100%)',
  color: '#ffffff',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 16px 34px rgba(37, 99, 235, 0.2)',
}

const messageStyle = {
  margin: 0,
  padding: '12px 14px',
  borderRadius: '14px',
  color: '#166534',
  background: 'rgba(34, 197, 94, 0.12)',
  border: '1px solid rgba(34, 197, 94, 0.22)',
  fontWeight: 800,
}

export default function NotificationSettingsForm({
  title = 'Horário das notificações',
  description = 'Define a que horas queres receber o aviso para submeter o registo diário.',
  withTopBorder = true,
  marginTop = '24px',
}) {
  const [form, setForm] = useState(DEFAULT_REMINDER_SETTINGS)
  const [message, setMessage] = useState('')

  useEffect(() => {
    try {
      const storedSettings = JSON.parse(window.localStorage.getItem(REMINDER_SETTINGS_STORAGE_KEY) || '{}')
      setForm(normalizeReminderSettings(storedSettings))
    } catch (error) {
      setForm(DEFAULT_REMINDER_SETTINGS)
    }
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setForm(previousForm => ({ ...previousForm, [name]: value }))
    setMessage('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    const normalizedSettings = normalizeReminderSettings(form)
    window.localStorage.setItem(REMINDER_SETTINGS_STORAGE_KEY, JSON.stringify(normalizedSettings))
    setForm(normalizedSettings)
    setMessage('Horário das notificações atualizado com sucesso.')
  }

  return (
    <form style={formStyle({ withTopBorder, marginTop })} onSubmit={handleSubmit}>
      <div>
        <h2 style={formTitleStyle}>{title}</h2>
        {description ? <p style={formTextStyle}>{description}</p> : null}
      </div>

      <div style={gridStyle}>
        <label style={labelStyle}>
          Durante a semana
          <input type="time" name="weekday" value={form.weekday} onChange={handleChange} style={inputStyle} />
        </label>
        <label style={labelStyle}>
          Ao sábado
          <input type="time" name="saturday" value={form.saturday} onChange={handleChange} style={inputStyle} />
        </label>
      </div>

      {message && <p style={messageStyle}>{message}</p>}

      <button type="submit" style={buttonStyle}>
        Guardar horário
      </button>
    </form>
  )
}
