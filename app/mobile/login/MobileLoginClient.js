'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { loginAndResolveRedirect } from '../../../frontend/controllers/auth-controller.js'
import { ViewportPage, ViewportScrollArea, ViewportShell } from '../../components/ViewportLayout.js'
import { BentixLogo } from '../../login/components/BentixLogo'

const mobileSafeTopInset = 'max(20px, env(safe-area-inset-top))'
const mobileSafeBottomInset = 'max(20px, env(safe-area-inset-bottom))'

const pageStyle = {
  minHeight: '100dvh',
  background: 'var(--vp-page-background)',
  padding: `${mobileSafeTopInset} 14px calc(24px + ${mobileSafeBottomInset})`,
  boxSizing: 'border-box',
  color: 'var(--vp-text)',
  fontFamily: 'var(--btx-font-family)',
}

const shellStyle = {
  width: '100%',
  maxWidth: '430px',
  margin: '0 auto',
  display: 'grid',
  gap: '14px',
}

const heroStyle = {
  padding: '22px 20px',
  borderRadius: '28px',
  background: 'var(--vp-module-hero)',
  border: '1px solid var(--vp-module-hero-border)',
  color: '#ffffff',
  boxShadow: 'var(--vp-hero-shadow-strong)',
  display: 'grid',
  gap: '16px',
}

const logoRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
}

const logoWrapStyle = {
  width: '72px',
  height: '72px',
  flexShrink: 0,
}

const heroTitleStyle = {
  margin: 0,
  fontSize: '30px',
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: '-0.04em',
}

const heroTextStyle = {
  margin: '8px 0 0',
  color: 'var(--vp-hero-text-muted)',
  fontSize: '14px',
  lineHeight: 1.5,
  fontWeight: 600,
}

const cardStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '26px',
  padding: '20px',
  boxShadow: 'var(--vp-shadow-panel)',
  display: 'grid',
  gap: '18px',
}

const sectionTitleStyle = {
  margin: 0,
  fontSize: '22px',
  lineHeight: 1.1,
  fontWeight: 900,
  letterSpacing: '-0.03em',
}

const formStyle = {
  display: 'grid',
  gap: '16px',
}

const inputBlockStyle = {
  display: 'grid',
  gap: '8px',
}

const labelStyle = {
  color: 'var(--vp-text)',
  fontSize: '14px',
  fontWeight: 800,
}

const inputStyle = {
  width: '100%',
  minHeight: '54px',
  borderRadius: '16px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface)',
  color: 'var(--vp-text)',
  padding: '0 16px',
  fontSize: '16px',
  boxSizing: 'border-box',
}

const passwordRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '10px',
  alignItems: 'center',
}

const toggleButtonStyle = {
  minHeight: '54px',
  padding: '0 16px',
  borderRadius: '16px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface)',
  color: 'var(--vp-text)',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer',
}

const submitButtonStyle = disabled => ({
  width: '100%',
  minHeight: '56px',
  border: 'none',
  borderRadius: '18px',
  background: disabled
    ? 'linear-gradient(90deg, #b9c9dd 0%, #b9c9dd 100%)'
    : 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 55%, #f97316 100%)',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 900,
  cursor: disabled ? 'not-allowed' : 'pointer',
  boxShadow: disabled ? 'none' : '0 18px 36px rgba(29, 78, 216, 0.24)',
})

const errorStyle = {
  margin: 0,
  borderRadius: '16px',
  padding: '14px 16px',
  fontSize: '14px',
  fontWeight: 700,
  lineHeight: 1.5,
  color: '#b42318',
  background: 'rgba(244, 63, 94, 0.12)',
  border: '1px solid rgba(244, 63, 94, 0.16)',
}

const hintStyle = {
  margin: 0,
  color: 'var(--vp-text-muted)',
  fontSize: '13px',
  lineHeight: 1.6,
  fontWeight: 600,
}

export default function MobileLoginClient({ initialRedirectTo = null }) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const data = await loginAndResolveRedirect({
        username,
        password,
        redirectTo: initialRedirectTo,
        fallbackRedirect: '/mobile/chef',
        fallbackMessage: 'Nao foi possivel iniciar sessao.',
      })

      router.push(data.redirectTo || '/mobile/chef')
      router.refresh()
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ViewportPage lockViewport style={pageStyle}>
      <ViewportShell fillHeight style={shellStyle}>
        <section style={heroStyle}>
          <div style={logoRowStyle}>
            <div style={logoWrapStyle}>
              <BentixLogo />
            </div>
            <div>
              <h1 style={heroTitleStyle}>Bentix Mobile</h1>
              <p style={heroTextStyle}>Entrar no registo diario mobile dos chefes.</p>
            </div>
          </div>
        </section>

        <ViewportScrollArea style={{ '--vp-page-scroll-gap': '14px' }}>
          <section style={cardStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Iniciar sessao</h2>
            </div>

            <form onSubmit={handleSubmit} style={formStyle}>
              <label style={inputBlockStyle}>
                <span style={labelStyle}>Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={event => setUsername(event.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Introduza o seu username"
                  style={inputStyle}
                  required
                />
              </label>

              <label style={inputBlockStyle}>
                <span style={labelStyle}>Palavra-passe</span>
                <div style={passwordRowStyle}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Introduza a sua palavra-passe"
                    style={inputStyle}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(current => !current)}
                    style={toggleButtonStyle}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </label>

              {error ? <p style={errorStyle}>{error}</p> : null}

              <button type="submit" disabled={submitting} style={submitButtonStyle(submitting)}>
                {submitting ? 'A iniciar sessao...' : 'Entrar'}
              </button>
            </form>

            <p style={hintStyle}>
              Depois do login vais entrar diretamente na area mobile quando o perfil tiver acesso.
            </p>
          </section>
        </ViewportScrollArea>
      </ViewportShell>
    </ViewportPage>
  )
}

