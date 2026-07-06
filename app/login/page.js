'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { loginWithProtectedPayload } from '../../frontend/controllers/auth-controller.js'
import { createProtectedPayload } from '../../lib/browser-protected-payload.js'
import { getSafeRedirectPath } from '../../lib/safe-redirect.js'
import { BentixLogo } from './components/BentixLogo'
import { BentixPage, ViewportShell } from '../components/ViewportLayout.js'

const pageStyle = {
  background: '#071226',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const shellStyle = {
  position: 'relative',
  isolation: 'isolate',
  width: '100%',
  minHeight: '100dvh',
  display: 'grid',
  gridTemplateColumns: '65fr 35fr',
}

const shellBackdropStyle = {
  position: 'absolute',
  inset: 0,
  zIndex: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
}

const heroStyle = {
  position: 'relative',
  zIndex: 1,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
}

const shellBackdropImageStyle = {
  position: 'absolute',
  inset: 0,
  backgroundImage: "url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: 0.36,
  transform: 'scale(1.02)',
}

const shellBackdropOverlayStyle = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(104deg, rgba(7, 18, 38, 0.97) 0%, rgba(11, 31, 70, 0.91) 52%, rgba(9, 24, 53, 0.88) 74%, rgba(2, 8, 23, 0.96) 100%)',
}

const heroGlowStyle = {
  position: 'absolute',
  left: '-120px',
  bottom: '-120px',
  width: '420px',
  height: '420px',
  borderRadius: '50%',
  background: 'rgba(37, 99, 235, 0.52)',
  filter: 'blur(120px)',
}

const heroAccentGlowStyle = {
  position: 'absolute',
  top: '-110px',
  right: '-120px',
  width: '340px',
  height: '340px',
  borderRadius: '50%',
  background: 'rgba(249, 115, 22, 0.22)',
  filter: 'blur(120px)',
}

const heroContentStyle = {
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: '860px',
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: 'clamp(28px, 4vw, 56px)',
  boxSizing: 'border-box',
}

const heroTopStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  paddingLeft: 'clamp(56px, 8vw, 112px)',
}

const brandRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  width: 'auto',
  gap: 'clamp(22px, 3vw, 32px)',
  marginBottom: 0,
}

const logoWrapStyle = {
  width: 'clamp(112px, 10vw, 144px)',
  height: 'clamp(112px, 10vw, 144px)',
  flexShrink: 0,
}

const heroTitleStyle = {
  margin: 0,
  color: '#ffffff',
  fontSize: 'clamp(56px, 6vw, 76px)',
  lineHeight: 0.95,
  letterSpacing: '-0.05em',
  fontWeight: 900,
  textShadow: '0 18px 40px rgba(0, 0, 0, 0.28)',
}

const heroSubtitleStyle = {
  margin: '14px 0 0',
  color: '#ffffff',
  fontSize: 'clamp(14px, 1.3vw, 18px)',
  fontWeight: 700,
  letterSpacing: '0.18em',
}

const heroSubtitleAccentStyle = {
  color: '#FB923C',
}

const featureGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 0,
  marginTop: 'auto',
}

const featureStyle = {
  padding: '0 24px',
  textAlign: 'center',
  color: '#ffffff',
}

const featureDividerStyle = {
  borderLeft: '1px solid rgba(59, 130, 246, 0.5)',
}

const featureIconWrapStyle = {
  display: 'flex',
  justifyContent: 'center',
  color: '#006DFF',
  marginBottom: '16px',
}

const featureTitleStyle = {
  margin: 0,
  fontSize: 'clamp(17px, 1.4vw, 20px)',
  lineHeight: 1.35,
  fontWeight: 700,
}

const featureTextStyle = {
  margin: '4px 0 0',
  fontSize: 'clamp(17px, 1.4vw, 20px)',
  lineHeight: 1.35,
  fontWeight: 500,
}

const panelWrapStyle = {
  position: 'relative',
  zIndex: 2,
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: 'clamp(18px, 3vw, 40px)',
  paddingRight: 'clamp(42px, 6vw, 84px)',
  paddingBottom: 'clamp(18px, 3vw, 40px)',
  paddingLeft: 'clamp(0px, 0.2vw, 4px)',
  boxSizing: 'border-box',
  overflow: 'visible',
}

const panelStyle = {
  width: '100%',
  maxWidth: '540px',
  padding: 'clamp(28px, 4vw, 56px) clamp(24px, 4vw, 56px)',
  borderRadius: '28px',
  background: 'rgba(255, 255, 255, 0.93)',
  border: '1px solid rgba(255, 255, 255, 0.38)',
  color: '#111827',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 30px 80px rgba(3, 8, 20, 0.42)',
  boxSizing: 'border-box',
  transform: 'translateX(-72px)',
}

const panelHeaderStyle = {
  textAlign: 'center',
  marginBottom: 'clamp(28px, 4vh, 48px)',
}

const panelTitleStyle = {
  margin: 0,
  fontSize: 'clamp(32px, 3vw, 42px)',
  lineHeight: 1.12,
  fontWeight: 900,
  letterSpacing: '-0.04em',
}

const panelTitleAccentStyle = {
  color: '#006DFF',
}

const formStyle = {
  display: 'grid',
  gap: '28px',
}

const inputBlockStyle = {
  display: 'grid',
  gap: '12px',
}

const labelStyle = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: 700,
}

const inputShellStyle = {
  height: '58px',
  border: '1px solid #D8E1EE',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 18px',
  gap: '14px',
  color: '#64748B',
  background: '#ffffff',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
}

const inputStyle = {
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: '#111827',
  fontSize: '15px',
}

const iconButtonStyle = {
  border: 'none',
  background: 'transparent',
  padding: 0,
  margin: 0,
  color: '#64748B',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const errorStyle = {
  margin: 0,
  padding: '14px 16px',
  borderRadius: '12px',
  border: '1px solid rgba(220, 38, 38, 0.18)',
  background: '#FEF2F2',
  color: '#B91C1C',
  fontSize: '14px',
  lineHeight: 1.5,
}

const submitButtonStyle = {
  width: '100%',
  height: '60px',
  border: 'none',
  borderRadius: '12px',
  background: 'linear-gradient(90deg, #003CFF 0%, #006DFF 64%, #F97316 100%)',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 800,
  boxShadow: '0 18px 36px rgba(249, 115, 22, 0.22)',
  cursor: 'pointer',
}

const footerStyle = {
  margin: '32px 0 0',
  textAlign: 'center',
  color: '#64748B',
  fontSize: '15px',
}

const footerLinkStyle = {
  color: '#006DFF',
  textDecoration: 'none',
  fontWeight: 600,
}

export default function LoginPage() {
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

    const redirectTo =
      typeof window === 'undefined'
        ? null
        : getSafeRedirectPath(new URLSearchParams(window.location.search).get('redirectTo'))

    try {
      const protectedPayload = await createProtectedPayload({
        username,
        password,
      })

      const data = await loginWithProtectedPayload(
        protectedPayload,
        'Não foi possível iniciar sessão.',
      )

      router.push(redirectTo || data.redirectTo || '/')
      router.refresh()
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BentixPage padding="none" style={pageStyle}>
      <ViewportShell className="login-shell" style={shellStyle}>
        <div style={shellBackdropStyle} aria-hidden="true">
          <div style={shellBackdropImageStyle} />
          <div style={shellBackdropOverlayStyle} />
          <div style={heroGlowStyle} />
          <div style={heroAccentGlowStyle} />
        </div>

        <section className="login-hero" style={heroStyle}>
          <div style={heroContentStyle}>
            <div style={heroTopStyle}>
              <div style={brandRowStyle}>
                <div style={logoWrapStyle}>
                  <BentixLogo />
                </div>

                <div>
                  <h1 style={heroTitleStyle}>Bentix</h1>
                  <p style={heroSubtitleStyle}>
                    GESTÃO <span style={heroSubtitleAccentStyle}>INTELIGENTE</span> DE OBRAS
                  </p>
                </div>
              </div>
            </div>

            <div className="feature-grid" style={featureGridStyle}>
              <Feature icon={<Building2Icon />} title="Planeamento" text="e controlo" />
              <Feature icon={<BarChart3Icon />} title="Gestão financeira" text="em tempo real" bordered />
              <Feature icon={<UsersRoundIcon />} title="Equipas" text="conectadas" bordered />
            </div>
          </div>
        </section>

        <section className="login-panel-wrap" style={panelWrapStyle}>
          <div className="login-panel" style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>
                Bem vindo a <span style={panelTitleAccentStyle}>Bentix</span>
              </h2>
            </div>

            <form onSubmit={handleSubmit} style={formStyle}>
              <Input
                label="Username"
                placeholder="Introduza o seu username"
                type="text"
                value={username}
                onChange={event => setUsername(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                icon={<UserIcon />}
                required
              />

              <Input
                label="Palavra-passe"
                placeholder="Introduza a sua palavra-passe"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                autoComplete="current-password"
                icon={<LockIcon />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(current => !current)}
                    style={iconButtonStyle}
                    aria-label={showPassword ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
                    title={showPassword ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
                  >
                    <EyeIcon crossed={showPassword} />
                  </button>
                }
                required
              />

              {error ? (
                <p style={errorStyle} aria-live="polite">
                  {error}
                </p>
              ) : null}

              <button type="submit" disabled={submitting} className="submit-button" style={{ ...submitButtonStyle, opacity: submitting ? 0.82 : 1 }}>
                {submitting ? 'A iniciar sessão...' : 'Iniciar sessão'}
              </button>

            </form>

            <p style={footerStyle}>
              Não tem conta?{' '}
              <a href="#" style={footerLinkStyle} onClick={event => event.preventDefault()}>
                Fale connosco
              </a>
            </p>
          </div>
        </section>
      </ViewportShell>

      <style jsx>{`
        .submit-button,
        .login-panel button,
        .login-panel a {
          transition: all 0.2s ease;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 22px 44px rgba(249, 115, 22, 0.3);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-shell :global(input)::placeholder {
          color: #94a3b8;
        }

        .login-panel :global(input:focus),
        .login-panel :global(button:focus),
        .login-panel :global(a:focus) {
          outline: none;
        }

        .login-panel :global(input:focus-visible),
        .login-panel :global(button:focus-visible),
        .login-panel :global(a:focus-visible) {
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
          border-radius: 10px;
        }

        @media (max-width: 1200px) {
          .login-panel {
            transform: none;
          }
        }

        @media (max-width: 980px) {
          .login-shell {
            grid-template-columns: 1fr;
            min-height: 100dvh;
          }

          .login-hero {
            display: none;
          }

          .login-panel-wrap {
            min-height: 100dvh;
            padding-left: clamp(18px, 4vw, 32px);
          }

          .login-panel {
            max-width: 640px;
            transform: none;
          }
        }

        @media (max-width: 640px) {
          .login-panel-wrap {
            padding: 14px;
          }

          .login-panel {
            padding: 26px 20px;
            border-radius: 24px;
          }

          .feature-grid {
            gap: 12px;
          }
        }
      `}</style>
    </BentixPage>
  )
}

function Input({ label, icon, rightIcon = null, ...props }) {
  return (
    <label style={inputBlockStyle}>
      <span style={labelStyle}>{label}</span>
      <div className="input-shell" style={inputShellStyle}>
        {icon}
        <input {...props} style={inputStyle} />
        {rightIcon}
      </div>
    </label>
  )
}

function Feature({ icon, title, text, bordered = false }) {
  return (
    <div style={{ ...featureStyle, ...(bordered ? featureDividerStyle : {}) }}>
      <div style={featureIconWrapStyle}>{icon}</div>
      <p style={featureTitleStyle}>{title}</p>
      <p style={featureTextStyle}>{text}</p>
    </div>
  )
}

function UserIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 18c0-3.04 2.46-5.5 5.5-5.5h2c3.04 0 5.5 2.46 5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function LockIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="5" y="11" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function EyeIcon({ size = 22, crossed = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      {crossed ? <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /> : null}
    </svg>
  )
}

function Building2Icon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 21h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 21V7.8L12 5v16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 21V9.8L18 7v14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 10.8h.01M8.5 13.8h.01M15.5 11.8h.01M15.5 14.8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function BarChart3Icon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7 16v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 16V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M17 16V5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m5 13 4-4 4 3 6-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UsersRoundIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16.2 8.8a3.2 3.2 0 1 1-6.4 0 3.2 3.2 0 0 1 6.4 0Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.2 9.8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 18.2c0-2.33 1.89-4.2 4.2-4.2h1.1c2.31 0 4.2 1.87 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M2.8 18.2c0-2 1.62-3.6 3.6-3.6h.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

