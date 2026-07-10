'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import EditPencilIcon, { editPencilButtonStyle } from '../components/EditPencilIcon'
import {
  BentixContent,
  BentixPage,
  BentixResponsiveGrid,
  BentixSection,
} from '../components/ViewportLayout.js'
import {
  deleteClient,
  listClients,
  saveClient,
} from '../../frontend/controllers/clients-controller.js'

const pageStyle = {
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: 'var(--btx-font-family)',
}

const shellStyle = {
  '--btx-content-gap': '24px',
}

const contentFlowStyle = {
  display: 'grid',
  gap: '24px',
  minWidth: 0,
}

const heroStyle = {
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--vp-module-hero)',
  border: '1px solid var(--vp-module-hero-border)',
  borderRadius: '32px',
  padding: '28px',
  boxShadow: 'var(--vp-hero-shadow-strong)',
  color: '#ffffff',
  '--vp-text-muted': 'var(--vp-hero-text-muted)',
  '--vp-text-soft': 'var(--vp-hero-text-soft)',
  '--vp-surface': 'var(--vp-hero-surface)',
  '--vp-border': 'var(--vp-hero-border)',
}

const panelStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-panel)',
  minWidth: 0,
}

const inputStyle = {
  width: '100%',
  marginTop: '8px',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface-muted)',
  fontSize: '14px',
}

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 700,
}

const topBarStyle = {
  display: 'grid',
  gap: '16px',
  alignItems: 'start',
}

const statGridStyle = {
  '--vp-grid-gap': '16px',
}

const buttonGroupStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  minWidth: 0,
}

const panelHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
}

const formStyle = {
  display: 'grid',
  gap: '14px',
  marginTop: '18px',
  minWidth: 0,
}

const formFieldsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
  gap: '14px',
}

const clientListStyle = {
  display: 'grid',
  gap: '12px',
  minWidth: 0,
}

const detailBodyStyle = {
  display: 'grid',
  gap: '12px',
  marginTop: '18px',
  color: 'var(--vp-text-muted)',
  minWidth: 0,
}

const detailLineStyle = {
  margin: 0,
  minWidth: 0,
}

const detailValueStyle = {
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
}

const primaryButtonStyle = {
  border: 'none',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'var(--vp-accent)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  border: '1px solid var(--vp-accent)',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'transparent',
  color: 'var(--vp-accent)',
  fontWeight: 700,
  cursor: 'pointer',
}

const dangerButtonStyle = {
  border: '1px solid #b42318',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'transparent',
  color: '#b42318',
  fontWeight: 700,
  cursor: 'pointer',
}

const iconButtonStyle = editPencilButtonStyle

const iconDangerButtonStyle = {
  ...dangerButtonStyle,
  width: '34px',
  height: '34px',
  padding: 0,
  fontSize: '14px',
}

const emptyClientForm = {
  id: null,
  name: '',
  vatNumber: '',
  contactName: '',
  email: '',
  phone: '',
  notes: '',
}

function getClientListButtonStyle(isSelected) {
  return {
    width: '100%',
    minWidth: 0,
    textAlign: 'left',
    padding: '16px',
    borderRadius: '16px',
    border: isSelected ? '1px solid var(--vp-accent)' : '1px solid var(--vp-border)',
    background: isSelected ? 'var(--vp-highlight)' : 'var(--vp-surface)',
    cursor: 'pointer',
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [form, setForm] = useState(emptyClientForm)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    setLoading(true)
    setError('')

    try {
      const data = await listClients('Erro ao carregar clientes')
      setClients(data)
      setSelectedClientId(current => current ?? data[0]?.id ?? null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = 'O nome do cliente Ã© obrigatÃ³rio.'

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setFormErrors(current => ({ ...current, [name]: '' }))
  }

  function startCreate() {
    setForm(emptyClientForm)
    setShowForm(true)
    setError('')
    setSuccess('')
    setFormErrors({})
  }

  function startEdit(client) {
    setForm({
      id: client.id,
      name: client.name ?? '',
      vatNumber: client.vatNumber ?? '',
      contactName: client.contactName ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      notes: client.notes ?? '',
    })
    setShowForm(true)
    setSelectedClientId(client.id)
    setError('')
    setSuccess('')
    setFormErrors({})
  }

  function cancelForm() {
    setShowForm(false)
    setForm(emptyClientForm)
    setFormErrors({})
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setSubmitting(true)

    try {
      const payload = {
        name: form.name,
        vatNumber: form.vatNumber,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        notes: form.notes,
      }

      const data = await saveClient(form.id, payload, 'Erro ao gravar cliente')

      await loadClients()
      setSelectedClientId(data.id)
      setShowForm(false)
      setForm(emptyClientForm)
      setSuccess(form.id ? 'Cliente atualizado com sucesso.' : 'Cliente criado com sucesso.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(clientId) {
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await deleteClient(clientId, 'Erro ao eliminar cliente')

      await loadClients()
      setSelectedClientId(null)
      setShowForm(false)
      setForm(emptyClientForm)
      setSuccess('Cliente eliminado com sucesso.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedClient = clients.find(client => client.id === selectedClientId) || null

  return (
    <BentixPage style={pageStyle}>
      <BentixContent width="app" gap="lg" style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/" style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}>
            Voltar ao menu
          </Link>
          <p style={{ margin: '18px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: 'var(--vp-text-soft)' }}>
            GestÃ£o de clientes
          </p>
          <h1 style={{ margin: '10px 0 12px', fontSize: '46px', lineHeight: 1.05 }}>
            Clientes
          </h1>

        </section>

        <div style={contentFlowStyle}>
        <section style={topBarStyle} className="btx-clients-toolbar">
          <BentixResponsiveGrid preset="stats" style={statGridStyle}>
            <BentixSection as="div">
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Clientes totais</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{clients.length}</div>
            </BentixSection>
          </BentixResponsiveGrid>

          <div style={buttonGroupStyle} className="btx-clients-toolbar-actions">
            <button type="button" onClick={startCreate} style={primaryButtonStyle}>
              Adicionar cliente
            </button>
          </div>
        </section>

        {showForm && (
          <BentixSection style={panelStyle}>
            <div style={panelHeaderStyle} className="btx-clients-form-header">
              <div>
                <h2 style={{ margin: 0 }}>{form.id ? 'Editar cliente' : 'Adicionar cliente'}</h2>
                <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)' }}>
                  MantÃ©m a ficha de cliente usada depois na relaÃ§Ã£o N para 1 com as obras.
                </p>
              </div>
              <button type="button" onClick={cancelForm} style={secondaryButtonStyle}>
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} style={formStyle}>
              <div style={formFieldsGridStyle}>
                <label style={labelStyle}>
                  Nome
                  <input type="text" name="name" value={form.name} onChange={handleChange} style={inputStyle} />
                  {formErrors.name && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.name}</span>}
                </label>
                <label style={labelStyle}>
                  NIF
                  <input type="text" name="vatNumber" value={form.vatNumber} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Contacto
                  <input type="text" name="contactName" value={form.contactName} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Email
                  <input type="email" name="email" value={form.email} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Telefone
                  <input type="text" name="phone" value={form.phone} onChange={handleChange} style={inputStyle} />
                </label>
              </div>

              <label style={labelStyle}>
                Notas
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={4} style={inputStyle} />
              </label>

              {error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}
              {success && <p style={{ margin: 0, color: '#1f7a45' }}>{success}</p>}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="submit" disabled={submitting} style={primaryButtonStyle}>
                  {submitting ? 'A gravar...' : form.id ? 'Guardar alteraÃ§Ãµes' : 'Criar cliente'}
                </button>
                {form.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(form.id)}
                    disabled={submitting}
                    style={iconDangerButtonStyle}
                    title="Eliminar cliente"
                    aria-label="Eliminar cliente"
                  >
                    ðŸ—‘
                  </button>
                )}
              </div>
            </form>
          </BentixSection>
        )}

        <BentixResponsiveGrid as="section" preset="split" className="btx-clients-main-grid" style={{ gap: '24px' }}>
          <BentixSection style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Lista de clientes</h2>
            {loading && <p>A carregar clientes...</p>}
            {!loading && !error && clients.length === 0 && <p>Sem clientes registados.</p>}
            {!loading && clients.length > 0 && (
              <div style={clientListStyle}>
                {clients.map(client => {
                  const isSelected = client.id === selectedClientId

                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedClientId(client.id)}
                      style={getClientListButtonStyle(isSelected)}
                    >
                      <strong style={detailValueStyle}>{client.name}</strong>
                      <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)', ...detailValueStyle }}>
                        {client.contactName || 'Sem contacto definido'}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </BentixSection>

          <BentixSection style={panelStyle}>
            <div style={panelHeaderStyle} className="btx-clients-detail-header">
              <h2 style={{ margin: 0 }}>Detalhe do cliente</h2>
              {selectedClient && (
                <button
                  type="button"
                  onClick={() => startEdit(selectedClient)}
                  style={iconButtonStyle}
                  title="Editar cliente"
                  aria-label="Editar cliente"
                >
                  <EditPencilIcon />
                </button>
              )}
            </div>

            {!selectedClient && <p style={{ marginTop: '18px' }}>Seleciona um cliente para ver os detalhes.</p>}

            {selectedClient && (
              <div style={detailBodyStyle}>
                <p style={detailLineStyle}><strong>Nome:</strong> <span style={detailValueStyle}>{selectedClient.name}</span></p>
                <p style={detailLineStyle}><strong>NIF:</strong> <span style={detailValueStyle}>{selectedClient.vatNumber || 'Sem NIF'}</span></p>
                <p style={detailLineStyle}><strong>Contacto:</strong> <span style={detailValueStyle}>{selectedClient.contactName || 'Sem contacto'}</span></p>
                <p style={detailLineStyle}><strong>Email:</strong> <span style={detailValueStyle}>{selectedClient.email || 'Sem email'}</span></p>
                <p style={detailLineStyle}><strong>Telefone:</strong> <span style={detailValueStyle}>{selectedClient.phone || 'Sem telefone'}</span></p>
                <p style={detailLineStyle}><strong>Notas:</strong> <span style={{ ...detailValueStyle, whiteSpace: 'pre-wrap' }}>{selectedClient.notes || 'Sem notas'}</span></p>
              </div>
            )}
          </BentixSection>
        </BentixResponsiveGrid>
        </div>
      </BentixContent>
    </BentixPage>
  )
}

