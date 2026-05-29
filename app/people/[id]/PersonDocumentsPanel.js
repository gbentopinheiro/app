'use client'

import { useState } from 'react'

const WARNING_OPTIONS = [
  { value: '30', label: '30 dias antes' },
  { value: '15', label: '15 dias antes' },
  { value: '7', label: '7 dias antes' },
  { value: '1', label: '1 dia antes' },
  { value: '0', label: 'No proprio dia' },
]

const panelStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-panel)',
}

const formStyle = {
  display: 'grid',
  gap: '16px',
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

const textareaStyle = {
  ...inputStyle,
  minHeight: '120px',
  padding: '14px',
  resize: 'vertical',
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

const secondaryButtonStyle = {
  width: 'fit-content',
  minHeight: '52px',
  border: '1px solid var(--vp-accent)',
  borderRadius: '16px',
  padding: '0 22px',
  background: 'transparent',
  color: 'var(--vp-accent)',
  fontWeight: 900,
  cursor: 'pointer',
}

const deleteButtonStyle = {
  border: '1px solid rgba(180, 35, 24, 0.16)',
  borderRadius: '999px',
  padding: '10px 14px',
  background: 'rgba(244, 63, 94, 0.08)',
  color: '#b42318',
  fontWeight: 800,
  cursor: 'pointer',
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

const emptyStateStyle = {
  margin: 0,
  padding: '18px',
  borderRadius: '18px',
  background: 'var(--vp-surface)',
  border: '1px solid var(--vp-border)',
  color: 'var(--vp-text-muted)',
  fontWeight: 700,
}

const documentListStyle = {
  display: 'grid',
  gap: '12px',
}

const documentCardStyle = {
  display: 'grid',
  gap: '14px',
  padding: '18px',
  borderRadius: '20px',
  background: 'var(--vp-surface)',
  border: '1px solid var(--vp-border)',
}

const documentMetaGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '12px',
}

const metaLabelStyle = {
  margin: 0,
  color: 'var(--vp-text-soft)',
  fontSize: '11px',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const metaValueStyle = {
  margin: '6px 0 0',
  color: '#10233e',
  fontSize: '15px',
  fontWeight: 800,
  lineHeight: 1.5,
}

const wideFieldStyle = {
  gridColumn: '1 / -1',
}

function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function getStatusBadgeStyle(status) {
  if (status === 'expired') {
    return {
      color: '#b42318',
      background: 'rgba(244, 63, 94, 0.12)',
      border: '1px solid rgba(244, 63, 94, 0.18)',
    }
  }

  if (status === 'warning') {
    return {
      color: '#9a4b00',
      background: 'rgba(255, 140, 0, 0.14)',
      border: '1px solid rgba(255, 140, 0, 0.2)',
    }
  }

  return {
    color: '#1e3a8a',
    background: 'rgba(37, 99, 235, 0.1)',
    border: '1px solid rgba(37, 99, 235, 0.16)',
  }
}

function sortDocuments(list) {
  return [...list].sort((left, right) => {
    const dateComparison = String(left.expirationDate || '').localeCompare(String(right.expirationDate || ''))

    if (dateComparison !== 0) {
      return dateComparison
    }

    return String(left.name || '').localeCompare(String(right.name || ''), 'pt-PT', { sensitivity: 'base' })
  })
}

const emptyForm = {
  name: '',
  expirationDate: '',
  warningDays: '30',
  notes: '',
}

export default function PersonDocumentsPanel({ personId, initialDocuments = [] }) {
  const [documents, setDocuments] = useState(sortDocuments(initialDocuments))
  const [form, setForm] = useState(emptyForm)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
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
      const response = await fetch(`/api/people/${personId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          expirationDate: form.expirationDate,
          warningDays: Number(form.warningDays),
          notes: form.notes,
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel guardar o documento.')
      }

      setDocuments(currentDocuments => sortDocuments([...currentDocuments, data]))
      setForm(emptyForm)
      setShowAddForm(false)
      setMessageType('success')
      setMessage('Documento registado com sucesso.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(documentId) {
    if (!window.confirm('Queres remover este documento?')) {
      return
    }

    setDeletingId(documentId)
    setMessage('')

    try {
      const response = await fetch(`/api/people/${personId}/documents/${documentId}`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel remover o documento.')
      }

      setDocuments(currentDocuments => currentDocuments.filter(document => Number(document.id) !== Number(documentId)))
      setMessageType('success')
      setMessage('Documento removido com sucesso.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section style={panelStyle}>
      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', lineHeight: 1.05 }}>Documentos</h2>
          </div>
          {!showAddForm ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              style={buttonStyle}
            >
              Adicionar documento
            </button>
          ) : null}
        </div>

        {message && <p style={messageStyle(messageType)}>{message}</p>}

        {showAddForm ? (
          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={gridStyle}>
              <label style={labelStyle}>
                Nome do documento
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Ex.: Cartao de cidadao"
                  required
                />
              </label>

              <label style={labelStyle}>
                Data de expiracao
                <input
                  type="date"
                  name="expirationDate"
                  value={form.expirationDate}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                />
              </label>

              <label style={labelStyle}>
                Avisar
                <select name="warningDays" value={form.warningDays} onChange={handleChange} style={inputStyle}>
                  {WARNING_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ ...labelStyle, ...wideFieldStyle }}>
                Notas opcionais
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  style={textareaStyle}
                  placeholder="Informacao extra sobre o documento"
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={saving}
                style={saving ? { ...buttonStyle, opacity: 0.65, cursor: 'not-allowed' } : buttonStyle}
              >
                {saving ? 'A guardar...' : 'Adicionar documento'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (saving) return
                  setShowAddForm(false)
                  setForm(emptyForm)
                }}
                style={secondaryButtonStyle}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}

        <div style={{ display: 'grid', gap: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px' }}>Documentos registados</h3>
          </div>

          {documents.length === 0 ? (
            <p style={emptyStateStyle}>Ainda nao existem documentos registados para esta pessoa.</p>
          ) : (
            <div style={documentListStyle}>
              {documents.map(document => {
                const badgeStyle = getStatusBadgeStyle(document.status)

                return (
                  <article key={document.id} style={documentCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '20px', color: '#10233e' }}>{document.name}</h4>
                        <p
                          style={{
                            margin: '8px 0 0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 900,
                            ...badgeStyle,
                          }}
                        >
                          {document.statusLabel}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(document.id)}
                        disabled={deletingId === document.id}
                        style={deletingId === document.id ? { ...deleteButtonStyle, opacity: 0.65, cursor: 'not-allowed' } : deleteButtonStyle}
                      >
                        {deletingId === document.id ? 'A remover...' : 'Remover'}
                      </button>
                    </div>

                    <div style={documentMetaGridStyle}>
                      <div>
                        <p style={metaLabelStyle}>Data de expiracao</p>
                        <p style={metaValueStyle}>{formatDateLabel(document.expirationDate)}</p>
                      </div>
                      <div>
                        <p style={metaLabelStyle}>Data do aviso</p>
                        <p style={metaValueStyle}>{formatDateLabel(document.warningDate)}</p>
                      </div>
                      <div>
                        <p style={metaLabelStyle}>Prazo do aviso</p>
                        <p style={metaValueStyle}>{document.warningDaysLabel}</p>
                      </div>
                      {document.notes && (
                        <div style={wideFieldStyle}>
                          <p style={metaLabelStyle}>Notas</p>
                          <p style={{ ...metaValueStyle, whiteSpace: 'pre-wrap' }}>{document.notes}</p>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
