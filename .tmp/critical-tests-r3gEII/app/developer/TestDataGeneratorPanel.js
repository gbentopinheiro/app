'use client'

import { useState } from 'react'
import { fetchDeveloperTestData } from '../../frontend/controllers/developer-controller.js'

export default function TestDataGeneratorPanel() {
  const [scenario, setScenario] = useState('small')
  const [customCount, setCustomCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [generatedData, setGeneratedData] = useState(null)
  const [error, setError] = useState(null)

  const generateTestData = async (generationScenario = scenario) => {
    try {
      setLoading(true)
      setError(null)

      const { response, data } = await fetchDeveloperTestData(
        generationScenario === 'custom'
          ? { scenario: 'custom', count: customCount }
          : { scenario: generationScenario },
      )
      if (!response.ok) throw new Error('Failed to generate test data')

      setGeneratedData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const panelStyle = {
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
  }

  const sectionStyle = {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
  }

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
  }

  const scenarioButtonStyle = (isActive) => ({
    ...buttonStyle,
    backgroundColor: isActive ? '#3b82f6' : '#e5e7eb',
    color: isActive ? 'white' : '#6b7280',
    marginRight: '0.5rem',
    marginBottom: '0.5rem',
  })

  const cardStyle = {
    padding: '1rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
  }

  const labelStyle = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.5rem',
    fontWeight: 500,
  }

  const valueStyle = {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1f2937',
  }

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
          🧪 Gerador de Dados de Teste
        </h2>
      </div>

      {/* Scenario Selection */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: '0 0 1rem 0' }}>
          Selecionar Cenário
        </h3>
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={() => setScenario('small')}
            style={scenarioButtonStyle(scenario === 'small')}
          >
            📦 Pequeno (5 pessoas)
          </button>
          <button
            onClick={() => setScenario('medium')}
            style={scenarioButtonStyle(scenario === 'medium')}
          >
            📦 Médio (20 pessoas)
          </button>
          <button
            onClick={() => setScenario('large')}
            style={scenarioButtonStyle(scenario === 'large')}
          >
            📦 Grande (50 pessoas)
          </button>
          <button
            onClick={() => setScenario('custom')}
            style={scenarioButtonStyle(scenario === 'custom')}
          >
            ⚙️ Personalizado
          </button>
        </div>

        {scenario === 'custom' && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Número de Pessoas:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={customCount}
                onChange={(e) => setCustomCount(parseInt(e.target.value) || 10)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </div>
        )}

        <button
          onClick={() => generateTestData()}
          disabled={loading}
          style={{
            ...buttonStyle,
            backgroundColor: loading ? '#9ca3af' : '#10b981',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '⏳ A gerar...' : '✨ Gerar Dados'}
        </button>
      </div>

      {error && (
        <div style={{ ...sectionStyle, backgroundColor: '#fef2f2', borderColor: '#fee2e2' }}>
          <p style={{ color: '#ef4444', margin: 0 }}>❌ {error}</p>
        </div>
      )}

      {generatedData && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: '0 0 1rem 0' }}>
            📊 Dados Gerados
          </h3>

          <div style={gridStyle}>
            <div style={cardStyle}>
              <div style={labelStyle}>Pessoas</div>
              <div style={valueStyle}>{generatedData.data.people?.length || 0}</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Obras</div>
              <div style={valueStyle}>{generatedData.data.works?.length || 0}</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Clientes</div>
              <div style={valueStyle}>{generatedData.data.clients?.length || 0}</div>
            </div>
            <div style={cardStyle}>
              <div style={labelStyle}>Atribuições</div>
              <div style={valueStyle}>{generatedData.data.workAssignments?.length || 0}</div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.375rem', border: '1px solid #bbf7d0' }}>
            <p style={{ margin: 0, color: '#166534', fontSize: '0.875rem' }}>
              ✅ Dados gerados com sucesso! Pronto para usar nos testes.
            </p>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Amostra de Dados:
            </h4>
            <pre style={{
              backgroundColor: '#1f2937',
              color: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.375rem',
              overflowX: 'auto',
              fontSize: '0.75rem',
              margin: 0,
            }}>
              {JSON.stringify(generatedData.data, null, 2).slice(0, 500)}...
            </pre>
          </div>
        </div>
      )}

      {!generatedData && !loading && (
        <div style={{ ...sectionStyle, backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
          <p style={{ color: '#1e40af', margin: 0, fontSize: '0.875rem' }}>
            💡 Selecione um cenário e clique em "Gerar Dados" para criar dados de teste.
          </p>
        </div>
      )}
    </div>
  )
}
