import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from '../components/LogoutButton'
import ChangePasswordForm from './ChangePasswordForm'
import NotificationSettingsForm from './NotificationSettingsForm'
import { hasPermission } from '../../lib/permissions.js'
import { getServerSession } from '../../lib/server-session.js'
import { getRoleLabel, isChefRole } from '../../lib/roles.js'
import { ViewportPage, ViewportScrollArea, ViewportShell } from '../components/ViewportLayout.js'

const pageStyle = {
  minHeight: '100vh',
  padding: 'clamp(20px, 4vw, 40px) 24px 48px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: 'var(--btx-font-family)',
}

const shellStyle = {
  maxWidth: '860px',
  margin: '0 auto',
  display: 'grid',
  gap: '22px',
}

const heroStyle = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '32px',
  padding: 'clamp(26px, 5vw, 40px)',
  background: 'linear-gradient(135deg, #0b1730 0%, #11264b 58%, #1a2238 100%)',
  border: '1px solid rgba(115, 148, 204, 0.24)',
  boxShadow: '0 34px 90px rgba(9, 24, 52, 0.22)',
  color: '#ffffff',
}

const topBarStyle = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  flexWrap: 'wrap',
}

const backLinkStyle = {
  color: '#bfdbfe',
  textDecoration: 'none',
  fontWeight: 800,
}

const titleStyle = {
  position: 'relative',
  zIndex: 1,
  margin: '34px 0 0',
  fontSize: 'clamp(36px, 7vw, 58px)',
  lineHeight: 1,
  letterSpacing: '-0.06em',
  fontWeight: 900,
}

const subtitleStyle = {
  position: 'relative',
  zIndex: 1,
  margin: '14px 0 0',
  maxWidth: '560px',
  color: 'rgba(226, 232, 240, 0.82)',
  fontSize: '16px',
  lineHeight: 1.7,
}

const cardStyle = {
  borderRadius: '28px',
  padding: '26px',
  background: 'var(--vp-surface-soft-strong)',
  border: '1px solid var(--vp-border)',
  boxShadow: '0 22px 48px rgba(24, 58, 110, 0.1)',
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '14px',
}

const fieldStyle = {
  padding: '18px',
  borderRadius: '20px',
  background: 'var(--vp-surface)',
  border: '1px solid var(--vp-border)',
}

const labelStyle = {
  margin: 0,
  color: 'var(--vp-text-soft)',
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

const valueStyle = {
  margin: '8px 0 0',
  color: '#10233e',
  fontSize: '18px',
  fontWeight: 800,
}

export default async function AccountSettingsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  if (!hasPermission(session, 'account.read_self')) {
    redirect('/')
  }

  const isChef = isChefRole(session.role)
  const shouldShowRole = !isChef

  return (
    <ViewportPage lockViewport style={pageStyle}>
      <ViewportShell fillHeight style={shellStyle}>
        <section style={heroStyle}>
          <div
            style={{
              position: 'absolute',
              right: '-120px',
              bottom: '-150px',
              width: '340px',
              height: '340px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 140, 0, 0.34) 0%, rgba(255, 140, 0, 0.08) 46%, rgba(255, 140, 0, 0) 80%)',
              filter: 'blur(18px)',
            }}
          />
          <div style={topBarStyle}>
            <Link href="/" style={backLinkStyle}>
              {'<- '}Voltar ao centro
            </Link>
            <LogoutButton
              style={{
                border: '1px solid rgba(255,255,255,0.16)',
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                backdropFilter: 'blur(12px)',
              }}
            />
          </div>
          <h1 style={titleStyle}>
            DefiniÃ§Ãµes da <span style={{ color: '#ff8c00' }}>conta</span>
          </h1>
          <p style={subtitleStyle}>
            Consulta rÃ¡pida dos dados ativos da sessÃ£o. As alteraÃ§Ãµes de dados de colaboradores continuam a ser geridas na Ã¡rea de GestÃ£o de pessoas.
          </p>
        </section>

        <ViewportScrollArea style={{ '--vp-page-scroll-gap': '22px' }}>
          <section style={cardStyle}>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <p style={labelStyle}>Nome</p>
              <p style={valueStyle}>{session.name}</p>
            </div>
            <div style={fieldStyle}>
              <p style={labelStyle}>Nome de utilizador</p>
              <p style={valueStyle}>{session.username}</p>
            </div>
            {shouldShowRole && (
              <div style={fieldStyle}>
                <p style={labelStyle}>Perfil</p>
                <p style={valueStyle}>{getRoleLabel(session.role)}</p>
              </div>
            )}
          </div>
          {isChef && <NotificationSettingsForm />}
          <ChangePasswordForm />
          </section>
        </ViewportScrollArea>
      </ViewportShell>
    </ViewportPage>
  )
}

