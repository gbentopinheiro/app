'use client'

import { useEffect, useState } from 'react'

const panelStyle = {
  display: 'grid',
  gap: '12px',
  marginTop: '16px',
  padding: '14px',
  borderRadius: '18px',
  background: 'var(--vp-stat-surface)',
  border: '1px solid var(--vp-stat-border)',
  boxShadow: 'var(--vp-stat-shadow)',
}

const labelStyle = {
  margin: 0,
  color: 'var(--vp-text-muted)',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.08em',
}

const valueStyle = {
  margin: '6px 0 0',
  color: 'var(--vp-text)',
  fontSize: '16px',
  fontWeight: 900,
  lineHeight: 1.35,
}

const titleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '18px',
  lineHeight: 1.2,
  fontWeight: 900,
  letterSpacing: '-0.03em',
}

const buttonStyle = disabled => ({
  width: '100%',
  minHeight: '48px',
  border: 'none',
  borderRadius: '16px',
  background: disabled
    ? 'linear-gradient(90deg, #b9c9dd 0%, #b9c9dd 100%)'
    : 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 55%, #f97316 100%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 900,
  cursor: disabled ? 'not-allowed' : 'pointer',
  boxShadow: disabled ? 'none' : '0 16px 30px rgba(29, 78, 216, 0.2)',
})

const messageStyle = type => ({
  margin: 0,
  padding: '12px 14px',
  borderRadius: '14px',
  color: type === 'success' ? '#166534' : '#b42318',
  background: type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(244, 63, 94, 0.1)',
  border: type === 'success' ? '1px solid rgba(34, 197, 94, 0.22)' : '1px solid rgba(244, 63, 94, 0.2)',
  fontWeight: 800,
  fontSize: '13px',
})

function getPermissionStatusLabel(permission) {
  if (permission === 'granted') return 'Ativas'
  if (permission === 'denied') return 'Bloqueadas'
  if (permission === 'unsupported') return 'Indisponíveis'
  return 'Por ativar'
}

export default function MobileNotificationPermissionCard() {
  const [permission, setPermission] = useState('default')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }

    setPermission(window.Notification.permission)
  }, [])

  async function handleEnableNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window) || requesting) {
      return
    }

    setRequesting(true)
    setMessage('')

    try {
      const nextPermission = await window.Notification.requestPermission()
      setPermission(nextPermission)

      if (nextPermission === 'granted') {
        setMessageType('success')
        setMessage('Notificações ativadas com sucesso.')
      } else if (nextPermission === 'denied') {
        setMessageType('error')
        setMessage('As notificações foram bloqueadas no navegador.')
      }
    } catch (error) {
      setMessageType('error')
      setMessage('Não foi possível ativar as notificações.')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div style={panelStyle}>
      <h3 style={titleStyle}>Ativar notificações</h3>

      <div>
        <p style={labelStyle}>Estado</p>
        <p style={valueStyle}>{getPermissionStatusLabel(permission)}</p>
      </div>
      {message ? <p style={messageStyle(messageType)}>{message}</p> : null}

      {permission !== 'granted' && permission !== 'unsupported' ? (
        <button type="button" onClick={handleEnableNotifications} disabled={requesting} style={buttonStyle(requesting)}>
          {requesting ? 'A ativar...' : 'Ativar notificações'}
        </button>
      ) : null}
    </div>
  )
}
