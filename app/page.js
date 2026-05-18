import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from './components/LogoutButton'
import { getRoleLabel } from '../lib/roles.js'
import { getServerSession } from '../lib/server-session.js'

const modules = [
  {
    href: '/daily-hours',
    title: 'Registo diário de horas',
    accent: 'linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(59, 130, 246, 0.08) 100%)',
    bar: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
    label: 'Operação diária',
  },
  {
    href: '/works',
    title: 'Gestão de obra',
    accent: 'linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(59, 130, 246, 0.08) 100%)',
    bar: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
    label: 'Planeamento',
  },
  {
    href: '/people',
    title: 'Gestão de pessoas',
    accent: 'linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(59, 130, 246, 0.08) 100%)',
    bar: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
    label: 'Recursos',
  },
  {
    href: '/daily-plan',
    title: 'Plano diário',
    accent: 'linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(59, 130, 246, 0.08) 100%)',
    bar: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
    label: 'Coordenação',
  },
]

const pageStyle = {
  minHeight: '100vh',
  padding: 'clamp(20px, 4vw, 40px) 24px 48px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const containerStyle = {
  maxWidth: '1180px',
  margin: '0 auto',
  display: 'grid',
  gap: '24px',
}

const heroStyle = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '34px',
  padding: 'clamp(28px, 5vw, 42px)',
  background: 'linear-gradient(135deg, #0b1730 0%, #11264b 58%, #1a2238 100%)',
  border: '1px solid rgba(115, 148, 204, 0.24)',
  boxShadow: '0 34px 90px rgba(9, 24, 52, 0.26)',
  color: '#ffffff',
}

const heroBlueGlowStyle = {
  position: 'absolute',
  left: '-120px',
  top: '-140px',
  width: '360px',
  height: '360px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(37, 99, 235, 0.42) 0%, rgba(37, 99, 235, 0.08) 48%, rgba(37, 99, 235, 0) 78%)',
  filter: 'blur(18px)',
  pointerEvents: 'none',
}

const heroOrangeGlowStyle = {
  position: 'absolute',
  right: '-120px',
  bottom: '-150px',
  width: '340px',
  height: '340px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255, 140, 0, 0.34) 0%, rgba(255, 140, 0, 0.08) 46%, rgba(255, 140, 0, 0) 80%)',
  filter: 'blur(18px)',
  pointerEvents: 'none',
}

const heroLineStyle = {
  position: 'absolute',
  inset: 0,
  background: [
    'linear-gradient(122deg, transparent 0%, transparent 66%, rgba(255,255,255,0.04) 66.2%, transparent 66.6%)',
    'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 28%)',
  ].join(', '),
  pointerEvents: 'none',
}

const heroContentStyle = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gap: '32px',
}

const heroTopBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  flexWrap: 'wrap',
}

const brandBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(226, 232, 240, 0.96)',
  fontSize: '12px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontWeight: 700,
  backdropFilter: 'blur(12px)',
}

const heroGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, 0.75fr)',
  gap: '24px',
  alignItems: 'end',
}

const heroCopyStyle = {
  display: 'grid',
  gap: '16px',
  maxWidth: '720px',
}

const heroKickerStyle = {
  margin: 0,
  fontSize: '13px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: '#93c5fd',
  fontWeight: 700,
}

const heroTitleStyle = {
  margin: 0,
  fontSize: 'clamp(42px, 7vw, 64px)',
  lineHeight: 0.98,
  letterSpacing: '-0.06em',
  fontWeight: 800,
}

const heroDescriptionStyle = {
  margin: 0,
  maxWidth: '620px',
  color: 'rgba(226, 232, 240, 0.84)',
  fontSize: '17px',
  lineHeight: 1.7,
}

const heroMetaGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '14px',
}

const heroMetaCardStyle = {
  padding: '18px 18px 16px',
  borderRadius: '20px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  backdropFilter: 'blur(12px)',
}

const heroMetaLabelStyle = {
  margin: 0,
  color: 'rgba(191, 219, 254, 0.8)',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const heroMetaValueStyle = {
  margin: '10px 0 0',
  color: '#ffffff',
  fontSize: '18px',
  lineHeight: 1.35,
  fontWeight: 700,
}

const cardsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '18px',
}

const cardStyle = accent => ({
  position: 'relative',
  overflow: 'hidden',
  display: 'grid',
  gap: '16px',
  minHeight: '220px',
  padding: '24px',
  borderRadius: '26px',
  background: 'var(--vp-surface-soft-strong)',
  border: '1px solid var(--vp-border)',
  boxShadow: '0 22px 48px rgba(24, 58, 110, 0.1)',
  textDecoration: 'none',
  color: 'inherit',
  cursor: 'pointer',
})

const cardGlowStyle = accent => ({
  position: 'absolute',
  inset: 0,
  background: accent,
  opacity: 1,
  pointerEvents: 'none',
})

const cardBarStyle = bar => ({
  width: '92px',
  height: '6px',
  borderRadius: '999px',
  background: bar,
  boxShadow: '0 10px 24px rgba(37, 99, 235, 0.14)',
})

const cardContentStyle = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gap: '14px',
  alignContent: 'start',
  height: '100%',
}

const cardLabelStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  padding: '8px 12px',
  borderRadius: '999px',
  background: 'rgba(255, 244, 230, 0.84)',
  color: '#49627f',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const cardTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '28px',
  lineHeight: 1.08,
  letterSpacing: '-0.04em',
  fontWeight: 800,
}

const cardFooterStyle = {
  marginTop: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
}

const cardArrowStyle = {
  color: '#2563eb',
  fontSize: '20px',
  lineHeight: 1,
  fontWeight: 800,
}

export default async function Home() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  if (session.role === 'chef') {
    redirect('/daily-hours')
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={heroStyle}>
          <div style={heroBlueGlowStyle} />
          <div style={heroOrangeGlowStyle} />
          <div style={heroLineStyle} />

          <div style={heroContentStyle}>
            <div style={heroTopBarStyle}>
              <div style={brandBadgeStyle}>
                <span
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #ff8c00 100%)',
                  }}
                />
                BenPin
              </div>
              <LogoutButton
                style={{
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  backdropFilter: 'blur(12px)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              />
            </div>

            <div style={heroGridStyle}>
              <div style={heroCopyStyle}>
                <p style={heroKickerStyle}>Plataforma de gestão</p>
                <h1 style={heroTitleStyle}>
                  Centro de gestão <span style={{ color: '#ff8c00' }}>operacional</span>
                </h1>
                <p style={heroDescriptionStyle}>
                  Acompanhe obras, equipas, horas e planeamento com a mesma identidade visual da login:
                  base azul profissional, contraste forte e destaques laranja para ações importantes.
                </p>
              </div>

              <div style={heroMetaGridStyle}>
                <div style={heroMetaCardStyle}>
                  <p style={heroMetaLabelStyle}>Sessão ativa</p>
                  <p style={heroMetaValueStyle}>{session.name}</p>
                </div>
                <div style={heroMetaCardStyle}>
                  <p style={heroMetaLabelStyle}>Perfil</p>
                  <p style={heroMetaValueStyle}>{getRoleLabel(session.role)}</p>
                </div>
                <div style={heroMetaCardStyle}>
                  <p style={heroMetaLabelStyle}>Ambiente</p>
                  <p style={heroMetaValueStyle}>Controlo central</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={cardsStyle}>
          {modules.map(module => (
            <Link key={module.href} href={module.href} style={cardStyle(module.accent)}>
              <div style={cardGlowStyle(module.accent)} />
              <div style={cardContentStyle}>
                <div style={cardLabelStyle}>{module.label}</div>
                <div style={cardBarStyle(module.bar)} />
                <div>
                  <h2 style={cardTitleStyle}>{module.title}</h2>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
