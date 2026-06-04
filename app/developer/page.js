import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from '../components/LogoutButton'
import FeatureFlagsPanel from './FeatureFlagsPanel'
import UserManagementPanel from './UserManagementPanel'
import DataIntegrityPanel from './DataIntegrityPanel'
import SystemDiagnosticsPanel from './SystemDiagnosticsPanel'
import AuditTrailPanel from './AuditTrailPanel'
import DataManagementPanel from './DataManagementPanel'
import { getDeveloperDashboardData } from '../../lib/developer-dashboard.js'
import { getFeatureFlagDefinitions } from '../../lib/feature-flags.js'
import { getServerSession } from '../../lib/server-session.js'
import { isDeveloperRole } from '../../lib/roles.js'

const pageStyle = {
  minHeight: '100vh',
  padding: 'clamp(20px, 4vw, 42px) 22px 56px',
  background: 'linear-gradient(180deg, #081224 0%, #0d1b35 54%, #eaf0f8 54%, #f5f7fb 100%)',
  color: '#10233e',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const shellStyle = {
  maxWidth: '1180px',
  margin: '0 auto',
  display: 'grid',
  gap: '22px',
}

const heroStyle = {
  display: 'grid',
  gap: '22px',
  borderRadius: '34px',
  padding: '30px',
  background: 'linear-gradient(135deg, #071226 0%, #10284d 58%, #1c2940 100%)',
  border: '1px solid rgba(150, 185, 255, 0.18)',
  boxShadow: '0 40px 90px rgba(6, 16, 32, 0.32)',
  color: '#ffffff',
}

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  flexWrap: 'wrap',
}

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  padding: '10px 14px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#bfdbfe',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const actionRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
}

const linkButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '42px',
  padding: '0 16px',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.08)',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 700,
  backdropFilter: 'blur(12px)',
}

const heroGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.8fr)',
  gap: '18px',
}

const heroTitleStyle = {
  margin: 0,
  fontSize: 'clamp(38px, 7vw, 68px)',
  lineHeight: 0.96,
  letterSpacing: '-0.07em',
  fontWeight: 900,
}

const chipGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '12px',
}

const chipStyle = {
  padding: '14px 16px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
}

const chipLabelStyle = {
  margin: 0,
  color: '#93c5fd',
  fontSize: '11px',
  fontWeight: 900,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const chipValueStyle = {
  margin: '8px 0 0',
  color: '#ffffff',
  fontSize: '16px',
  lineHeight: 1.5,
  fontWeight: 800,
}

const metricGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '14px',
}

const metricCardStyle = {
  padding: '20px',
  borderRadius: '24px',
  background: '#ffffff',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 16px 32px rgba(15, 23, 42, 0.06)',
}

const metricLabelStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const metricValueStyle = {
  margin: '12px 0 0',
  color: '#10233e',
  fontSize: '34px',
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: '-0.06em',
}

const sectionGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '18px',
}

const sectionStyle = {
  borderRadius: '30px',
  padding: '24px',
  background: '#ffffff',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 18px 42px rgba(15, 23, 42, 0.08)',
}

const sectionTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '24px',
  fontWeight: 900,
  letterSpacing: '-0.04em',
}

const issueListStyle = {
  display: 'grid',
  gap: '12px',
  marginTop: '18px',
}

const issueCardBaseStyle = {
  padding: '16px 18px',
  borderRadius: '20px',
  border: '1px solid',
}

const issueTitleStyle = {
  margin: 0,
  fontSize: '16px',
  fontWeight: 900,
}

const issueTextStyle = {
  margin: '8px 0 0',
  fontSize: '14px',
  lineHeight: 1.65,
}

const listStyle = {
  display: 'grid',
  gap: '12px',
  marginTop: '18px',
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  padding: '14px 16px',
  borderRadius: '18px',
  background: '#f8fafc',
  border: '1px solid rgba(148, 163, 184, 0.18)',
}

const rowLabelStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '15px',
  fontWeight: 800,
}

const rowValueStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '22px',
  fontWeight: 900,
  letterSpacing: '-0.05em',
  whiteSpace: 'nowrap',
}

const quickGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '12px',
  marginTop: '18px',
}

const quickCardStyle = {
  display: 'grid',
  gap: '8px',
  padding: '18px',
  borderRadius: '22px',
  background: '#f8fafc',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  textDecoration: 'none',
}

const quickTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '17px',
  fontWeight: 900,
}

function formatDate(value) {
  if (!value) {
    return 'Sem registo'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(value) {
  if (!value) {
    return 'Sem registo'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getIssueStyle(severity) {
  if (severity === 'high') {
    return {
      ...issueCardBaseStyle,
      background: '#fff1f2',
      borderColor: 'rgba(244, 63, 94, 0.22)',
      color: '#9f1239',
    }
  }

  if (severity === 'medium') {
    return {
      ...issueCardBaseStyle,
      background: '#fff7ed',
      borderColor: 'rgba(249, 115, 22, 0.22)',
      color: '#9a3412',
    }
  }

  return {
    ...issueCardBaseStyle,
    background: '#eff6ff',
    borderColor: 'rgba(59, 130, 246, 0.22)',
    color: '#1d4ed8',
  }
}

function MetricCard({ item }) {
  return (
    <article style={metricCardStyle}>
      <p style={metricLabelStyle}>{item.label}</p>
      <p style={metricValueStyle}>{item.value}</p>
    </article>
  )
}

function SummaryRow({ item }) {
  return (
    <div style={rowStyle}>
      <p style={rowLabelStyle}>{item.label}</p>
      <p style={rowValueStyle}>{item.value}</p>
    </div>
  )
}

export default async function DeveloperPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  if (!isDeveloperRole(session.role)) {
    redirect('/')
  }

  const dashboard = await getDeveloperDashboardData()
  const featureFlags = getFeatureFlagDefinitions()

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <div style={topBarStyle}>
            <span style={badgeStyle}>BenPin · Painel do programador</span>
            <div style={actionRowStyle}>
              <Link href="/activity-history" style={linkButtonStyle}>
                Histórico
              </Link>
              <Link href="/account-settings" style={linkButtonStyle}>
                Conta
              </Link>
              <a href="/api/developer/dashboard-export" style={linkButtonStyle}>
                Exportar PDF
              </a>
              <LogoutButton
                style={{
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  backdropFilter: 'blur(12px)',
                }}
              />
            </div>
          </div>

          <div style={heroGridStyle}>
            <div>
              <h1 style={heroTitleStyle}>
                Centro técnico da <span style={{ color: '#ff8c00' }}>aplicação</span>
              </h1>
            </div>

            <div style={chipGridStyle}>
              <div style={chipStyle}>
                <p style={chipLabelStyle}>Sessão ativa</p>
                <p style={chipValueStyle}>{session.name}</p>
              </div>
              <div style={chipStyle}>
                <p style={chipLabelStyle}>Username</p>
                <p style={chipValueStyle}>{session.username}</p>
              </div>
              <div style={chipStyle}>
                <p style={chipLabelStyle}>Última atividade</p>
                <p style={chipValueStyle}>{formatDateTime(dashboard.highlights.lastActivityAt)}</p>
              </div>
              <div style={chipStyle}>
                <p style={chipLabelStyle}>Último login</p>
                <p style={chipValueStyle}>{formatDateTime(dashboard.highlights.latestLoginAt)}</p>
              </div>
              <div style={chipStyle}>
                <p style={chipLabelStyle}>Sessão expira</p>
                <p style={chipValueStyle}>{formatDateTime(session.expiresAt)}</p>
              </div>
              <div style={chipStyle}>
                <p style={chipLabelStyle}>Último plano diário</p>
                <p style={chipValueStyle}>{formatDate(dashboard.highlights.latestPlanDate)}</p>
              </div>
              <div style={chipStyle}>
                <p style={chipLabelStyle}>Submissões bloqueadas</p>
                <p style={chipValueStyle}>{dashboard.highlights.submittedAssignments}</p>
              </div>
            </div>
          </div>
        </section>

        <section style={metricGridStyle}>
          {dashboard.metrics.map(item => (
            <MetricCard key={item.label} item={item} />
          ))}
        </section>

        <section style={sectionGridStyle}>
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Alertas técnicos</h2>
            {dashboard.issues.length > 0 ? (
              <div style={issueListStyle}>
                {dashboard.issues.map(issue => (
                  <article key={`${issue.severity}-${issue.title}`} style={getIssueStyle(issue.severity)}>
                    <p style={issueTitleStyle}>{issue.title}</p>
                    <p style={issueTextStyle}>{issue.description}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div style={{ ...getIssueStyle('low'), marginTop: '18px' }}>
                <p style={issueTitleStyle}>Sem alertas abertos</p>
              </div>
            )}
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Atalhos do programador</h2>
            <div style={quickGridStyle}>
              <Link href="/activity-history" style={quickCardStyle}>
                <p style={quickTitleStyle}>Histórico da aplicação</p>
              </Link>
              <Link href="/account-settings" style={quickCardStyle}>
                <p style={quickTitleStyle}>Conta e segurança</p>
              </Link>
            </div>
            <div style={listStyle}>
              {dashboard.accessSummary.map(item => (
                <SummaryRow key={item.label} item={item} />
              ))}
            </div>
          </section>
        </section>

        <FeatureFlagsPanel initialFlags={featureFlags} />

        <UserManagementPanel />

        <DataIntegrityPanel />

        <DataManagementPanel />

        <AuditTrailPanel />

        <SystemDiagnosticsPanel />
      </div>
    </main>
  )
}
