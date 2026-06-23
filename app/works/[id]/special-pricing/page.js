'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { listPeople } from '../../../../frontend/controllers/people-controller.js'
import {
  getWork,
  saveWork as saveWorkRequest,
} from '../../../../frontend/controllers/works-controller.js'
import { buildWorkPricingSnapshot, hasWorkPricingChanges } from '../../../../lib/work-pricing.js'

const pageStyle = {
  minHeight: '100vh',
  padding: '40px 24px 60px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const shellStyle = {
  maxWidth: '980px',
  margin: '0 auto',
  display: 'grid',
  gap: '24px',
}

const heroPanelStyle = {
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--vp-module-hero)',
  border: '1px solid var(--vp-module-hero-border)',
  borderRadius: '32px',
  padding: '24px',
  boxShadow: 'var(--vp-hero-shadow-strong)',
  color: '#ffffff',
  '--vp-text-muted': 'var(--vp-hero-text-muted)',
  '--vp-text-soft': 'var(--vp-hero-text-soft)',
}

const panelStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-panel)',
}

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'var(--vp-overlay)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  zIndex: 50,
}

const modalCardStyle = {
  width: 'min(720px, 100%)',
  background: 'var(--vp-surface-soft-strong)',
  border: '1px solid var(--vp-border)',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-modal)',
}

const inputStyle = {
  width: '100%',
  marginTop: '8px',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface-muted)',
  color: 'var(--vp-text)',
  fontSize: '14px',
  boxSizing: 'border-box',
}

const primaryButtonStyle = {
  border: 'none',
  borderRadius: '999px',
  padding: '12px 18px',
  background: 'var(--vp-accent)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  border: '1px solid var(--vp-accent)',
  borderRadius: '999px',
  padding: '12px 18px',
  background: 'transparent',
  color: 'var(--vp-accent)',
  fontWeight: 700,
  cursor: 'pointer',
}

const dangerButtonStyle = {
  border: '1px solid #b42318',
  borderRadius: '999px',
  padding: '12px 18px',
  background: 'transparent',
  color: '#b42318',
  fontWeight: 700,
  cursor: 'pointer',
}

function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPricingApplicationStartDate(mode) {
  const today = new Date()

  if (mode === 'month_start') {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  }

  if (mode === 'next_month') {
    return toDateInputValue(new Date(today.getFullYear(), today.getMonth() + 1, 1))
  }

  return toDateInputValue(today)
}

export default function WorkSpecialPricingPage() {
  const params = useParams()
  const workId = Array.isArray(params.id) ? params.id[0] : params.id
  const [work, setWork] = useState(null)
  const [people, setPeople] = useState([])
  const [specialPricingForm, setSpecialPricingForm] = useState({})
  const [originalPricingSnapshot, setOriginalPricingSnapshot] = useState(buildWorkPricingSnapshot({}))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPricingChangeModal, setShowPricingChangeModal] = useState(false)
  const [pendingSpecialPricingPayload, setPendingSpecialPricingPayload] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!workId) {
      return
    }

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const [workData, peopleData] = await Promise.all([
          getWork(workId, 'Erro ao carregar obra'),
          listPeople('Erro ao carregar pessoas'),
        ])

        setWork(workData)
        setPeople(peopleData)
        setSpecialPricingForm(workData.specialPersonHourlyCosts || {})
        setOriginalPricingSnapshot(buildWorkPricingSnapshot(workData))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [workId])

  const sortedPeople = useMemo(
    () => [...people].sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'pt-PT')),
    [people],
  )

  function handleSpecialPersonHourlyCostChange(personId, value) {
    setSpecialPricingForm(current => ({
      ...current,
      [String(personId)]: value,
    }))
  }

  function handleSpecialPersonSelectionChange(currentPersonId, nextPersonId) {
    if (!nextPersonId || String(currentPersonId) === String(nextPersonId)) {
      return
    }

    setSpecialPricingForm(current => {
      const nextSpecialPrices = { ...current }
      const currentValue = nextSpecialPrices[String(currentPersonId)] ?? ''
      delete nextSpecialPrices[String(currentPersonId)]
      nextSpecialPrices[String(nextPersonId)] = currentValue
      return nextSpecialPrices
    })
  }

  function handleAddSpecialPersonHourlyCost() {
    setSpecialPricingForm(current => {
      const usedPersonIds = new Set(Object.keys(current))
      const nextPerson = sortedPeople.find(person => !usedPersonIds.has(String(person.id)))

      if (!nextPerson) {
        return current
      }

      return {
        ...current,
        [String(nextPerson.id)]: '',
      }
    })
  }

  function handleRemoveSpecialPersonHourlyCost(personId) {
    setSpecialPricingForm(current => {
      const nextSpecialPrices = { ...current }
      delete nextSpecialPrices[String(personId)]
      return nextSpecialPrices
    })
  }

  function buildSpecialPricingPayload() {
    return Object.fromEntries(
      Object.entries(specialPricingForm || {})
        .filter(([, value]) => value !== '' && value !== null && value !== undefined)
        .map(([personId, value]) => [personId, Number(value)])
        .filter(([, value]) => !Number.isNaN(value) && value >= 0),
    )
  }

  async function persistSpecialPricing(sanitizedSpecialPricing, pricingChangeApplication = null) {
    const data = await saveWorkRequest(
      work.id,
      {
        number: work.number,
        name: work.name,
        clientId: work.clientId,
        location: work.location,
        status: work.status,
        budget: work.budget,
        defaultHourlyCost: work.defaultHourlyCost,
        roleHourlyCosts: work.roleHourlyCosts || {},
        specialPersonHourlyCosts: sanitizedSpecialPricing,
        startDate: work.startDate,
        endDate: work.endDate,
        workingDays: work.workingDays,
        notes: work.notes,
        pricingChangeApplication,
      },
      'Erro ao guardar preços especiais',
    )

    setWork(data)
    setSpecialPricingForm(data.specialPersonHourlyCosts || {})
    setOriginalPricingSnapshot(buildWorkPricingSnapshot(data))

    if (pricingChangeApplication?.startDate) {
      const updatedCount = Number(data.repricedAssignmentsCount) || 0
      setSuccess(
        updatedCount > 0
          ? `Precos especiais guardados e ${updatedCount} afetacoes ficaram com a nova tarifa.`
          : 'Precos especiais guardados. Nao houve afetacoes elegiveis para atualizar.',
      )
      return
    }

    setSuccess('Preços especiais guardados com sucesso.')
  }

  async function confirmPricingChangeApplication(mode = 'none') {
    if (!pendingSpecialPricingPayload) {
      return
    }

    setShowPricingChangeModal(false)
    setSaving(true)
    setError('')

    try {
      const pricingChangeApplication = mode === 'none'
        ? null
        : {
            mode,
            startDate: getPricingApplicationStartDate(mode),
          }

      await persistSpecialPricing(pendingSpecialPricingPayload, pricingChangeApplication)
      setPendingSpecialPricingPayload(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveSpecialPricing() {
    if (!work) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const sanitizedSpecialPricing = buildSpecialPricingPayload()
      const nextPricingSnapshot = buildWorkPricingSnapshot({
        ...work,
        specialPersonHourlyCosts: sanitizedSpecialPricing,
      })

      if (hasWorkPricingChanges(nextPricingSnapshot, originalPricingSnapshot)) {
        setPendingSpecialPricingPayload(sanitizedSpecialPricing)
        setShowPricingChangeModal(true)
        return
      }

      await persistSpecialPricing(sanitizedSpecialPricing)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroPanelStyle}>
          <Link href={`/works/${workId}`} style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}>
            Voltar à obra
          </Link>

          {loading && <p style={{ marginTop: '18px' }}>A carregar preços especiais...</p>}
          {error && <p style={{ marginTop: '18px', color: '#b42318' }}>{error}</p>}

          {!loading && !error && work && (
            <>
              <p style={{ margin: '18px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: 'var(--vp-text-soft)' }}>
                Obra #{work.number}
              </p>
              <h1 style={{ margin: '10px 0 0', fontSize: '42px', lineHeight: 1.05 }}>
                Preços especiais por pessoa
              </h1>
              <p style={{ margin: '12px 0 0', color: 'var(--vp-text-soft)' }}>
                {work.name}
              </p>
            </>
          )}
        </section>

        {!loading && !error && work && (
          <section style={panelStyle}>
            <p style={{ marginTop: 0, color: 'var(--vp-text-muted)' }}>
              Hierarquia usada no plano diário: preço manual da afetação, depois preço especial desta obra, depois preço por role e por fim preço por defeito.
            </p>

            <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
              {Object.entries(specialPricingForm || {}).length === 0 && (
                <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>
                  Ainda não tens exceções definidas para esta obra.
                </p>
              )}

              {Object.entries(specialPricingForm || {}).map(([personId, value]) => (
                <div
                  key={personId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.6fr) minmax(160px, 220px) auto',
                    gap: '12px',
                    alignItems: 'end',
                  }}
                >
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>
                    Pessoa
                    <select
                      value={personId}
                      onChange={(event) => handleSpecialPersonSelectionChange(personId, event.target.value)}
                      style={inputStyle}
                      disabled={saving}
                    >
                      {sortedPeople
                        .filter(person =>
                          String(person.id) === String(personId) ||
                          specialPricingForm[String(person.id)] === undefined,
                        )
                        .map(person => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>
                    Preço hora
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={value}
                      onChange={(event) => handleSpecialPersonHourlyCostChange(personId, event.target.value)}
                      placeholder="Usar preço automático"
                      style={inputStyle}
                      disabled={saving}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRemoveSpecialPersonHourlyCost(personId)}
                    style={dangerButtonStyle}
                    disabled={saving}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>

            {success && <p style={{ margin: '18px 0 0', color: '#1f7a45' }}>{success}</p>}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '22px' }}>
              <button
                type="button"
                onClick={handleAddSpecialPersonHourlyCost}
                disabled={saving || sortedPeople.length === 0 || Object.keys(specialPricingForm || {}).length >= sortedPeople.length}
                style={
                  saving || sortedPeople.length === 0 || Object.keys(specialPricingForm || {}).length >= sortedPeople.length
                    ? { ...secondaryButtonStyle, opacity: 0.5, cursor: 'not-allowed' }
                    : secondaryButtonStyle
                }
              >
                Adicionar preço especial
              </button>

              <button type="button" onClick={saveSpecialPricing} style={primaryButtonStyle} disabled={saving}>
                {saving ? 'A guardar...' : 'Guardar preços especiais'}
              </button>
            </div>
          </section>
        )}

        {showPricingChangeModal && (
          <div style={modalBackdropStyle} onClick={() => !saving && setShowPricingChangeModal(false)}>
            <section style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <h2 style={{ margin: 0 }}>Alteracao de precos da obra</h2>
                <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>
                  Mudaste os precos desta obra. Queres so guardar os novos valores para o futuro ou reaplicar a nova tarifa nas afetacoes ainda nao aprovadas?
                </p>
                <p style={{ margin: 0, color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                  Horas ja aprovadas mantem o preco antigo. Afetacoes com preco manual tambem nao sao alteradas.
                </p>
              </div>

              <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => confirmPricingChangeApplication('none')} style={primaryButtonStyle} disabled={saving}>
                  So guardar os novos precos
                </button>
                <button type="button" onClick={() => confirmPricingChangeApplication('today')} style={secondaryButtonStyle} disabled={saving}>
                  Aplicar a partir de hoje
                </button>
                <button type="button" onClick={() => confirmPricingChangeApplication('month_start')} style={secondaryButtonStyle} disabled={saving}>
                  Aplicar desde o inicio do mes
                </button>
                <button type="button" onClick={() => confirmPricingChangeApplication('next_month')} style={secondaryButtonStyle} disabled={saving}>
                  Aplicar a partir do proximo mes
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
