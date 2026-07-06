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
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const shellStyle = {
  '--btx-content-gap': '24px',
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

    if (!form.name.trim()) nextErrors.name = 'O nome do cliente é obrigatório.'

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
            Gestão de clientes
          </p>
          <h1 style={{ margin: '10px 0 12px', fontSize: '46px', lineHeight: 1.05 }}>
            Clientes
          </h1>

        </section>

        <div style={{ display: 'grid', gap: '24px' }}>
        <section style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <BentixSection as="div">
            <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Clientes totais</div>
            <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{clients.length}</div>
          </BentixSection>
          <button type="button" onClick={startCreate} style={primaryButtonStyle}>
            Adicionar cliente
          </button>
        </section>

        {showForm && (
          <section style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>{form.id ? 'Editar cliente' : 'Adicionar cliente'}</h2>
                <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)' }}>
                  Mantém a ficha de cliente usada depois na relação N para 1 com as obras.
                </p>
              </div>
              <button type="button" onClick={cancelForm} style={secondaryButtonStyle}>
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
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
                <textárea name="notes" value={form.notes} onChange={handleChange} rows={4} style={inputStyle} />
              </label>

              {error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}
              {success && <p style={{ margin: 0, color: '#1f7a45' }}>{success}</p>}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="submit" disabled={submitting} style={primaryButtonStyle}>
                  {submitting ? 'A gravar...' : form.id ? 'Guardar alterações' : 'Criar cliente'}
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
                    🗑
                  </button>
                )}
              </div>
            </form>
          </section>
        )}

        <BentixResponsiveGrid as="section" preset="split" style={{ gap: '24px' }}>
          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Lista de clientes</h2>
            {loading && <p>A carregar clientes...</p>}
            {!loading && !error && clients.length === 0 && <p>Sem clientes registados.</p>}
            {!loading && clients.length > 0 && (
              <div style={{ display: 'grid', gap: '12px' }}>
                {clients.map(client => {
                  const isSelected = client.id === selectedClientId

                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedClientId(client.id)}
                      style={{
                        textAlign: 'left',
                        padding: '16px',
                        borderRadius: '16px',
                        border: isSelected ? '1px solid var(--vp-accent)' : '1px solid var(--vp-border)',
                        background: isSelected ? 'var(--vp-highlight)' : 'var(--vp-surface)',
                        cursor: 'pointer',
                      }}
                    >
                      <strong>{client.name}</strong>
                      <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>{client.contactName || 'Sem contacto definido'}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <section style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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
              <div style={{ display: 'grid', gap: '12px', marginTop: '18px', color: 'var(--vp-text-muted)' }}>
                <p style={{ margin: 0 }}><strong>Nome:</strong> {selectedClient.name}</p>
                <p style={{ margin: 0 }}><strong>NIF:</strong> {selectedClient.vatNumber || 'Sem NIF'}</p>
                <p style={{ margin: 0 }}><strong>Contacto:</strong> {selectedClient.contactName || 'Sem contacto'}</p>
                <p style={{ margin: 0 }}><strong>Email:</strong> {selectedClient.email || 'Sem email'}</p>
                <p style={{ margin: 0 }}><strong>Telefone:</strong> {selectedClient.phone || 'Sem telefone'}</p>
                <p style={{ margin: 0 }}><strong>Notas:</strong> {selectedClient.notes || 'Sem notas'}</p>
              </div>
            )}
          </section>
        </BentixResponsiveGrid>
        </div>
      </BentixContent>
    </BentixPage>
  )
}
