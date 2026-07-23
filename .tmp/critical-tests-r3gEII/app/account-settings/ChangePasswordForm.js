'use client'

import { useState } from 'react'
import { changePassword } from '../../frontend/controllers/account-controller.js'
import { createProtectedPayload } from '../../lib/browser-protected-payload'

const formStyle = {
  display: 'grid',
  gap: '16px',
  marginTop: '24px',
}

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

const messageStyle = type => ({
  margin: 0,
  padding: '12px 14px',
  borderRadius: '14px',
  color: type === 'success' ? '#166534' : '#b42318',
  background: type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(244, 63, 94, 0.1)',
  border: type === 'success' ? '1px solid rgba(34, 197, 94, 0.22)' : '1px solid rgba(244, 63, 94, 0.2)',
  fontWeight: 800,
})

export default function ChangePasswordForm() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  function handleChange(event) {
    const { name, value } = event.target
    setForm(previousForm => ({ ...previousForm, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const protectedPayload = await createProtectedPayload(form)
      await changePassword(protectedPayload, 'Não foi possível atualizar a palavra-passe.')

      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMessageType('success')
      setMessage('Palavra-passe atualizada com sucesso. Na próxima entrada usa a nova palavra-passe.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form style={formStyle} onSubmit={handleSubmit}>
      <div>
        <h2 style={formTitleStyle}>Trocar palavra-passe</h2>
      </div>

      <div style={gridStyle}>
        <label style={labelStyle}>
          Palavra-passe atual
          <input
            type="password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            style={inputStyle}
            autoComplete="current-password"
          />
        </label>
        <label style={labelStyle}>
          Nova palavra-passe
          <input
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            style={inputStyle}
            autoComplete="new-password"
          />
        </label>
        <label style={labelStyle}>
          Confirmar nova palavra-passe
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            style={inputStyle}
            autoComplete="new-password"
          />
        </label>
      </div>

      {message && <p style={messageStyle(messageType)}>{message}</p>}

      <button type="submit" disabled={saving} style={saving ? { ...buttonStyle, opacity: 0.65, cursor: 'not-allowed' } : buttonStyle}>
        {saving ? 'A guardar...' : 'Atualizar palavra-passe'}
      </button>
    </form>
  )
}
