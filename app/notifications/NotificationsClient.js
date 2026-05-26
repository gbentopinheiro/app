'use client'

import { useMemo, useState } from 'react'

const panelStyle = {
  padding: '24px',
  borderRadius: '30px',
  background: 'var(--vp-surface-soft-strong)',
  border: '1px solid var(--vp-border)',
  boxShadow: 'var(--vp-shadow-panel)',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  marginBottom: '18px',
  flexWrap: 'wrap',
}

const headerActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
}

const sectionTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '28px',
  lineHeight: 1,
  letterSpacing: '-0.04em',
  fontWeight: 900,
}

const badgeStyle = {
  minWidth: '38px',
  height: '38px',
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: '999px',
  background: 'linear-gradient(135deg, #2563eb 0%, #ff8c00 100%)',
  color: '#ffffff',
  fontWeight: 900,
}

const deleteButtonStyle = isDisabled => ({
  width: '42px',
  height: '42px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '999px',
  border: '1px solid rgba(255, 140, 0, 0.34)',
  background: isDisabled ? '#fed7aa' : '#fff7ed',
  color: '#c2410c',
  fontSize: '18px',
  cursor: isDisabled ? 'not-allowed' : 'pointer',
  opacity: isDisabled ? 0.55 : 1,
  boxShadow: '0 10px 22px rgba(255, 140, 0, 0.12)',
})

const helperTextStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '13px',
  fontWeight: 800,
}

const listStyle = {
  display: 'grid',
  gap: '12px',
}

const itemStyle = isSelected => ({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: '14px',
  alignItems: 'start',
  padding: '16px',
  borderRadius: '20px',
  background: isSelected ? '#fff7ed' : '#ffffff',
  border: isSelected ? '1px solid rgba(255, 140, 0, 0.42)' : '1px solid rgba(216, 225, 238, 0.9)',
  boxShadow: isSelected ? '0 14px 30px rgba(255, 140, 0, 0.12)' : '0 14px 30px rgba(24, 58, 110, 0.08)',
})

const checkboxStyle = {
  width: '18px',
  height: '18px',
  marginTop: '2px',
  accentColor: '#f97316',
  cursor: 'pointer',
}

const metaStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '12px',
  lineHeight: 1.4,
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const noteStyle = {
  margin: '10px 0 0',
  color: '#10233e',
  fontSize: '15px',
  lineHeight: 1.55,
  fontWeight: 800,
}

const emptyStyle = {
  margin: 0,
  padding: '22px',
  borderRadius: '22px',
  background: '#ffffff',
  color: '#64748b',
  border: '1px solid rgba(216, 225, 238, 0.9)',
  fontWeight: 800,
}

const errorStyle = {
  margin: '0 0 16px',
  padding: '12px 14px',
  borderRadius: '16px',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#b91c1c',
  fontWeight: 800,
}

export default function NotificationsClient({ initialNotifications }) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [selectedIds, setSelectedIds] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const selectedCount = selectedIds.length
  const allSelected = notifications.length > 0 && selectedCount === notifications.length

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])

  function toggleSelection(id) {
    setSelectedIds(current => (
      current.includes(id)
        ? current.filter(selectedId => selectedId !== id)
        : [...current, id]
    ))
  }

  function toggleSelectAll() {
    setSelectedIds(current => (current.length === notifications.length ? [] : notifications.map(item => item.id)))
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0 || isDeleting) return

    setError('')
    setIsDeleting(true)

    try {
      const response = await fetch('/api/daily-work-notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível remover as notificações.')
      }

      setNotifications(current => current.filter(item => !selectedIdSet.has(item.id)))
      setSelectedIds([])
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <h2 style={sectionTitleStyle}>Notas dos chefes</h2>
        <div style={headerActionsStyle}>
          {notifications.length > 0 ? (
            <label style={helperTextStyle}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                style={{ ...checkboxStyle, marginTop: 0, marginRight: '8px' }}
              />
              Selecionar tudo
            </label>
          ) : null}
          <button
            type="button"
            style={deleteButtonStyle(selectedCount === 0 || isDeleting)}
            onClick={handleDeleteSelected}
            aria-label="Eliminar notificações selecionadas"
            title="Eliminar notificações selecionadas"
            disabled={selectedCount === 0 || isDeleting}
          >
            🗑
          </button>
          <span style={badgeStyle}>{notifications.length}</span>
        </div>
      </div>

      {error ? <p style={errorStyle}>{error}</p> : null}

      {notifications.length > 0 ? (
        <>
          <p style={{ ...helperTextStyle, marginBottom: '14px' }}>
            {selectedCount > 0 ? `${selectedCount} selecionada(s)` : 'Seleciona uma ou mais notificações para eliminar.'}
          </p>
          <div style={listStyle}>
            {notifications.map(notification => {
              const isSelected = selectedIdSet.has(notification.id)

              return (
                <article key={notification.id} style={itemStyle(isSelected)}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(notification.id)}
                    style={checkboxStyle}
                    aria-label={`Selecionar notificação de ${notification.chef}`}
                  />
                  <div>
                    <p style={metaStyle}>
                      {notification.date} - {notification.chef} - {notification.work}
                    </p>
                    <p style={noteStyle}>{notification.note}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      ) : (
        <p style={emptyStyle}>Ainda não existem notas novas dos chefes.</p>
      )}
    </section>
  )
}
