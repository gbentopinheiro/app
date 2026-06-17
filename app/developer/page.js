import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from '../components/LogoutButton'
import FeatureFlagsPanel from './FeatureFlagsPanel'
import AccessProfilesPanel from './AccessProfilesPanel'
import UserManagementPanel from './UserManagementPanel'
import DataIntegrityPanel from './DataIntegrityPanel'
import SystemDiagnosticsPanel from './SystemDiagnosticsPanel'
import AuditTrailPanel from './AuditTrailPanel'
import DataManagementPanel from './DataManagementPanel'
import DeveloperOverrideCorrectionButton from './DeveloperOverrideCorrectionButton'
import { getDeveloperDashboardData } from '../../lib/developer-dashboard.js'
import { getDeveloperOverrideEvents } from '../../lib/developer-override-events.js'
import { getFeatureFlagDefinitions } from '../../lib/feature-flags.js'
import { getAllPeopleData } from '../../lib/people.js'
import { hasPermission } from '../../lib/permissions.js'
import { getServerSession } from '../../lib/server-session.js'
import { getAllWorksData } from '../../lib/works.js'

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
  gap: '18px',
}

const heroTitleStyle = {
  margin: 0,
  fontSize: 'clamp(38px, 7vw, 68px)',
  lineHeight: 0.96,
  letterSpacing: '-0.07em',
  fontWeight: 900,
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

const groupShellStyle = {
  display: 'grid',
  gap: '18px',
}

const groupHeaderStyle = {
  display: 'grid',
  gap: '8px',
  padding: '22px 24px',
  borderRadius: '28px',
  background: 'rgba(255,255,255,0.76)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 18px 42px rgba(15, 23, 42, 0.08)',
  backdropFilter: 'blur(16px)',
}

const groupEyebrowStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
}

const groupTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '30px',
  fontWeight: 900,
  letterSpacing: '-0.05em',
}

const groupDescriptionStyle = {
  margin: 0,
  color: '#52637a',
  fontSize: '15px',
  lineHeight: 1.7,
}

const groupContentStyle = {
  display: 'grid',
  gap: '18px',
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

function formatTargetDate(value) {
  if (!value) {
    return 'Sem data alvo'
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

function getOverrideResultStyle(result) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '96px',
    padding: '8px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    background: result === 'success' ? '#ecfdf3' : '#fff1f2',
    color: result === 'success' ? '#166534' : '#9f1239',
    border: `1px solid ${result === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(244, 63, 94, 0.18)'}`,
  }
}

function DeveloperSectionGroup({ eyebrow, heading, description, children }) {
  return (
    <section style={groupShellStyle}>
      <div style={groupHeaderStyle}>
        <p style={groupEyebrowStyle}>{eyebrow}</p>
        <h2 style={groupTitleStyle}>{heading}</h2>
        <p style={groupDescriptionStyle}>{description}</p>
      </div>
      <div style={groupContentStyle}>{children}</div>
    </section>
  )
}

export default async function DeveloperPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  if (!hasPermission(session, 'developer.dashboard.read')) {
    redirect('/')
  }

  const dashboard = await getDeveloperDashboardData()
  const overrideEvents = await getDeveloperOverrideEvents({ limit: 12 })
  const featureFlags = getFeatureFlagDefinitions()
  const [people, works] = await Promise.all([getAllPeopleData(), getAllWorksData()])
  const overridePeopleOptions = people
    .map(person => ({
      id: person.id,
      name: person.name,
      companyId: person.companyId,
      role: person.role,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-PT'))
  const overrideWorkOptions = works
    .map(work => ({
      id: work.id,
      number: work.number,
      name: work.name,
      companyId: work.companyId,
      status: work.status,
    }))
    .sort((left, right) => Number(left.number || 0) - Number(right.number || 0))

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <DeveloperSectionGroup
          eyebrow="Visao Geral"
          heading="Resumo tecnico da area Developer"
          description="Leitura rapida do ambiente tecnico, alertas e acessos principais do painel Developer."
        >
          <section style={heroStyle}>
            <div style={topBarStyle}>
              <span style={badgeStyle}>BenPin - Painel do programador</span>
              <div style={actionRowStyle}>
                <Link href="/activity-history" style={linkButtonStyle}>
                  Historico
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
                  Centro tecnico da <span style={{ color: '#ff8c00' }}>aplicacao</span>
                </h1>
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
              <h2 style={sectionTitleStyle}>Alertas tecnicos</h2>
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
                  <p style={quickTitleStyle}>Historico da aplicacao</p>
                </Link>
                <Link href="/account-settings" style={quickCardStyle}>
                  <p style={quickTitleStyle}>Conta e seguranca</p>
                </Link>
              </div>
              <div style={listStyle}>
                {dashboard.accessSummary.map(item => (
                  <SummaryRow key={item.label} item={item} />
                ))}
              </div>
            </section>
          </section>
        </DeveloperSectionGroup>

        <DeveloperSectionGroup
          eyebrow="Gestao"
          heading="Contas, perfis e permissoes"
          description="Organizacao tecnica de contas e perfis, mantendo roles, accountType e guardas existentes."
        >
          <UserManagementPanel />
          <AccessProfilesPanel />
        </DeveloperSectionGroup>

        <DeveloperSectionGroup
          eyebrow="Operacao Tecnica"
          heading="Correcao tecnica e integridade"
          description="Ferramentas de manutencao controlada para ajustes tecnicos e verificacao de consistencia."
        >
          <section style={sectionStyle}>
            <div style={topBarStyle}>
              <h2 style={sectionTitleStyle}>Correcoes tecnicas</h2>
              <DeveloperOverrideCorrectionButton
                peopleOptions={overridePeopleOptions}
                workOptions={overrideWorkOptions}
              />
            </div>
            {overrideEvents.length > 0 ? (
              <div style={listStyle}>
                {overrideEvents.map(event => (
                  <article key={event.id} style={{ ...rowStyle, alignItems: 'flex-start', flexDirection: 'column' }}>
                    <div style={{ ...topBarStyle, width: '100%' }}>
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <p style={rowLabelStyle}>
                          {event.action} - {event.entityType}
                          {event.entityId ? ` #${event.entityId}` : ''}
                        </p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
                          {formatDateTime(event.createdAt)} - {event.developerUsername || 'developer'} - {formatTargetDate(event.targetDate)}
                        </p>
                      </div>
                      <span style={getOverrideResultStyle(event.result)}>
                        {event.result === 'success' ? 'Sucesso' : 'Falha'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gap: '6px', width: '100%' }}>
                      <p style={{ margin: 0, color: '#10233e', fontSize: '14px', fontWeight: 800 }}>
                        Motivo: <span style={{ fontWeight: 600 }}>{event.reason || 'Sem motivo'}</span>
                      </p>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>
                        Permissao: {event.permissionKeyUsed || 'n/a'} - Override: {event.overrideType || 'n/a'}
                      </p>
                      {event.errorMessage ? (
                        <p style={{ margin: 0, color: '#9f1239', fontSize: '13px', lineHeight: 1.6 }}>
                          Erro: {event.errorMessage}
                        </p>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div style={{ ...getIssueStyle('low'), marginTop: '18px' }}>
                <p style={issueTitleStyle}>Sem correcoes tecnicas registadas</p>
              </div>
            )}
          </section>

          <DataIntegrityPanel />
        </DeveloperSectionGroup>

        <DeveloperSectionGroup
          eyebrow="Sistema"
          heading="Estado, funcionalidades e dados"
          description="Diagnostico do runtime, controlo de funcionalidades e operacoes de gestao de dados."
        >
          <SystemDiagnosticsPanel />
          <FeatureFlagsPanel initialFlags={featureFlags} />
          <DataManagementPanel />
        </DeveloperSectionGroup>

        <DeveloperSectionGroup
          eyebrow="Auditoria"
          heading="Rastreabilidade tecnica"
          description="Consulta do audit trail e historico das acoes tecnicas mais sensiveis."
        >
          <AuditTrailPanel />
        </DeveloperSectionGroup>
      </div>
    </main>
  )
}
