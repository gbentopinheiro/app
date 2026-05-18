'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const pageStyle = {
  minHeight: '100vh',
  padding: 'clamp(20px, 3vw, 30px)',
  background: [
    'radial-gradient(circle at 10% 85%, rgba(255, 140, 0, 0.2), transparent 25%)',
    'radial-gradient(circle at 90% 92%, rgba(251, 146, 60, 0.15), transparent 30%)',
    'linear-gradient(135deg, #1a1410 0%, #2a1f15 50%, #151008 100%)',
  ].join(', '),
  color: '#ffffff',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
  overflow: 'hidden',
}

const shellStyle = {
  maxWidth: '1440px',
  margin: '0 auto',
  minHeight: 'calc(100vh - 40px)',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.3fr) minmax(420px, 580px)',
  gap: '32px',
  alignItems: 'center',
}

const heroStyle = {
  position: 'relative',
  minHeight: '780px',
  overflow: 'hidden',
  display: 'grid',
  alignItems: 'center',
  borderRadius: '36px',
  border: '1px solid rgba(255, 140, 0, 0.2)',
  background: [
    'radial-gradient(circle at 20% 20%, rgba(255, 140, 0, 0.06), transparent 30%)',
    'linear-gradient(180deg, rgba(26, 20, 16, 0.88) 0%, rgba(21, 16, 8, 0.9) 100%)',
  ].join(', '),
  boxShadow: '0 35px 85px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
}

const heroOverlayStyle = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(90deg, rgba(10, 18, 42, 0.05) 0%, rgba(10, 18, 42, 0.25) 48%, rgba(10, 18, 42, 0.68) 100%)',
  pointerEvents: 'none',
}

const heroGlowStyle = {
  position: 'absolute',
  left: '-100px',
  bottom: '-130px',
  width: '400px',
  height: '400px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255, 140, 0, 0.85) 0%, rgba(255, 140, 0, 0.35) 35%, rgba(255, 140, 0, 0) 75%)',
  filter: 'blur(28px)',
  pointerEvents: 'none',
}

const heroTopGlowStyle = {
  position: 'absolute',
  right: '-120px',
  top: '-120px',
  width: '320px',
  height: '320px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, rgba(251, 146, 60, 0.06) 35%, rgba(251, 146, 60, 0) 75%)',
  filter: 'blur(20px)',
  pointerEvents: 'none',
}

const heroVignetteStyle = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, rgba(5, 10, 24, 0) 0%, rgba(5, 10, 24, 0.18) 54%, rgba(5, 10, 24, 0.48) 100%)',
  pointerEvents: 'none',
}

const heroContentStyle = {
  position: 'relative',
  zIndex: 2,
  height: '100%',
  display: 'grid',
  gridTemplateRows: '1fr auto',
  padding: '22px 0 28px',
}

const brandAreaStyle = {
  display: 'grid',
  alignContent: 'center',
  paddingLeft: '58px',
  paddingRight: '36px',
}

const brandRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '22px',
  flexWrap: 'wrap',
}

const brandStackStyle = {
  display: 'grid',
  gap: '26px',
  maxWidth: '680px',
}

const brandMarkStyle = {
  flexShrink: 0,
  filter: 'drop-shadow(0 18px 34px rgba(0, 0, 0, 0.30))',
}

const brandCopyStyle = {
  display: 'grid',
  gap: '14px',
}

const brandBarStyle = {
  width: '120px',
  height: '5px',
  borderRadius: '999px',
  background: 'linear-gradient(90deg, #ff8c00 0%, #fb923c 50%, #f97316 100%)',
  boxShadow: '0 0 24px rgba(255, 140, 0, 0.4)',
}

const titleStyle = {
  margin: 0,
  fontSize: 'clamp(86px, 12vw, 128px)',
  lineHeight: 0.88,
  letterSpacing: '-0.08em',
  fontWeight: 900,
  background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: 'none',
}

const subtitleStyle = {
  margin: 0,
  color: '#c7d2e8',
  fontSize: '16px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  fontWeight: 600,
  textShadow: 'none',
}

const brandNoteStyle = {
  margin: 0,
  maxWidth: '520px',
  color: 'rgba(203, 213, 225, 0.84)',
  fontSize: '16px',
  lineHeight: 1.7,
  textShadow: 'none',
  fontWeight: 400,
}

const featureRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '12px',
  alignItems: 'stretch',
}

const featureTrayStyle = {
  margin: '0 36px 0 58px',
  padding: '24px 16px 20px',
  borderRadius: '32px',
  background: 'linear-gradient(180deg, rgba(26, 20, 16, 0.75) 0%, rgba(21, 16, 8, 0.55) 100%)',
  border: '1px solid rgba(255, 140, 0, 0.25)',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.05)',
}

const featureStyle = {
  position: 'relative',
  display: 'grid',
  justifyItems: 'center',
  textAlign: 'center',
  gap: '14px',
  minHeight: '120px',
  padding: '10px 12px 4px',
  color: '#ffffff',
}

const featureIconStyle = {
  width: '62px',
  height: '62px',
  display: 'grid',
  placeItems: 'center',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.12), rgba(251, 146, 60, 0.08))',
  border: '1.5px solid rgba(255, 140, 0, 0.28)',
  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.06), 0 4px 12px rgba(255, 140, 0, 0.15)',
}

const featureTitleStyle = {
  margin: 0,
  fontSize: '15px',
  lineHeight: 1.6,
  color: 'rgba(226, 232, 240, 0.96)',
  whiteSpace: 'pre-line',
  fontWeight: 600,
}

const panelWrapStyle = {
  display: 'grid',
  alignItems: 'center',
  justifyItems: 'center',
}

const panelStyle = {
  width: '100%',
  maxWidth: '520px',
  minHeight: '720px',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '28px',
  padding: '56px 52px 36px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.996) 0%, rgba(249, 250, 255, 0.992) 100%)',
  color: '#1a1410',
  boxShadow: '0 40px 100px rgba(0, 0, 0, 0.32), 0 0 1px rgba(0, 0, 0, 0.08)',
  border: '1px solid rgba(255,255,255,0.88)',
}

const panelGlowStyle = {
  position: 'absolute',
  inset: 0,
  background: [
    'radial-gradient(circle at 15% 10%, rgba(255, 237, 213, 0.6), transparent 22%)',
    'radial-gradient(circle at 88% 88%, rgba(255, 140, 0, 0.06), transparent 28%)',
  ].join(', '),
  pointerEvents: 'none',
}

const panelHeaderStyle = {
  position: 'relative',
  zIndex: 1,
  textAlign: 'center',
}

const panelTitleStyle = {
  margin: 0,
  fontSize: 'clamp(32px, 3.5vw, 44px)',
  lineHeight: 1.16,
  letterSpacing: '-0.06em',
  fontWeight: 800,
  color: '#1a1410',
}

const panelBodyStyle = {
  margin: '14px auto 0',
  maxWidth: '100%',
  color: '#64748b',
  fontSize: '16px',
  lineHeight: 1.6,
}

const formStyle = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gap: '20px',
  marginTop: '48px',
}

const labelStyle = {
  display: 'grid',
  gap: '10px',
  fontSize: '14px',
  fontWeight: 700,
  color: '#1a1410',
}

const inputWrapStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  minHeight: '56px',
  borderRadius: '12px',
  border: '1.5px solid #e2e8f0',
  background: '#ffffff',
  padding: '0 16px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 2px rgba(0,0,0,0.02)',
  transition: 'all 0.2s ease',
}

const inputStyle = {
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: '#1a1410',
  fontSize: '15px',
  fontWeight: 500,
}

const iconBoxStyle = {
  width: '20px',
  height: '20px',
  display: 'grid',
  placeItems: 'center',
  color: '#94a3b8',
  flexShrink: 0,
}

const helperRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
  marginTop: '-4px',
}

const checkboxLabelStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  color: '#44403c',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

const fakeCheckboxStyle = {
  width: '18px',
  height: '18px',
  borderRadius: '4px',
  border: '1.5px solid #cbd5e1',
  background: '#ffffff',
  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)',
  flexShrink: 0,
}

const helperLinkStyle = {
  color: '#ff8c00',
  fontSize: '14px',
  textDecoration: 'none',
  fontWeight: 600,
  transition: 'color 0.2s ease',
}

const buttonStyle = {
  width: '100%',
  minHeight: '56px',
  border: 'none',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #ff8c00 0%, #fb923c 100%)',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 700,
  boxShadow: '0 12px 32px rgba(255, 140, 0, 0.35)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

const footerStyle = {
  margin: '32px 0 0',
  textAlign: 'center',
  color: '#94a3b8',
  fontSize: '14px',
  fontWeight: 500,
}

const footerLinkStyle = {
  color: '#ff8c00',
  textDecoration: 'none',
  fontWeight: 600,
  transition: 'color 0.2s ease',
}

const errorStyle = {
  margin: '-2px 0 0',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(220, 38, 38, 0.2)',
  background: '#fef2f2',
  color: '#b91c1c',
  fontSize: '14px',
  lineHeight: 1.5,
  fontWeight: 500,
}

function WireframeAccent() {
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="none"
      style={{ position: 'absolute', left: 0, top: 0, width: '320px', height: '190px', opacity: 0.84, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <path d="M0 54L84 62L128 12L238 48" stroke="rgba(43,122,255,0.72)" strokeWidth="1.4" fill="none" />
      <path d="M0 152L54 146L104 84L166 102" stroke="rgba(43,122,255,0.54)" strokeWidth="1.2" fill="none" />
      <path d="M120 12L92 82" stroke="rgba(43,122,255,0.54)" strokeWidth="1.1" fill="none" />
      <path d="M84 62L104 84" stroke="rgba(43,122,255,0.48)" strokeWidth="1.1" fill="none" />
    </svg>
  )
}

function ConstructionBackgroundScene() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `
          linear-gradient(135deg, rgba(15, 23, 46, 0.65) 0%, rgba(15, 23, 46, 0.75) 100%),
          url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(99,102,241,0.05)" stroke-width="1"/></pattern><linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:rgba(15,23,50,0.3)"/><stop offset="100%" style="stop-color:rgba(30,40,80,0.4)"/></linearGradient></defs><rect width="1200" height="800" fill="url(%23sky)"/><rect width="1200" height="800" fill="url(%23grid)"/><g opacity="0.12"><rect x="50" y="200" width="250" height="400" fill="none" stroke="rgba(99,102,241,0.3)" stroke-width="2"/><line x1="70" y1="220" x2="280" y2="220" stroke="rgba(99,102,241,0.2)" stroke-width="1"/><line x1="70" y1="280" x2="280" y2="280" stroke="rgba(99,102,241,0.2)" stroke-width="1"/><line x1="70" y1="340" x2="280" y2="340" stroke="rgba(99,102,241,0.2)" stroke-width="1"/><line x1="70" y1="400" x2="280" y2="400" stroke="rgba(99,102,241,0.2)" stroke-width="1"/><line x1="70" y1="460" x2="280" y2="460" stroke="rgba(99,102,241,0.2)" stroke-width="1"/><line x1="70" y1="520" x2="280" y2="520" stroke="rgba(99,102,241,0.2)" stroke-width="1"/><circle cx="90" cy="240" r="4" fill="rgba(99,102,241,0.4)"/><circle cx="260" cy="240" r="4" fill="rgba(99,102,241,0.4)"/><circle cx="90" cy="560" r="4" fill="rgba(99,102,241,0.4)"/><circle cx="260" cy="560" r="4" fill="rgba(99,102,241,0.4)"/></g><g opacity="0.08"><rect x="450" y="150" width="300" height="500" fill="none" stroke="rgba(59,130,246,0.3)" stroke-width="2"/><line x1="480" y1="180" x2="720" y2="180" stroke="rgba(59,130,246,0.2)" stroke-width="1"/><line x1="480" y1="260" x2="720" y2="260" stroke="rgba(59,130,246,0.2)" stroke-width="1"/><line x1="480" y1="340" x2="720" y2="340" stroke="rgba(59,130,246,0.2)" stroke-width="1"/><line x1="480" y1="420" x2="720" y2="420" stroke="rgba(59,130,246,0.2)" stroke-width="1"/><line x1="480" y1="500" x2="720" y2="500" stroke="rgba(59,130,246,0.2)" stroke-width="1"/></g><g opacity="0.1"><path d="M200 650 L200 700 L190 700 L190 650" stroke="rgba(99,102,241,0.4)" stroke-width="2" fill="none"/><path d="M300 650 L300 700 L290 700 L290 650" stroke="rgba(99,102,241,0.4)" stroke-width="2" fill="none"/><path d="M190 680 L310 680" stroke="rgba(99,102,241,0.3)" stroke-width="1.5" fill="none"/><path d="M600 600 L600 700 L590 700 L590 600" stroke="rgba(59,130,246,0.4)" stroke-width="2" fill="none"/><path d="M700 600 L700 700 L690 700 L690 600" stroke="rgba(59,130,246,0.4)" stroke-width="2" fill="none"/><path d="M590 650 L710 650" stroke="rgba(59,130,246,0.3)" stroke-width="1.5" fill="none"/></g><g opacity="0.15"><circle cx="400" cy="150" r="60" fill="none" stroke="rgba(99,102,241,0.2)" stroke-width="1.5"/><circle cx="900" cy="200" r="80" fill="none" stroke="rgba(59,130,246,0.2)" stroke-width="1.5"/><circle cx="150" cy="400" r="50" fill="none" stroke="rgba(99,102,241,0.15)" stroke-width="1"/></g></svg>')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  )
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 21C19 17.69 16.31 15 13 15H11C7.69 15 5 17.69 5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 11V8C7 5.24 9.24 3 12 3C14.76 3 17 5.24 17 8V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="5" y="11" width="14" height="10" rx="2.8" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function EyeIcon({ closed = false }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12C4.7 7.8 8 5.7 12 5.7C16 5.7 19.3 7.8 22 12C19.3 16.2 16 18.3 12 18.3C8 18.3 4.7 16.2 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      {closed ? (
        <path
          d="M4 4L20 20"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 21H21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 21V8L11 5V21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 21V11L19 8V21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11H8.01M8 14H8.01M14 13H14.01M17 13H17.01M14 16H14.01M17 16H17.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19H20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 19V12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 19V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 19V6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 15L9 10L13 13L20 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TeamIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16.5 8.5C16.5 10.16 15.16 11.5 13.5 11.5C11.84 11.5 10.5 10.16 10.5 8.5C10.5 6.84 11.84 5.5 13.5 5.5C15.16 5.5 16.5 6.84 16.5 8.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 9.5C8.5 10.88 7.38 12 6 12C4.62 12 3.5 10.88 3.5 9.5C3.5 8.12 4.62 7 6 7C7.38 7 8.5 8.12 8.5 9.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 18C10 15.79 11.79 14 14 14H15C17.21 14 19 15.79 19 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2.5 18C2.5 16.07 4.07 14.5 6 14.5H7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function Feature({ icon, title, showDivider = false }) {
  return (
    <div style={featureStyle}>
      {showDivider ? (
        <span
          style={{
            position: 'absolute',
            left: '-12px',
            top: '10px',
            bottom: '10px',
            width: '1px',
            background: 'rgba(97, 124, 212, 0.52)',
          }}
        />
      ) : null}
      <div style={featureIconStyle}>
        <div style={{ color: '#2f80ff' }}>{icon}</div>
      </div>
      <p style={featureTitleStyle}>{title}</p>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, remember }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel iniciar sessao.')
      }

      router.push(data.redirectTo || '/')
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main style={pageStyle}>
      <div className="login-shell" style={shellStyle}>
        <section className="hero-pane" style={heroStyle}>
          <ConstructionBackgroundScene />
          <div style={heroOverlayStyle} />
          <div style={heroVignetteStyle} />
          <div style={heroTopGlowStyle} />
          <div style={heroGlowStyle} />

          <div style={heroContentStyle}>
            <div style={brandAreaStyle}>
              <div style={brandStackStyle}>
                <div className="brand-row" style={brandRowStyle}>
                  <div style={brandCopyStyle}>
                    <h1 style={titleStyle}>BenPin</h1>
                    <div style={brandBarStyle} />
                    <p style={subtitleStyle}>
                      WORKS <span style={{ color: '#fb923c' }}>MANAGEMENT</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={featureTrayStyle}>
              <div className="feature-row" style={featureRowStyle}>
                <Feature icon={<BuildingIcon />} title={'Smart\nPlanning'} />
                <Feature icon={<ChartIcon />} title={'Real-time\nAnalytics'} showDivider />
                <Feature icon={<TeamIcon />} title={'Team\nCollaboration'} showDivider />
              </div>
            </div>
          </div>
        </section>

        <div style={panelWrapStyle}>
          <section style={panelStyle}>
            <div style={panelGlowStyle} />

            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>
                Welcome to <span style={{ color: '#ff8c00' }}>BenPin</span>
              </h2>
              <p style={panelBodyStyle}>Sign in to manage your construction works efficiently.</p>
            </div>

            <form onSubmit={handleSubmit} style={formStyle}>
              <label style={labelStyle}>
                Username
                <div className="input-wrap" style={inputWrapStyle}>
                  <span style={iconBoxStyle}>
                    <UserIcon />
                  </span>
                  <input
                    type="text"
                    name="username"
                    value={username}
                    onChange={event => setUsername(event.target.value)}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    className="login-input"
                    placeholder="Enter your username"
                    style={inputStyle}
                  />
                </div>
              </label>

              <label style={labelStyle}>
                Password
                <div className="input-wrap" style={inputWrapStyle}>
                  <span style={iconBoxStyle}>
                    <LockIcon />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    className="login-input"
                    placeholder="Enter your password"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(current => !current)}
                    style={{ border: 'none', background: 'transparent', color: '#94a3b8', padding: 0, cursor: 'pointer' }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon closed={!showPassword} />
                  </button>
                </div>
              </label>

              <div style={helperRowStyle}>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={event => setRemember(event.target.checked)}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                  />
                  <span style={{ ...fakeCheckboxStyle, background: remember ? '#ff8c00' : '#fff', borderColor: remember ? '#ff8c00' : '#cbd5e1' }} />
                  Remember me
                </label>

                <a href="#" style={helperLinkStyle} onClick={event => event.preventDefault()}>
                  Forgot password?
                </a>
              </div>

              {error ? (
                <p style={errorStyle} aria-live="polite">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="login-button"
                disabled={submitting}
                style={{ ...buttonStyle, opacity: submitting ? 0.88 : 1 }}
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>

            </form>

            <p style={footerStyle}>
              Don't have an account?{' '}
              <a href="#" style={footerLinkStyle} onClick={event => event.preventDefault()}>
                Contact us
              </a>
            </p>
          </section>
        </div>
      </div>

      <style jsx>{`
        .login-input::placeholder {
          color: #cbd5e1;
        }

        .input-wrap {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .input-wrap:focus-within {
          border-color: #ff8c00;
          box-shadow: 0 0 0 5px rgba(255, 140, 0, 0.12), inset 0 1px 2px rgba(0,0,0,0.02);
          transform: translateY(-2px);
        }

        .login-button,
        button {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(255, 140, 0, 0.4);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(-1px);
        }

        a[style*="color: #ff8c00"]:hover {
          text-decoration: underline;
        }

        @media (max-width: 1180px) {
          .login-shell {
            grid-template-columns: 1fr;
          }

          .hero-pane {
            min-height: 640px;
          }
        }

        @media (max-width: 760px) {
          .brand-row {
            gap: 16px;
            flexDirection: column;
            alignItems: center;
            textAlign: center;
          }

          .feature-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .login-shell {
            padding: 16px;
          }
        }
      `}</style>
    </main>
  )
}
