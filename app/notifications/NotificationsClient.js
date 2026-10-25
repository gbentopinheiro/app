'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { deleteNotifications } from '../../frontend/controllers/notifications-controller.js'
import { useOperationNotificationState } from '../../frontend/hooks/use-operation-notification-state.js'
import { canRemoveNotification, getNotificationDeleteSourceIds } from '../../lib/operation-notification-state.js'
import TrashBinIcon from '../components/TrashBinIcon'

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
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
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

const checkboxGhostStyle = {
  width: '18px',
  height: '18px',
  marginTop: '2px',
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

export default function NotificationsClient() {
  const { notifications, dismissNotifications, ready } = useOperationNotificationState()
  const [selectedIds, setSelectedIds] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const validIds = new Set(notifications.filter(canRemoveNotification).map(item => item.id))
    setSelectedIds(current => current.filter(id => validIds.has(id)))
  }, [notifications])

  const deletableNotifications = useMemo(
    () => notifications.filter(canRemoveNotification),
    [notifications],
  )
  const deletableIds = useMemo(
    () => deletableNotifications.map(notification => notification.id),
    [deletableNotifications],
  )
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const selectedNotifications = useMemo(
    () => notifications.filter(notification => selectedIdSet.has(notification.id)),
    [notifications, selectedIdSet],
  )
  const selectedCount = selectedIds.length
  const allSelected = deletableIds.length > 0 && selectedCount === deletableIds.length

  function toggleSelection(id) {
    setSelectedIds(current => (
      current.includes(id)
        ? current.filter(selectedId => selectedId !== id)
        : [...current, id]
    ))
  }

  function toggleSelectAll() {
    setSelectedIds(current => (current.length === deletableIds.length ? [] : deletableIds))
  }

  async function handleDelete(targets) {
    if (targets.length === 0 || isDeleting) return

    setError('')
    setIsDeleting(true)

    try {
      const sourceIds = getNotificationDeleteSourceIds(targets)
      if (sourceIds.length > 0) await deleteNotifications(sourceIds, 'Não foi possível remover as notificações.')
      dismissNotifications(targets)
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
        <h2 style={sectionTitleStyle}>Notificações ativas</h2>
        <div style={headerActionsStyle}>
          {deletableNotifications.length > 0 ? (
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
            onClick={event => { event.preventDefault(); event.stopPropagation(); handleDelete(selectedNotifications) }}
            aria-label="Eliminar notificações selecionadas"
            title="Eliminar notificações selecionadas"
            disabled={selectedCount === 0 || isDeleting}
          >
            🗑
          </button>
          <span style={badgeStyle} aria-label="Total de notificações ativas" aria-live="polite">{ready ? notifications.length : '—'}</span>
        </div>
      </div>

      {error ? <p style={errorStyle}>{error}</p> : null}

      {!ready ? <p style={emptyStyle}>A carregar notificações...</p> : notifications.length > 0 ? (
        <>
          <p style={{ ...helperTextStyle, marginBottom: '14px' }}>
            {selectedCount > 0
              ? `${selectedCount} selecionada(s)`
              : deletableNotifications.length > 0
                ? 'Usa o lixo para remover um aviso ou seleciona vários. Dispensar um conflito não altera o planeamento.'
                : 'Os avisos atualizam-se automaticamente quando a situação é resolvida.'}
          </p>
          <div style={listStyle}>
            {notifications.map(notification => {
              const isSelected = selectedIdSet.has(notification.id)

              return (
                <article key={notification.id} data-notification-id={notification.id} style={itemStyle(isSelected)}>
                  {canRemoveNotification(notification) ? (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(notification.id)}
                      onClick={event => event.stopPropagation()}
                      disabled={isDeleting}
                      style={checkboxStyle}
                      aria-label={`Selecionar notificação ${notification.chef} - ${notification.work}`}
                    />
                  ) : (
                    <span style={checkboxGhostStyle} aria-hidden="true" />
                  )}
                  <div>
                    {notification.title ? (
                      <p style={{ margin: '0 0 8px', color: '#b45309', fontWeight: 800 }}>⚠ {notification.title}</p>
                    ) : null}
                    <p style={metaStyle}>
                      {notification.date} - {notification.chef} - {notification.work}
                    </p>
                    <p style={noteStyle}>
                      {notification.href ? <Link href={notification.href} style={{ color: 'inherit' }}>{notification.note}</Link> : notification.note}
                    </p>
                  </div>
                  {canRemoveNotification(notification) ? (
                    <button
                      type="button"
                      style={deleteButtonStyle(isDeleting)}
                      disabled={isDeleting}
                      aria-label={`${notification.deletable ? 'Eliminar' : 'Dispensar'} notificação de ${notification.chef} - ${notification.work}`}
                      title={notification.deletable ? 'Eliminar notificação' : 'Dispensar este aviso de conflito'}
                      onClick={event => { event.preventDefault(); event.stopPropagation(); handleDelete([notification]) }}
                    >
                      <TrashBinIcon size={18} />
                    </button>
                  ) : null}
                </article>
              )
            })}
          </div>
        </>
      ) : (
        <p style={emptyStyle}>Ainda não existem notificações ativas.</p>
      )}
    </section>
  )
}
