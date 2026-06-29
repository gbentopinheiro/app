'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import EditPencilIcon, { editPencilButtonStyle } from '../components/EditPencilIcon'
import { ViewportPage, ViewportScrollArea, ViewportShell } from '../components/ViewportLayout.js'
import {
  deleteMaterial,
  listMaterials,
  saveMaterial,
} from '../../frontend/controllers/materials-controller.js'

const unitOptions = [
  { value: 'un', label: 'Unidade' },
  { value: 'cx', label: 'Caixa' },
  { value: 'kg', label: 'Kg' },
  { value: 'l', label: 'Litro' },
  { value: 'm', label: 'Metro' },
  { value: 'm2', label: 'Metro quadrado' },
  { value: 'm3', label: 'Metro cubico' },
]

const emptyMaterialForm = {
  id: null,
  name: '',
  reference: '',
  category: '',
  unit: 'un',
  quantity: '0',
  minimumQuantity: '0',
  location: '',
  supplier: '',
  notes: '',
}

const pageStyle = {
  minHeight: '100vh',
  padding: '40px 24px 60px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const shellStyle = {
  maxWidth: '1240px',
  margin: '0 auto',
  display: 'grid',
  gap: '24px',
}

const heroStyle = {
  position: 'relative',
  overflow: 'hidden',
  padding: '30px',
  borderRadius: '32px',
  background: 'linear-gradient(140deg, #0b1f33 0%, #114a5c 52%, #0f766e 100%)',
  border: '1px solid rgba(125, 211, 252, 0.18)',
  boxShadow: '0 32px 80px rgba(9, 35, 58, 0.26)',
  color: '#ffffff',
}

const heroGlowStyle = {
  position: 'absolute',
  right: '-80px',
  top: '-60px',
  width: '220px',
  height: '220px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(56, 189, 248, 0.32) 0%, rgba(56, 189, 248, 0.08) 48%, rgba(56, 189, 248, 0) 78%)',
  pointerEvents: 'none',
}

const heroContentStyle = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gap: '18px',
}

const heroTopBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
  flexWrap: 'wrap',
}

const backLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  color: 'rgba(224, 242, 254, 0.88)',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: 900,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const eyebrowStyle = {
  margin: 0,
  color: 'rgba(186, 230, 253, 0.82)',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
}

const titleStyle = {
  margin: 0,
  fontSize: 'clamp(34px, 5vw, 50px)',
  lineHeight: 1,
  letterSpacing: '-0.06em',
  fontWeight: 900,
}

const introStyle = {
  margin: 0,
  maxWidth: '640px',
  color: 'rgba(224, 242, 254, 0.88)',
  fontSize: '16px',
  lineHeight: 1.6,
  fontWeight: 700,
}

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '14px',
}

const heroStatCardStyle = {
  borderRadius: '22px',
  padding: '18px',
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  backdropFilter: 'blur(12px)',
}

const heroStatLabelStyle = {
  margin: 0,
  color: 'rgba(191, 219, 254, 0.82)',
  fontSize: '11px',
  fontWeight: 900,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const heroStatValueStyle = {
  margin: '8px 0 0',
  color: '#ffffff',
  fontSize: '30px',
  lineHeight: 1,
  letterSpacing: '-0.05em',
  fontWeight: 900,
}

const heroStatTextStyle = {
  margin: '8px 0 0',
  color: 'rgba(224, 242, 254, 0.86)',
  fontSize: '13px',
  lineHeight: 1.45,
  fontWeight: 700,
}

const panelStyle = {
  background: '#ffffff',
  border: '1px solid rgba(216, 225, 238, 0.94)',
  borderRadius: '26px',
  padding: '24px',
  boxShadow: '0 24px 54px rgba(24, 58, 110, 0.08)',
}

const toolbarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
}

const inputStyle = {
  width: '100%',
  marginTop: '8px',
  padding: '12px 14px',
  boxSizing: 'border-box',
  borderRadius: '12px',
  border: '1px solid rgba(207, 219, 237, 0.95)',
  background: 'rgba(248, 250, 252, 0.98)',
  fontSize: '14px',
  color: '#10233e',
}

const textAreaStyle = {
  ...inputStyle,
  minHeight: '100px',
  resize: 'vertical',
}

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 800,
  color: '#10233e',
}

const primaryButtonStyle = {
  border: 'none',
  borderRadius: '999px',
  padding: '13px 20px',
  background: '#0f766e',
  color: '#ffffff',
  fontWeight: 800,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  border: '1px solid #0f766e',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'transparent',
  color: '#0f766e',
  fontWeight: 800,
  cursor: 'pointer',
}

const dangerButtonStyle = {
  border: '1px solid #b42318',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'transparent',
  color: '#b42318',
  fontWeight: 800,
  cursor: 'pointer',
}

const iconButtonStyle = editPencilButtonStyle

const iconDangerButtonStyle = {
  ...dangerButtonStyle,
  width: '38px',
  height: '38px',
  padding: 0,
  fontSize: '14px',
}

const messageErrorStyle = {
  margin: 0,
  color: '#b42318',
  fontSize: '14px',
  fontWeight: 700,
}

const messageSuccessStyle = {
  margin: 0,
  color: '#1f7a45',
  fontSize: '14px',
  fontWeight: 700,
}

const layoutStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(340px, 0.95fr) minmax(0, 1.25fr)',
  gap: '24px',
}

const listHeaderStyle = {
  display: 'grid',
  gap: '14px',
}

const searchInputStyle = {
  ...inputStyle,
  marginTop: 0,
}

const materialListStyle = {
  display: 'grid',
  gap: '12px',
  marginTop: '18px',
}

const materialCardStyle = isSelected => ({
  textAlign: 'left',
  padding: '16px',
  borderRadius: '18px',
  border: isSelected ? '1px solid #0f766e' : '1px solid rgba(216, 225, 238, 0.94)',
  background: isSelected ? 'rgba(15, 118, 110, 0.08)' : 'rgba(248, 250, 252, 0.98)',
  cursor: 'pointer',
  display: 'grid',
  gap: '10px',
})

const materialCardTopStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '12px',
}

const materialCardNameStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '16px',
  lineHeight: 1.2,
  fontWeight: 900,
}

const materialCardRefStyle = {
  margin: '4px 0 0',
  color: '#64748b',
  fontSize: '12px',
  lineHeight: 1.4,
  fontWeight: 800,
}

const materialCardMetaStyle = {
  margin: 0,
  color: '#49627f',
  fontSize: '13px',
  lineHeight: 1.45,
  fontWeight: 700,
}

const statusBadgeStyle = tone => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '7px 10px',
  borderRadius: '999px',
  background:
    tone === 'danger'
      ? 'rgba(244, 63, 94, 0.12)'
      : tone === 'warning'
        ? 'rgba(255, 140, 0, 0.14)'
        : 'rgba(34, 197, 94, 0.12)',
  color:
    tone === 'danger'
      ? '#b42318'
      : tone === 'warning'
        ? '#9a4b00'
        : '#166534',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
})

const detailHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  flexWrap: 'wrap',
}

const detailGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '14px',
  marginTop: '18px',
}

const detailCardStyle = {
  padding: '16px',
  borderRadius: '18px',
  background: 'rgba(248, 250, 252, 0.98)',
  border: '1px solid rgba(216, 225, 238, 0.94)',
}

const detailLabelStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const detailValueStyle = {
  margin: '8px 0 0',
  color: '#10233e',
  fontSize: '16px',
  lineHeight: 1.35,
  fontWeight: 800,
}

function getStockStatus(material) {
  const quantity = Number(material?.quantity || 0)
  const minimumQuantity = Number(material?.minimumQuantity || 0)

  if (quantity <= 0) {
    return { label: 'Sem stock', tone: 'danger' }
  }

  if (minimumQuantity > 0 && quantity <= minimumQuantity) {
    return { label: 'Stock baixo', tone: 'warning' }
  }

  return { label: 'Disponivel', tone: 'success' }
}

function formatMaterialQuantity(material) {
  const quantity = Number(material?.quantity || 0)
  const unit = unitOptions.find(option => option.value === material?.unit)?.value || 'un'

  return `${new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2 }).format(quantity)} ${unit}`
}

function formatDateTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Sem registo'
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function MaterialsClient() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMaterialId, setSelectedMaterialId] = useState(null)
  const [form, setForm] = useState(emptyMaterialForm)
  const [formErrors, setFormErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadMaterials()
  }, [])

  async function loadMaterials() {
    setLoading(true)
    setError('')

    try {
      const data = await listMaterials('Erro ao carregar materiais.')

      setMaterials(data)
      setSelectedMaterialId(current => current ?? data[0]?.id ?? null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sortedMaterials = useMemo(
    () => [...materials].sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'pt-PT')),
    [materials],
  )

  const filteredMaterials = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return sortedMaterials
    }

    return sortedMaterials.filter(material =>
      [material.name, material.reference, material.category, material.location, material.supplier]
        .some(value => String(value || '').toLowerCase().includes(normalizedSearch)),
    )
  }, [searchTerm, sortedMaterials])

  useEffect(() => {
    if (filteredMaterials.length === 0) {
      setSelectedMaterialId(null)
      return
    }

    const currentSelectionExists = filteredMaterials.some(material => material.id === selectedMaterialId)

    if (!currentSelectionExists) {
      setSelectedMaterialId(filteredMaterials[0].id)
    }
  }, [filteredMaterials, selectedMaterialId])

  const selectedMaterial = filteredMaterials.find(material => material.id === selectedMaterialId) || null
  const lowStockCount = materials.filter(material => getStockStatus(material).tone === 'warning').length
  const noStockCount = materials.filter(material => getStockStatus(material).tone === 'danger').length

  function validateForm() {
    const nextErrors = {}
    const quantity = Number.parseFloat(String(form.quantity || '').replace(',', '.'))
    const minimumQuantity = Number.parseFloat(String(form.minimumQuantity || '').replace(',', '.'))

    if (!form.name.trim()) {
      nextErrors.name = 'O nome do material e obrigatorio.'
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
      nextErrors.quantity = 'A quantidade tem de ser igual ou superior a zero.'
    }

    if (!Number.isFinite(minimumQuantity) || minimumQuantity < 0) {
      nextErrors.minimumQuantity = 'O stock minimo tem de ser igual ou superior a zero.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setFormErrors(current => ({ ...current, [name]: '' }))
  }

  function startCreate() {
    setForm(emptyMaterialForm)
    setShowForm(true)
    setError('')
    setSuccess('')
    setFormErrors({})
  }

  function startEdit(material) {
    setForm({
      id: material.id,
      name: material.name ?? '',
      reference: material.reference ?? '',
      category: material.category ?? '',
      unit: material.unit ?? 'un',
      quantity: String(material.quantity ?? 0),
      minimumQuantity: String(material.minimumQuantity ?? 0),
      location: material.location ?? '',
      supplier: material.supplier ?? '',
      notes: material.notes ?? '',
    })
    setSelectedMaterialId(material.id)
    setShowForm(true)
    setError('')
    setSuccess('')
    setFormErrors({})
  }

  function cancelForm() {
    setShowForm(false)
    setForm(emptyMaterialForm)
    setFormErrors({})
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        name: form.name,
        reference: form.reference,
        category: form.category,
        unit: form.unit,
        quantity: Number.parseFloat(String(form.quantity || '0').replace(',', '.')),
        minimumQuantity: Number.parseFloat(String(form.minimumQuantity || '0').replace(',', '.')),
        location: form.location,
        supplier: form.supplier,
        notes: form.notes,
      }

      const data = await saveMaterial(form.id, payload, 'Erro ao gravar material.')

      await loadMaterials()
      setSelectedMaterialId(data.id)
      setShowForm(false)
      setForm(emptyMaterialForm)
      setSuccess(form.id ? 'Material atualizado com sucesso.' : 'Material criado com sucesso.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(materialId) {
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await deleteMaterial(materialId, 'Erro ao remover material.')

      await loadMaterials()
      setShowForm(false)
      setForm(emptyMaterialForm)
      setSuccess('Material removido com sucesso.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ViewportPage lockViewport style={pageStyle}>
      <ViewportShell fillHeight style={shellStyle}>
        <section style={heroStyle}>
          <div style={heroGlowStyle} />
          <div style={heroContentStyle}>
            <div style={heroTopBarStyle}>
              <Link href="/" style={backLinkStyle}>
                Voltar ao painel
              </Link>
              <button type="button" onClick={startCreate} style={primaryButtonStyle}>
                Adicionar material
              </button>
            </div>

            <div>
              <p style={eyebrowStyle}>Armazem e equipamentos</p>
              <h1 style={titleStyle}>Gestao de material</h1>
              <p style={introStyle}>
                Controla artigos, stock minimo, localizacao e fornecedor num so sitio, com uma consulta rapida do estado atual.
              </p>
            </div>

            <div className="vp-responsive-stat-grid" style={statsGridStyle}>
              <article style={heroStatCardStyle}>
                <p style={heroStatLabelStyle}>Materiais totais</p>
                <p style={heroStatValueStyle}>{materials.length}</p>
                <p style={heroStatTextStyle}>artigos registados no armazem</p>
              </article>
              <article style={heroStatCardStyle}>
                <p style={heroStatLabelStyle}>Stock baixo</p>
                <p style={heroStatValueStyle}>{lowStockCount}</p>
                <p style={heroStatTextStyle}>precisam de reposicao em breve</p>
              </article>
              <article style={heroStatCardStyle}>
                <p style={heroStatLabelStyle}>Sem stock</p>
                <p style={heroStatValueStyle}>{noStockCount}</p>
                <p style={heroStatTextStyle}>ja estao esgotados</p>
              </article>
            </div>
          </div>
        </section>

        <ViewportScrollArea style={{ '--vp-page-scroll-gap': '24px' }}>
        {showForm && (
          <section style={panelStyle}>
            <div style={toolbarStyle}>
              <div>
                <h2 style={{ margin: 0, color: '#10233e' }}>{form.id ? 'Editar material' : 'Adicionar material'}</h2>
                <p style={{ margin: '8px 0 0', color: '#49627f', fontWeight: 700 }}>
                  Mantem o stock, a referencia e a localizacao de cada artigo atualizados.
                </p>
              </div>
              <button type="button" onClick={cancelForm} style={secondaryButtonStyle}>
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <label style={labelStyle}>
                  Nome
                  <input type="text" name="name" value={form.name} onChange={handleChange} style={inputStyle} />
                  {formErrors.name ? <span style={messageErrorStyle}>{formErrors.name}</span> : null}
                </label>
                <label style={labelStyle}>
                  Referencia
                  <input type="text" name="reference" value={form.reference} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Categoria
                  <input type="text" name="category" value={form.category} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Unidade
                  <select name="unit" value={form.unit} onChange={handleChange} style={inputStyle}>
                    {unitOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle}>
                  Quantidade atual
                  <input type="number" min="0" step="0.01" name="quantity" value={form.quantity} onChange={handleChange} style={inputStyle} />
                  {formErrors.quantity ? <span style={messageErrorStyle}>{formErrors.quantity}</span> : null}
                </label>
                <label style={labelStyle}>
                  Stock minimo
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="minimumQuantity"
                    value={form.minimumQuantity}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                  {formErrors.minimumQuantity ? <span style={messageErrorStyle}>{formErrors.minimumQuantity}</span> : null}
                </label>
                <label style={labelStyle}>
                  Localizacao
                  <input type="text" name="location" value={form.location} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Fornecedor
                  <input type="text" name="supplier" value={form.supplier} onChange={handleChange} style={inputStyle} />
                </label>
              </div>

              <label style={labelStyle}>
                Notas
                <textarea name="notes" value={form.notes} onChange={handleChange} style={textAreaStyle} />
              </label>

              {error ? <p style={messageErrorStyle}>{error}</p> : null}
              {success ? <p style={messageSuccessStyle}>{success}</p> : null}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="submit" disabled={submitting} style={primaryButtonStyle}>
                  {submitting ? 'A gravar...' : form.id ? 'Guardar alteracoes' : 'Criar material'}
                </button>
                {form.id ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(form.id)}
                    disabled={submitting}
                    style={iconDangerButtonStyle}
                    title="Eliminar material"
                    aria-label="Eliminar material"
                  >
                    X
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        )}

        <section className="vp-responsive-split-grid" style={layoutStyle}>
          <section style={panelStyle}>
            <div style={listHeaderStyle}>
              <div style={toolbarStyle}>
                <h2 style={{ margin: 0, color: '#10233e' }}>Lista de materiais</h2>
                <button type="button" onClick={startCreate} style={secondaryButtonStyle}>
                  Novo
                </button>
              </div>
              <input
                type="search"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Pesquisar por nome, referencia, categoria ou localizacao"
                style={searchInputStyle}
              />
            </div>

            {loading ? <p style={{ marginTop: '18px' }}>A carregar materiais...</p> : null}
            {!loading && !error && materials.length === 0 ? <p style={{ marginTop: '18px' }}>Sem materiais registados.</p> : null}
            {!loading && !error && materials.length > 0 && filteredMaterials.length === 0 ? (
              <p style={{ marginTop: '18px' }}>Nenhum material corresponde a essa pesquisa.</p>
            ) : null}

            {!loading && filteredMaterials.length > 0 ? (
              <div style={materialListStyle}>
                {filteredMaterials.map(material => {
                  const status = getStockStatus(material)

                  return (
                    <button
                      key={material.id}
                      type="button"
                      onClick={() => setSelectedMaterialId(material.id)}
                      style={materialCardStyle(material.id === selectedMaterialId)}
                    >
                      <div style={materialCardTopStyle}>
                        <div>
                          <p style={materialCardNameStyle}>{material.name}</p>
                          <p style={materialCardRefStyle}>{material.reference || 'Sem referencia'}</p>
                        </div>
                        <span style={statusBadgeStyle(status.tone)}>{status.label}</span>
                      </div>
                      <p style={materialCardMetaStyle}>{formatMaterialQuantity(material)} em stock</p>
                      <p style={materialCardMetaStyle}>
                        {material.category || 'Sem categoria'} · {material.location || 'Sem localizacao'}
                      </p>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </section>

          <section style={panelStyle}>
            <div style={detailHeaderStyle}>
              <div>
                <h2 style={{ margin: 0, color: '#10233e' }}>Detalhe do material</h2>
                <p style={{ margin: '8px 0 0', color: '#49627f', fontWeight: 700 }}>
                  Consulta rapida do stock, reposicao minima e informacao operacional.
                </p>
              </div>
              {selectedMaterial ? (
                <button
                  type="button"
                  onClick={() => startEdit(selectedMaterial)}
                  style={iconButtonStyle}
                  title="Editar material"
                  aria-label="Editar material"
                >
                  <EditPencilIcon />
                </button>
              ) : null}
            </div>

            {!selectedMaterial ? <p style={{ marginTop: '18px' }}>Seleciona um material para ver os detalhes.</p> : null}

            {selectedMaterial ? (
              <>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, color: '#10233e', fontSize: '28px', lineHeight: 1.05 }}>{selectedMaterial.name}</h3>
                  <span style={statusBadgeStyle(getStockStatus(selectedMaterial).tone)}>{getStockStatus(selectedMaterial).label}</span>
                </div>

                <div style={detailGridStyle}>
                  <article style={detailCardStyle}>
                    <p style={detailLabelStyle}>Referencia</p>
                    <p style={detailValueStyle}>{selectedMaterial.reference || 'Sem referencia'}</p>
                  </article>
                  <article style={detailCardStyle}>
                    <p style={detailLabelStyle}>Categoria</p>
                    <p style={detailValueStyle}>{selectedMaterial.category || 'Sem categoria'}</p>
                  </article>
                  <article style={detailCardStyle}>
                    <p style={detailLabelStyle}>Quantidade atual</p>
                    <p style={detailValueStyle}>{formatMaterialQuantity(selectedMaterial)}</p>
                  </article>
                  <article style={detailCardStyle}>
                    <p style={detailLabelStyle}>Stock minimo</p>
                    <p style={detailValueStyle}>
                      {new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2 }).format(Number(selectedMaterial.minimumQuantity || 0))} {selectedMaterial.unit}
                    </p>
                  </article>
                  <article style={detailCardStyle}>
                    <p style={detailLabelStyle}>Localizacao</p>
                    <p style={detailValueStyle}>{selectedMaterial.location || 'Sem localizacao'}</p>
                  </article>
                  <article style={detailCardStyle}>
                    <p style={detailLabelStyle}>Fornecedor</p>
                    <p style={detailValueStyle}>{selectedMaterial.supplier || 'Sem fornecedor'}</p>
                  </article>
                  <article style={detailCardStyle}>
                    <p style={detailLabelStyle}>Atualizado</p>
                    <p style={detailValueStyle}>{formatDateTime(selectedMaterial.updatedAt)}</p>
                  </article>
                  <article style={detailCardStyle}>
                    <p style={detailLabelStyle}>Criado</p>
                    <p style={detailValueStyle}>{formatDateTime(selectedMaterial.createdAt)}</p>
                  </article>
                </div>

                <article style={{ ...detailCardStyle, marginTop: '16px' }}>
                  <p style={detailLabelStyle}>Notas</p>
                  <p style={{ ...detailValueStyle, whiteSpace: 'pre-wrap' }}>{selectedMaterial.notes || 'Sem notas'}</p>
                </article>
              </>
            ) : null}
          </section>
        </section>

        {!showForm && error ? <p style={messageErrorStyle}>{error}</p> : null}
        {!showForm && success ? <p style={messageSuccessStyle}>{success}</p> : null}
        </ViewportScrollArea>
      </ViewportShell>
    </ViewportPage>
  )
}
