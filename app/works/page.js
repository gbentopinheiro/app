'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const pageStyle = {
  minHeight: '100vh',
  padding: '40px 24px 60px',
  background: 'linear-gradient(180deg, #f4efe5 0%, #e8f0eb 100%)',
  color: '#1d2a24',
  fontFamily: 'Georgia, serif',
}

const shellStyle = {
  maxWidth: '1240px',
  margin: '0 auto',
  display: 'grid',
  gap: '24px',
}

const heroStyle = {
  background: 'linear-gradient(135deg, rgba(255,251,245,0.95) 0%, rgba(231,240,235,0.95) 100%)',
  border: '1px solid #d6d3ca',
  borderRadius: '28px',
  padding: '28px',
  boxShadow: '0 24px 60px rgba(42, 63, 53, 0.10)',
}

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
}

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '14px',
  flex: 1,
}

const statCardStyle = {
  borderRadius: '18px',
  padding: '18px',
  background: '#fff',
  border: '1px solid #d7ddd6',
}

const panelStyle = {
  background: 'rgba(255, 252, 247, 0.9)',
  border: '1px solid #d4d2c8',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 16px 40px rgba(54, 72, 63, 0.08)',
}

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(28, 36, 32, 0.38)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  zIndex: 50,
}

const modalCardStyle = {
  width: 'min(980px, 100%)',
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  background: 'rgba(255, 252, 247, 0.98)',
  border: '1px solid #d4d2c8',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: '0 24px 70px rgba(28, 36, 32, 0.18)',
}

const inputStyle = {
  width: '100%',
  marginTop: '8px',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #bfc7bc',
  background: '#fffdfa',
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
  background: '#285943',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  border: '1px solid #285943',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'transparent',
  color: '#285943',
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

const emptyWorkForm = {
  id: null,
  number: '',
  name: '',
  clientId: '',
  location: '',
  status: 'planned',
  budget: '',
  defaultHourlyCost: '',
  startDate: '',
  endDate: '',
  notes: '',
}

export default function WorksPage() {
  const [works, setWorks] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [form, setForm] = useState(emptyWorkForm)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const activeWorks = useMemo(() => works.filter(work => work.status !== 'completed'), [works])
  const archivedWorks = useMemo(() => works.filter(work => work.status === 'completed'), [works])

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [worksResponse, clientsResponse] = await Promise.all([
        fetch('/api/works'),
        fetch('/api/clients'),
      ])

      const worksData = await worksResponse.json()
      const clientsData = await clientsResponse.json()

      if (!worksResponse.ok) throw new Error(worksData.error || 'Erro ao carregar obras')
      if (!clientsResponse.ok) throw new Error(clientsData.error || 'Erro ao carregar clientes')

      setWorks(worksData)
      setClients(clientsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setFormErrors(current => ({ ...current, [name]: '' }))
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = 'O nome da obra e obrigatorio.'
    if (!form.clientId) nextErrors.clientId = 'Seleciona um cliente.'
    if (form.defaultHourlyCost !== '' && Number(form.defaultHourlyCost) < 0) nextErrors.defaultHourlyCost = 'O preco hora nao pode ser negativo.'
    if (form.budget !== '' && Number(form.budget) < 0) nextErrors.budget = 'O orcamento nao pode ser negativo.'
    if (form.startDate && Number.isNaN(new Date(form.startDate).getTime())) nextErrors.startDate = 'A data de comeco e invalida.'
    if (form.endDate && Number.isNaN(new Date(form.endDate).getTime())) nextErrors.endDate = 'A data de finalizacao e invalida.'

    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      nextErrors.endDate = 'A data de finalizacao nao pode ser anterior ao comeco.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function startCreate() {
    setForm(emptyWorkForm)
    setShowCreateForm(true)
    setSuccess('')
    setError('')
    setFormErrors({})
  }

  function cancelCreate() {
    setShowCreateForm(false)
    setForm(emptyWorkForm)
    setFormErrors({})
  }

  function startEdit(work) {
    setForm({
      id: work.id,
      number: work.number ?? '',
      name: work.name ?? '',
      clientId: work.clientId ? String(work.clientId) : '',
      location: work.location ?? '',
      status: work.status ?? 'planned',
      budget: work.budget ?? '',
      defaultHourlyCost: work.defaultHourlyCost ?? '',
      startDate: work.startDate ?? '',
      endDate: work.endDate ?? '',
      notes: work.notes ?? '',
    })
    setShowCreateForm(true)
    setSuccess('')
    setError('')
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
        number: form.number === '' ? undefined : Number(form.number),
        name: form.name,
        clientId: Number(form.clientId),
        location: form.location,
        status: form.status,
        budget: form.budget === '' ? 0 : Number(form.budget),
        defaultHourlyCost: form.defaultHourlyCost === '' ? 0 : Number(form.defaultHourlyCost),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        notes: form.notes,
      }

      const url = form.id ? `/api/works/${form.id}` : '/api/works'
      const method = form.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao gravar obra')

      await loadData()
      setSuccess(form.id ? 'Obra atualizada com sucesso.' : 'Obra criada com sucesso.')
      setShowCreateForm(false)
      setForm(emptyWorkForm)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(workId) {
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/works/${workId}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao eliminar obra')

      await loadData()
      setSuccess('Obra eliminada com sucesso.')
      setShowCreateForm(false)
      setForm(emptyWorkForm)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function renderWorkRow(work) {
    return (
      <div
        key={work.id}
        style={{
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid #d7ddd6',
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        <div>
          <strong>#{work.number} - {work.name}</strong>
          <p style={{ margin: '6px 0 0', color: '#4f5d56' }}>{work.client?.name || 'Sem cliente'}</p>
          <p style={{ margin: '6px 0 0', color: '#4f5d56' }}>Estado: {work.status}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link href={`/works/${work.id}`} style={{ ...secondaryButtonStyle, textDecoration: 'none' }}>
            Ver obra
          </Link>
          <button type="button" onClick={() => startEdit(work)} style={secondaryButtonStyle}>
            Editar
          </button>
        </div>
      </div>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/" style={{ color: '#285943', textDecoration: 'none', fontWeight: 700 }}>
            Voltar ao menu
          </Link>
          <p style={{ margin: '18px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: '#5f6f66' }}>
            Gestao de obra
          </p>
          <h1 style={{ margin: '10px 0 12px', fontSize: '46px', lineHeight: 1.05 }}>
            Lista de obras
          </h1>
          <p style={{ margin: 0, maxWidth: '780px', color: '#4d5c55', fontSize: '17px', lineHeight: 1.7 }}>
            Cada obra fica agora associada a um unico cliente. Escolhe uma obra para abrir a pagina dedicada com o
            detalhe e as afetacoes relacionadas.
          </p>
        </section>

        <section style={topBarStyle}>
          <div style={statGridStyle}>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Obras totais</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{works.length}</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Obras ativas</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{activeWorks.length}</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: '#66756d', textTransform: 'uppercase' }}>Obras antigas</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{archivedWorks.length}</div>
            </article>
          </div>

          <button type="button" onClick={startCreate} style={primaryButtonStyle}>
            Adicionar obra
          </button>
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Obras ativas</h2>
          {loading && <p>A carregar obras...</p>}
          {!loading && error && <p style={{ color: '#b42318' }}>{error}</p>}
          {!loading && !error && activeWorks.length === 0 && <p>Sem obras ativas.</p>}
          {!loading && !error && activeWorks.length > 0 && (
            <div style={{ display: 'grid', gap: '12px' }}>
              {activeWorks.map(renderWorkRow)}
            </div>
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Obras antigas com resumo</h2>
          {!loading && archivedWorks.length === 0 && <p>Sem obras antigas.</p>}
          {!loading && archivedWorks.length > 0 && (
            <div style={{ display: 'grid', gap: '12px' }}>
              {archivedWorks.map(renderWorkRow)}
            </div>
          )}
        </section>
      </div>

      {showCreateForm && (
        <div style={modalBackdropStyle} onClick={cancelCreate}>
          <section style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>{form.id ? 'Editar obra' : 'Adicionar nova obra'}</h2>
                <p style={{ margin: '8px 0 0', color: '#4d5c55' }}>
                  Define os dados da obra, escolhe o cliente associado e o preco hora por defeito usado nos work assignments.
                </p>
              </div>
              <button type="button" onClick={cancelCreate} style={secondaryButtonStyle}>
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <label style={labelStyle}>
                  Numero
                  <input type="number" name="number" value={form.number} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Nome da obra
                  <input type="text" name="name" value={form.name} onChange={handleChange} style={inputStyle} />
                  {formErrors.name && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.name}</span>}
                </label>
                <label style={labelStyle}>
                  Cliente
                  <select name="clientId" value={form.clientId} onChange={handleChange} style={inputStyle}>
                    <option value="">Seleciona um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.clientId && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.clientId}</span>}
                </label>
                <label style={labelStyle}>
                  Localizacao
                  <input type="text" name="location" value={form.location} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Estado
                  <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                    <option value="planned">planned</option>
                    <option value="in_progress">in_progress</option>
                    <option value="paused">paused</option>
                    <option value="completed">completed</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  Orcamento
                  <input type="number" name="budget" min="0" step="0.01" value={form.budget} onChange={handleChange} style={inputStyle} />
                  {formErrors.budget && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.budget}</span>}
                </label>
                <label style={labelStyle}>
                  Preco hora por defeito
                  <input
                    type="number"
                    name="defaultHourlyCost"
                    min="0"
                    step="0.01"
                    value={form.defaultHourlyCost}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                  {formErrors.defaultHourlyCost && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.defaultHourlyCost}</span>}
                </label>
                <label style={labelStyle}>
                  Data de comeco
                  <input type="date" name="startDate" value={form.startDate} onChange={handleChange} style={inputStyle} />
                  {formErrors.startDate && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.startDate}</span>}
                </label>
                <label style={labelStyle}>
                  Data de finalizacao
                  <input type="date" name="endDate" value={form.endDate} onChange={handleChange} style={inputStyle} />
                  {formErrors.endDate && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.endDate}</span>}
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
                  {submitting ? 'A gravar...' : form.id ? 'Guardar alteracoes' : 'Criar obra'}
                </button>
                {form.id && (
                  <button type="button" onClick={() => handleDelete(form.id)} disabled={submitting} style={dangerButtonStyle}>
                    Eliminar obra
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
