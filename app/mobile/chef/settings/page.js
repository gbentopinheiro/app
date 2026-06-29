import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from '../../../components/LogoutButton'
import ChangePasswordForm from '../../../account-settings/ChangePasswordForm'
import NotificationSettingsForm from '../../../account-settings/NotificationSettingsForm'
import MobileNotificationPermissionCard from './MobileNotificationPermissionCard'
import { getServerSession } from '../../../../lib/server-session.js'
import { getRoleLabel, isChefRole } from '../../../../lib/roles.js'
import { ViewportPage, ViewportScrollArea, ViewportShell } from '../../../components/ViewportLayout.js'

const pageStyle = {
  minHeight: '100vh',
  background: 'var(--vp-page-background)',
  padding: '20px 14px 32px',
  boxSizing: 'border-box',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const phoneShellStyle = {
  width: '100%',
  maxWidth: '430px',
  margin: '0 auto',
  display: 'grid',
  gap: '14px',
}

const heroStyle = {
  position: 'sticky',
  top: '14px',
  zIndex: 5,
  padding: '18px',
  borderRadius: '26px',
  background: 'var(--vp-module-hero)',
  border: '1px solid var(--vp-module-hero-border)',
  color: '#ffffff',
  boxShadow: 'var(--vp-hero-shadow-strong)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
}

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '10px',
  alignItems: 'center',
}

const backLinkStyle = {
  minHeight: '40px',
  padding: '0 14px',
  borderRadius: '14px',
  border: '1px solid rgba(255,255,255,0.16)',
  background: 'rgba(255,255,255,0.08)',
  color: '#ffffff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: 800,
  boxSizing: 'border-box',
  whiteSpace: 'nowrap',
}

const titleStyle = {
  margin: '18px 0 0',
  fontSize: '30px',
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: '-0.04em',
}

const cardStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: '18px',
  boxShadow: 'var(--vp-shadow-panel)',
  color: 'var(--vp-text)',
}

const sectionTitleStyle = {
  margin: 0,
  fontSize: '18px',
  lineHeight: 1.15,
  fontWeight: 900,
  letterSpacing: '-0.03em',
}

const infoGridStyle = {
  display: 'grid',
  gap: '10px',
  marginTop: '16px',
}

const infoCardStyle = {
  borderRadius: '18px',
  padding: '14px',
  background: 'var(--vp-stat-surface)',
  border: '1px solid var(--vp-stat-border)',
  boxShadow: 'var(--vp-stat-shadow)',
}

const infoLabelStyle = {
  margin: 0,
  color: 'var(--vp-text-muted)',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.08em',
}

const infoValueStyle = {
  margin: '6px 0 0',
  fontSize: '18px',
  fontWeight: 900,
  lineHeight: 1.25,
}

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Definições Móveis',
}

export default async function ChefMobileSettingsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  const isChef = isChefRole(session.role)

  return (
    <ViewportPage lockViewport style={pageStyle}>
      <ViewportShell fillHeight style={phoneShellStyle}>
        <section style={heroStyle}>
          <div style={topBarStyle}>
            <Link href="/mobile/chef" style={backLinkStyle}>
              Voltar
            </Link>
            <LogoutButton
              redirectTo="/login"
              style={{
                border: '1px solid rgba(255,255,255,0.16)',
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                minHeight: '40px',
                padding: '0 14px',
              }}
            />
          </div>
          <h1 style={titleStyle}>Definições</h1>
        </section>

        <ViewportScrollArea style={{ '--vp-page-scroll-gap': '14px' }}>
          <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Conta</h2>
          <div style={infoGridStyle}>
            <div style={infoCardStyle}>
              <p style={infoLabelStyle}>Nome</p>
              <p style={infoValueStyle}>{session.name}</p>
            </div>
            <div style={infoCardStyle}>
              <p style={infoLabelStyle}>Username</p>
              <p style={infoValueStyle}>{session.username}</p>
            </div>
            <div style={infoCardStyle}>
              <p style={infoLabelStyle}>Perfil</p>
              <p style={infoValueStyle}>{getRoleLabel(session.role)}</p>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Segurança</h2>
          <ChangePasswordForm />
        </section>

        {isChef ? (
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Notificações</h2>
            <MobileNotificationPermissionCard />
            <NotificationSettingsForm
              title="Hora do lembrete"
              description=""
              withTopBorder={false}
              marginTop="16px"
            />
          </section>
        ) : null}
        </ViewportScrollArea>
      </ViewportShell>
    </ViewportPage>
  )
}
