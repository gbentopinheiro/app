import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from './components/LogoutButton'
import { BentixContent, BentixPage, BentixResponsiveGrid } from './components/ViewportLayout.js'
import { isFeatureEnabled } from '../lib/feature-flags.js'
import { getServerSession } from '../lib/server-session.js'
import { isChefRole, isResponsavelRole } from '../lib/roles.js'
import { getAllPeopleData } from '../lib/people.js'
import { getAllWorkAssignmentsData } from '../lib/work-assignments.js'
import { isAssignmentApproved } from '../lib/work-assignment-approval.js'
import { getAllWorksData, WorkStatus } from '../lib/works.js'
import { buildOperationalWorkStatuses } from '../lib/work-operation-status.js'
import { getAllDailyWorkNotesData } from '../lib/daily-work-notes.js'
import { getBelgianHolidays } from '../lib/belgian-holidays.js'
import { getAllCalendarEvents } from '../lib/calendar-events.js'
import { getCalendarNotificationState } from '../lib/calendar-notifications.js'
import { getOperationNotifications } from '../lib/operation-notifications.js'

const modules = [
  {
    href: '/daily-hours',
    title: 'Horas',
    accent: 'linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(59, 130, 246, 0.08) 100%)',
    bar: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
    label: 'Operação diária',
  },
  {
    href: '/works',
    title: 'Clientes/Obras',
    accent: 'linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(59, 130, 246, 0.08) 100%)',
    bar: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
    label: 'Planeamento',
  },
  {
    href: '/people',
    title: 'Pessoas',
    accent: 'linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(59, 130, 246, 0.08) 100%)',
    bar: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
    label: 'Recursos',
  },
  {
    href: '/daily-plan',
    title: 'Planeamento',
    accent: 'linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(59, 130, 246, 0.08) 100%)',
    bar: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
    label: 'Coordenação',
  },
]

const pageStyle = {
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const containerStyle = {
  '--btx-content-gap': '16px',
}

const heroStyle = {
  position: 'relative',
  overflow: 'visible',
  borderRadius: '34px',
  padding: 'clamp(22px, 3vw, 30px)',
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
  gap: '22px',
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

const accountMenuStyle = {
  position: 'relative',
  display: 'inline-flex',
  justifyContent: 'flex-end',
}

const accountClusterStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  padding: '6px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  backdropFilter: 'blur(12px)',
}

const accountNamePillStyle = {
  minHeight: '44px',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 14px',
  borderRadius: '16px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 800,
  background: 'rgba(255,255,255,0.08)',
}

const accountMenuButtonStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.16)',
  background: 'rgba(255,255,255,0.1)',
  color: '#ffffff',
  display: 'inline-grid',
  placeItems: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(12px)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
  listStyle: 'none',
}

const dotsStyle = {
  display: 'grid',
  gap: '4px',
}

const dotStyle = {
  width: '4px',
  height: '4px',
  borderRadius: '999px',
  background: '#ffffff',
  boxShadow: '0 0 12px rgba(255,255,255,0.35)',
}

const accountMenuPanelStyle = {
  position: 'absolute',
  top: 'calc(100% + 10px)',
  right: 0,
  zIndex: 5,
  width: '260px',
  padding: '10px',
  borderRadius: '20px',
  background: 'rgba(255, 255, 255, 0.98)',
  border: '1px solid rgba(203, 213, 225, 0.9)',
  boxShadow: '0 24px 70px rgba(8, 22, 45, 0.26)',
  color: '#10233e',
}

const accountMenuHeaderStyle = {
  padding: '10px 12px 12px',
  borderBottom: '1px solid rgba(216, 225, 238, 0.9)',
  marginBottom: '8px',
}

const accountMenuLabelStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const accountMenuNameStyle = {
  margin: '6px 0 0',
  color: '#10233e',
  fontSize: '15px',
  fontWeight: 800,
}

const accountMenuLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '12px',
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px',
  borderRadius: '14px',
  border: 'none',
  color: '#10233e',
  textDecoration: 'none',
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: 800,
  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(255, 140, 0, 0.08) 100%)',
  cursor: 'pointer',
}

const heroGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: '24px',
  alignItems: 'end',
}

const heroCopyStyle = {
  display: 'grid',
  gap: '16px',
  width: 'min(100%, clamp(34rem, 58vw, 50rem))',
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
  fontSize: 'clamp(36px, 5vw, 54px)',
  lineHeight: 0.98,
  letterSpacing: '-0.06em',
  fontWeight: 800,
}

const heroDescriptionStyle = {
  margin: 0,
  width: 'min(100%, clamp(28rem, 52vw, 42rem))',
  color: 'rgba(226, 232, 240, 0.84)',
  fontSize: '17px',
  lineHeight: 1.7,
}

const dashboardSectionStyle = {
  display: 'grid',
  gap: '14px',
  padding: '18px',
  borderRadius: '30px',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(255,244,230,0.72) 100%)',
  border: '1px solid rgba(228, 190, 145, 0.52)',
  boxShadow: '0 24px 54px rgba(24, 58, 110, 0.1)',
}

const dashboardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'end',
  gap: '14px',
  flexWrap: 'wrap',
}

const dashboardKickerStyle = {
  margin: 0,
  color: '#2563eb',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
}

const dashboardTitleStyle = {
  margin: '6px 0 0',
  color: '#10233e',
  fontSize: 'clamp(28px, 4vw, 38px)',
  lineHeight: 1,
  letterSpacing: '-0.05em',
  fontWeight: 900,
}

const dashboardDateStyle = {
  margin: 0,
  padding: '10px 14px',
  borderRadius: '999px',
  background: 'rgba(37, 99, 235, 0.08)',
  color: '#1e3a8a',
  fontSize: '13px',
  fontWeight: 900,
}

const dashboardGridStyle = {
  gap: '14px',
}

const dashboardBodyStyle = {
  gap: '14px',
  alignItems: 'start',
}

const responsavelDashboardBodyStyle = {
  gap: '14px',
  alignItems: 'start',
}

const dashboardCardStyle = {
  position: 'relative',
  overflow: 'hidden',
  minHeight: '112px',
  padding: '16px',
  borderRadius: '24px',
  background: '#ffffff',
  border: '1px solid rgba(216, 225, 238, 0.9)',
  boxShadow: '0 18px 38px rgba(24, 58, 110, 0.08)',
}

const dashboardCardGlowStyle = color => ({
  position: 'absolute',
  right: '-48px',
  top: '-58px',
  width: '136px',
  height: '136px',
  borderRadius: '50%',
  background: color,
  opacity: 0.2,
  pointerEvents: 'none',
})

const dashboardCardLabelStyle = {
  position: 'relative',
  margin: 0,
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

const dashboardCardValueStyle = {
  position: 'relative',
  margin: '12px 0 0',
  color: '#10233e',
  fontSize: '36px',
  lineHeight: 1,
  letterSpacing: '-0.06em',
  fontWeight: 900,
}

const dashboardCardTextStyle = {
  position: 'relative',
  margin: '8px 0 0',
  color: '#49627f',
  fontSize: '14px',
  lineHeight: 1.5,
  fontWeight: 700,
}

const workStatusTableStyle = {
  gridColumn: '1 / -1',
  padding: '16px',
  borderRadius: '24px',
  background: '#ffffff',
  border: '1px solid rgba(216, 225, 238, 0.9)',
  boxShadow: '0 18px 38px rgba(24, 58, 110, 0.08)',
}

const workStatusTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '18px',
  lineHeight: 1.1,
  letterSpacing: '-0.04em',
  fontWeight: 900,
}

const workStatusListStyle = {
  display: 'grid',
  gap: '8px',
  marginTop: '12px',
}

const workStatusRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '12px',
  alignItems: 'center',
  padding: '10px 12px',
  borderRadius: '14px',
  background: 'rgba(37, 99, 235, 0.05)',
}

const workStatusNameStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: '#10233e',
  fontSize: '13px',
  fontWeight: 900,
}

const workStatusBadgeStyle = submitted => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  padding: '7px 10px',
  borderRadius: '999px',
  color: submitted ? '#166534' : '#b42318',
  background: submitted ? 'rgba(34, 197, 94, 0.14)' : 'rgba(244, 63, 94, 0.12)',
  fontSize: '12px',
  fontWeight: 900,
})

const workStatusDotStyle = submitted => ({
  width: '8px',
  height: '8px',
  borderRadius: '999px',
  background: submitted ? '#22c55e' : '#ef4444',
})

const workStatusEmptyStyle = {
  margin: '12px 0 0',
  padding: '14px 16px',
  borderRadius: '14px',
  background: 'rgba(37, 99, 235, 0.05)',
  color: '#49627f',
  fontSize: '13px',
  lineHeight: 1.5,
  fontWeight: 800,
}

const notificationCenterStyle = {
  display: 'grid',
  gap: '10px',
  minHeight: 0,
  padding: '14px',
  borderRadius: '24px',
  background: '#ffffff',
  border: '1px solid rgba(216, 225, 238, 0.9)',
  boxShadow: '0 18px 38px rgba(24, 58, 110, 0.08)',
}

const sidePanelStackStyle = {
  display: 'grid',
  gap: '14px',
  minHeight: 0,
}

const notificationHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
}

const notificationTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '18px',
  lineHeight: 1.1,
  letterSpacing: '-0.04em',
  fontWeight: 900,
}

const notificationBadgeStyle = {
  minWidth: '28px',
  height: '28px',
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: '999px',
  background: '#ff8c00',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 900,
}

const notificationListStyle = {
  display: 'grid',
  gap: '8px',
  maxHeight: '126px',
  overflow: 'hidden',
}

const notificationItemStyle = {
  padding: '10px 12px',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.07) 0%, rgba(255, 140, 0, 0.08) 100%)',
  border: '1px solid rgba(216, 225, 238, 0.82)',
}

const notificationMetaStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '11px',
  lineHeight: 1.4,
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const notificationTextStyle = {
  margin: '6px 0 0',
  color: '#10233e',
  fontSize: '13px',
  lineHeight: 1.45,
  fontWeight: 800,
}

const notificationEmptyStyle = {
  margin: 0,
  padding: '18px',
  borderRadius: '18px',
  color: '#64748b',
  background: 'rgba(37, 99, 235, 0.06)',
  fontWeight: 800,
  lineHeight: 1.5,
}

const responsavelNotificationCenterStyle = {
  padding: '10px',
  gap: '6px',
}

const responsavelNotificationHeaderStyle = {
  gap: '8px',
}

const responsavelNotificationTitleStyle = {
  fontSize: '15px',
}

const responsavelNotificationBadgeStyle = {
  minWidth: '22px',
  height: '22px',
  fontSize: '11px',
}

const responsavelNotificationListStyle = {
  gap: '5px',
  maxHeight: '92px',
}

const responsavelNotificationItemStyle = {
  padding: '7px 9px',
  borderRadius: '12px',
}

const responsavelNotificationMetaStyle = {
  fontSize: '10px',
  lineHeight: 1.2,
}

const responsavelNotificationTextStyle = {
  margin: '3px 0 0',
  fontSize: '11px',
  lineHeight: 1.25,
}

const responsavelNotificationEmptyStyle = {
  padding: '12px',
  borderRadius: '14px',
  fontSize: '11px',
  lineHeight: 1.3,
}

const calendarCardStyle = {
  display: 'grid',
  gap: '10px',
  padding: '14px',
  borderRadius: '24px',
  background: '#ffffff',
  border: '1px solid rgba(216, 225, 238, 0.9)',
  boxShadow: '0 18px 38px rgba(24, 58, 110, 0.08)',
}

const calendarHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
}

const calendarTitleWrapStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const calendarTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '18px',
  lineHeight: 1.1,
  letterSpacing: '-0.04em',
  fontWeight: 900,
}

const calendarMonthStyle = {
  margin: 0,
  color: '#2563eb',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const calendarTodayCardStyle = {
  display: 'grid',
  gap: '4px',
  padding: '14px',
  borderRadius: '18px',
  background: '#ffffff',
  border: '2px solid transparent',
  backgroundImage: 'linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #2563eb 0%, #ff8c00 100%)',
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',
  color: '#10233e',
}

const calendarTodayDayStyle = {
  fontSize: '36px',
  lineHeight: 1,
  letterSpacing: '-0.06em',
  fontWeight: 900,
}

const calendarTodayTextStyle = {
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  opacity: 0.88,
}

const nextEventStyle = {
  margin: 0,
  padding: '10px 12px',
  borderRadius: '14px',
  background: 'rgba(255, 140, 0, 0.12)',
  color: '#9a4b00',
  fontSize: '12px',
  lineHeight: 1.45,
  fontWeight: 900,
}

const responsavelCalendarCardStyle = {
  ...calendarCardStyle,
  position: 'relative',
  gridColumn: '1 / -1',
  padding: '18px',
  minHeight: '218px',
  alignItems: 'stretch',
}

const responsavelCalendarBadgeWrapStyle = {
  position: 'absolute',
  top: '14px',
  right: '14px',
  zIndex: 1,
}

const responsavelCalendarCopyStyle = {
  display: 'grid',
  gap: '12px',
  alignContent: 'start',
}

const responsavelCalendarAgendaStyle = {
  display: 'grid',
  gap: '10px',
}

const responsavelCalendarSectionStyle = tone => ({
  display: 'grid',
  gap: '8px',
  padding: '12px',
  borderRadius: '18px',
  background: tone === 'today'
    ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.16) 0%, rgba(239, 246, 255, 0.96) 100%)'
    : 'linear-gradient(135deg, rgba(255, 140, 0, 0.16) 0%, rgba(255, 247, 237, 0.96) 100%)',
  border: tone === 'today'
    ? '1px solid rgba(147, 197, 253, 0.92)'
    : '1px solid rgba(253, 186, 116, 0.92)',
  boxShadow: tone === 'today'
    ? 'inset 0 1px 0 rgba(255,255,255,0.48)'
    : 'inset 0 1px 0 rgba(255,255,255,0.52)',
})

const responsavelCalendarSectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
}

const responsavelCalendarSectionTitleStyle = tone => ({
  margin: 0,
  color: tone === 'today' ? '#173b70' : '#9a4b00',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
})

const responsavelCalendarSectionDateStyle = tone => ({
  margin: 0,
  color: tone === 'today' ? '#315b93' : '#b45309',
  fontSize: '12px',
  fontWeight: 800,
})

const responsavelCalendarEventsListStyle = {
  display: 'grid',
  gap: '8px',
}

const responsavelCalendarEventStyle = tone => ({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  gap: '10px',
  alignItems: 'start',
  padding: '10px 12px',
  borderRadius: '14px',
  background: 'rgba(255, 255, 255, 0.96)',
  border: tone === 'today'
    ? '1px solid rgba(191, 219, 254, 0.96)'
    : '1px solid rgba(253, 186, 116, 0.96)',
  boxShadow: tone === 'today'
    ? '0 10px 24px rgba(37, 99, 235, 0.08)'
    : '0 10px 24px rgba(255, 140, 0, 0.08)',
})

const responsavelCalendarEventTimeStyle = tone => ({
  minWidth: '54px',
  padding: '6px 8px',
  borderRadius: '999px',
  background: tone === 'today'
    ? 'rgba(37, 99, 235, 0.12)'
    : 'rgba(255, 140, 0, 0.14)',
  color: tone === 'today' ? '#1d4ed8' : '#9a4b00',
  fontSize: '11px',
  lineHeight: 1,
  fontWeight: 900,
  textAlign: 'center',
})

const responsavelCalendarEventTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '13px',
  lineHeight: 1.35,
  fontWeight: 800,
}

const responsavelCalendarEventMetaStyle = {
  margin: '4px 0 0',
  color: '#64748b',
  fontSize: '12px',
  lineHeight: 1.4,
}

const responsavelCalendarEmptyStyle = tone => ({
  margin: 0,
  padding: '10px 12px',
  borderRadius: '14px',
  background: 'rgba(255, 255, 255, 0.82)',
  border: tone === 'today'
    ? '1px dashed rgba(96, 165, 250, 0.54)'
    : '1px dashed rgba(251, 146, 60, 0.54)',
  color: tone === 'today' ? '#315b93' : '#b45309',
  fontSize: '12px',
  lineHeight: 1.45,
  fontWeight: 700,
})

const responsavelCalendarTodayStyle = {
  ...calendarTodayCardStyle,
  padding: '12px 14px',
  border: '2px solid transparent',
  background: '#ffffff',
  backgroundImage: 'linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #2563eb 0%, #ff8c00 100%)',
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',
  alignSelf: 'center',
  alignContent: 'start',
  justifyItems: 'start',
}

const heroMetaGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 1fr)',
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
  gap: '14px',
  alignItems: 'stretch',
}

const cardStyle = accent => ({
  position: 'relative',
  overflow: 'hidden',
  display: 'grid',
  gap: '16px',
  minHeight: '145px',
  padding: '18px',
  borderRadius: '26px',
  background: 'var(--vp-surface-soft-strong)',
  border: '1px solid var(--vp-border)',
  boxShadow: '0 22px 48px rgba(24, 58, 110, 0.1)',
  textDecoration: 'none',
  color: 'inherit',
  cursor: 'pointer',
})

const responsavelMainCardStyle = {
  minHeight: '96px',
  padding: '14px 16px',
}

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
  fontSize: '24px',
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

function getTodayDate() {
  return new Intl.DateTimeFormat('sv-SE').format(new Date())
}

function formatCurrency(value) {
  const normalizedValue = Number.isFinite(Number(value)) ? Number(value) : 0

  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(normalizedValue)
}

function getTodayLabel() {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function getMonthLabel() {
  return new Intl.DateTimeFormat('pt-PT', {
    month: 'long',
    year: 'numeric',
  }).format(new Date()).replace(' de ', ' ')
}

function formatDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function getSmallCalendarSummary() {
  const now = new Date()
  const tomorrow = addDays(now, 1)
  const holidays = {
    ...getBelgianHolidays(now.getFullYear()),
    ...getBelgianHolidays(tomorrow.getFullYear()),
  }
  const tomorrowKey = formatDateKey(tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate())

  return {
    day: now.getDate(),
    weekday: new Intl.DateTimeFormat('pt-PT', { weekday: 'long' }).format(now),
    showTomorrow: now.getHours() >= 12,
    tomorrowLabel: new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' }).format(tomorrow),
    tomorrowEvent: holidays[tomorrowKey] || '',
  }
}

const travelAirportLabels = {
  zaventem: 'Zaventem',
  charleroi: 'Charleroi',
  'bruxelles-midi': 'Bruxelles-Midi',
  outro: 'Outro',
}

function formatAgendaDateLabel(date) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

function getAgendaRouteLabel(event, type) {
  const airportLabel = travelAirportLabels[event.airport] || 'Origem'
  const destinationLabel = event.destination || 'Destino por definir'

  if (type === 'arrival') {
    return `${destinationLabel} -> ${airportLabel}`
  }

  return `${airportLabel} -> ${destinationLabel}`
}

async function getResponsavelCalendarAgenda() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = addDays(today, 1)
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const tomorrowKey = formatDateKey(tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate())

  const agendaEntries = (await getAllCalendarEvents())
    .filter(event => event.type === 'viagem')
    .flatMap(event => {
      const departureDate = String(event.departureDate || event.date || '').trim()
      const arrivalDate = String(event.arrivalDate || '').trim()
      const entries = []

      if (departureDate) {
        entries.push({
          id: `${event.id}-departure`,
          dateKey: departureDate,
          time: event.departureTime || '--:--',
          sortTime: event.departureTime || '99:99',
          title: event.title || 'Viagem',
          meta: getAgendaRouteLabel(event, 'departure'),
        })
      }

      if (arrivalDate && arrivalDate !== departureDate) {
        entries.push({
          id: `${event.id}-arrival`,
          dateKey: arrivalDate,
          time: event.arrivalTime || '--:--',
          sortTime: event.arrivalTime || '99:99',
          title: `${event.title || 'Viagem'} · Regresso`,
          meta: getAgendaRouteLabel(event, 'arrival'),
        })
      }

      return entries
    })
    .sort((left, right) => (
      left.dateKey.localeCompare(right.dateKey) ||
      left.sortTime.localeCompare(right.sortTime) ||
      left.title.localeCompare(right.title, 'pt-PT')
    ))

  return {
    showTomorrow: now.getHours() >= 12,
    todayLabel: formatAgendaDateLabel(today),
    tomorrowLabel: formatAgendaDateLabel(tomorrow),
    todayEntries: agendaEntries.filter(entry => entry.dateKey === todayKey),
    tomorrowEntries: agendaEntries.filter(entry => entry.dateKey === tomorrowKey),
  }
}

function formatNotificationDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

async function getRecentNotifications() {
  const notes = await getAllDailyWorkNotesData()

  return notes
    .filter(note => note.note)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 3)
    .map(note => ({
      id: note.id,
      chef: note.authorName || 'Chefe',
      work: note.work?.name || `Obra ${note.workId}`,
      date: formatNotificationDate(note.date),
      note: note.note.length > 92 ? `${note.note.slice(0, 92)}...` : note.note,
    }))
}

async function getCalendarOverview(username) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const events = (await getAllCalendarEvents({ year, month })).filter(event => event.type === 'viagem')
  const notificationState = await getCalendarNotificationState(username)
  const lastSeenAt = notificationState?.seenAt ? new Date(notificationState.seenAt).getTime() : 0
  const unseenEventsCount = events.filter(event => {
    const activityAt = new Date(event.updatedAt || event.createdAt || 0).getTime()
    return activityAt > lastSeenAt
  }).length

  return {
    unseenEventsCount,
  }
}

async function getDashboardStats() {
  const people = await getAllPeopleData()
  const currentYear = new Date().getFullYear()
  const yearAssignments = (await getAllWorkAssignmentsData()).filter(assignment => {
    const assignmentYear = assignment.date ? new Date(`${assignment.date}T00:00:00`).getFullYear() : null
    return assignmentYear === currentYear
  })
  const approvedBilling = yearAssignments
    .filter(assignment => isAssignmentApproved(assignment))
    .reduce((sum, assignment) => {
      const approvedHours = Number(assignment.approvedHours)
      const hourlyCost = Number(assignment.hourlyCost)

      if (!Number.isFinite(approvedHours) || !Number.isFinite(hourlyCost)) {
        return sum
      }

      return sum + Number((approvedHours * hourlyCost).toFixed(2))
    }, 0)

  return [
    {
      label: 'Pessoas',
      value: people.length,
      text: 'recursos registados na aplicação',
      glow: 'radial-gradient(circle, #ff8c00 0%, transparent 70%)',
    },
    {
      label: 'Faturação anual',
      value: formatCurrency(approvedBilling),
      text: `janeiro a dezembro de ${currentYear}`,
      glow: 'radial-gradient(circle, #fb923c 0%, transparent 70%)',
    },
  ]
}

async function getWorkSubmissionStatus() {
  const works = await getAllWorksData()
  const todayAssignments = await getAllWorkAssignmentsData({ date: getTodayDate() })

  return buildOperationalWorkStatuses(works, todayAssignments)
}

export default async function Home() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  if (isChefRole(session.role)) {
    redirect('/daily-hours')
  }

  const dashboardStats = (await getDashboardStats()).filter(item =>
    !isResponsavelRole(session.role) ||
    (item.label !== 'Faturação anual' && item.label !== 'Pessoas'),
  )
  const isResponsavel = isResponsavelRole(session.role)
  const workSubmissionStatus = await getWorkSubmissionStatus()
  const notifications = isResponsavel
    ? await getOperationNotifications({ audience: 'responsavel', limit: 3 })
    : await getRecentNotifications()
  const smallCalendar = getSmallCalendarSummary()
  const responsavelCalendarAgenda = await getResponsavelCalendarAgenda()
  const calendarOverview = await getCalendarOverview(session.username)
  const [notificationsCenterEnabled, calendarManagementEnabled] = await Promise.all([
    isFeatureEnabled('notificationsCenter'),
    isFeatureEnabled('calendarManagement'),
  ])
  const visibleModules = isResponsavelRole(session.role)
    ? modules.filter(module => module.href === '/people')
    : modules

  return (
    <BentixPage padding="tight" style={pageStyle}>
      <BentixContent width="dashboard" gap="md" style={containerStyle}>
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
              <div style={accountClusterStyle}>
                <span style={accountNamePillStyle}>{session.name}</span>
                <details style={accountMenuStyle}>
                  <summary style={accountMenuButtonStyle} aria-label="Abrir menu da conta">
                    <span style={dotsStyle} aria-hidden="true">
                      <span style={dotStyle} />
                      <span style={dotStyle} />
                      <span style={dotStyle} />
                    </span>
                </summary>
                <div style={accountMenuPanelStyle}>
                  <Link href="/account-settings" style={accountMenuLinkStyle}>
                    Definições
                  </Link>
                    <div style={{ marginTop: '8px' }}>
                      <LogoutButton
                        style={{
                          ...accountMenuLinkStyle,
                          width: '100%',
                          boxShadow: 'none',
                        }}
                      />
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <div style={heroGridStyle}>
              <div style={heroCopyStyle}>
                <h1 style={heroTitleStyle}>
                  Centro de gestão <span style={{ color: '#ff8c00' }}>operacional</span>
                </h1>
              </div>

            </div>
          </div>
        </section>

        <div style={{ display: 'grid', gap: '16px' }}>
        <section style={dashboardSectionStyle}>
          <div style={dashboardHeaderStyle}>
            <div>
              <h2 style={dashboardTitleStyle}>Visão geral da operação</h2>
            </div>
          </div>

          <BentixResponsiveGrid preset="dashboard-main" style={isResponsavel ? responsavelDashboardBodyStyle : dashboardBodyStyle}>
            <BentixResponsiveGrid preset="dashboard-cards" style={dashboardGridStyle}>
              {!isResponsavel && (
                <div style={workStatusTableStyle}>
                  <h3 style={workStatusTitleStyle}>Estado operacional</h3>
                  {workSubmissionStatus.length > 0 ? (
                    <div style={workStatusListStyle}>
                      {workSubmissionStatus.map(work => (
                        <div key={work.id} style={workStatusRowStyle}>
                          <span style={workStatusNameStyle}>{work.name}</span>
                          <span style={workStatusBadgeStyle(work.submitted)}>
                            <span style={workStatusDotStyle(work.submitted)} />
                            {work.submitted ? 'Submetido' : 'Não Submetido'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={workStatusEmptyStyle}>Sem obras com pessoal afeto no plano diário de hoje.</p>
                  )}
                </div>
              )}

              {isResponsavel && calendarManagementEnabled ? (
                <Link
                  href="/calendar"
                  className="btx-dashboard-responsavel-calendar"
                  style={{ ...responsavelCalendarCardStyle, textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={responsavelCalendarBadgeWrapStyle}>
                    <span style={notificationBadgeStyle}>{calendarOverview.unseenEventsCount}</span>
                  </div>
                  <div style={responsavelCalendarCopyStyle}>
                    <div style={calendarHeaderStyle}>
                      <div style={calendarTitleWrapStyle}>
                        <h3 style={calendarTitleStyle}>Calendário</h3>
                      </div>
                    </div>
                    <div style={responsavelCalendarAgendaStyle}>
                      <div style={responsavelCalendarSectionStyle('today')}>
                        <div style={responsavelCalendarSectionHeaderStyle}>
                          <p style={responsavelCalendarSectionTitleStyle('today')}>Hoje</p>
                          <p style={responsavelCalendarSectionDateStyle('today')}>{responsavelCalendarAgenda.todayLabel}</p>
                        </div>
                        {responsavelCalendarAgenda.todayEntries.length > 0 ? (
                          <div style={responsavelCalendarEventsListStyle}>
                            {responsavelCalendarAgenda.todayEntries.map(entry => (
                              <div key={entry.id} style={responsavelCalendarEventStyle('today')}>
                                <span style={responsavelCalendarEventTimeStyle('today')}>{entry.time}</span>
                                <div>
                                  <p style={responsavelCalendarEventTitleStyle}>{entry.title}</p>
                                  <p style={responsavelCalendarEventMetaStyle}>{entry.meta}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={responsavelCalendarEmptyStyle('today')}>Sem eventos registados para hoje.</p>
                        )}
                      </div>

                      {responsavelCalendarAgenda.showTomorrow ? (
                        <div style={responsavelCalendarSectionStyle('tomorrow')}>
                          <div style={responsavelCalendarSectionHeaderStyle}>
                            <p style={responsavelCalendarSectionTitleStyle('tomorrow')}>Amanhã</p>
                            <p style={responsavelCalendarSectionDateStyle('tomorrow')}>{responsavelCalendarAgenda.tomorrowLabel}</p>
                          </div>
                          {responsavelCalendarAgenda.tomorrowEntries.length > 0 ? (
                            <div style={responsavelCalendarEventsListStyle}>
                              {responsavelCalendarAgenda.tomorrowEntries.map(entry => (
                                <div key={entry.id} style={responsavelCalendarEventStyle('tomorrow')}>
                                  <span style={responsavelCalendarEventTimeStyle('tomorrow')}>{entry.time}</span>
                                  <div>
                                    <p style={responsavelCalendarEventTitleStyle}>{entry.title}</p>
                                    <p style={responsavelCalendarEventMetaStyle}>{entry.meta}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={responsavelCalendarEmptyStyle('tomorrow')}>Sem eventos registados para amanhã.</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div style={responsavelCalendarTodayStyle}>
                    <span style={calendarTodayTextStyle}>Hoje · {smallCalendar.weekday}</span>
                    <span style={calendarTodayDayStyle}>{smallCalendar.day}</span>
                    <span style={{ ...calendarMonthStyle, color: '#64748b' }}>{getTodayLabel()}</span>
                  </div>
                </Link>
              ) : null}

              {dashboardStats.map(item => (
                <article key={item.label} style={dashboardCardStyle}>
                  <div style={dashboardCardGlowStyle(item.glow)} />
                  <p style={dashboardCardLabelStyle}>{item.label}</p>
                  <p style={dashboardCardValueStyle}>{item.value}</p>
                  <p style={dashboardCardTextStyle}>{item.text}</p>
                </article>
              ))}
            </BentixResponsiveGrid>

            <div style={sidePanelStackStyle}>
              {notificationsCenterEnabled ? (
                <Link
                  href="/notifications"
                  style={{
                    ...notificationCenterStyle,
                    ...(isResponsavel ? responsavelNotificationCenterStyle : {}),
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ ...notificationHeaderStyle, ...(isResponsavel ? responsavelNotificationHeaderStyle : {}) }}>
                    <h3 style={{ ...notificationTitleStyle, ...(isResponsavel ? responsavelNotificationTitleStyle : {}) }}>
                      Central de notificações
                    </h3>
                    <span style={{ ...notificationBadgeStyle, ...(isResponsavel ? responsavelNotificationBadgeStyle : {}) }}>
                      {notifications.length}
                    </span>
                  </div>

                  {notifications.length > 0 ? (
                    <div style={{ ...notificationListStyle, ...(isResponsavel ? responsavelNotificationListStyle : {}) }}>
                      {notifications.map(notification => (
                        <article
                          key={notification.id}
                          style={{ ...notificationItemStyle, ...(isResponsavel ? responsavelNotificationItemStyle : {}) }}
                        >
                          <p style={{ ...notificationMetaStyle, ...(isResponsavel ? responsavelNotificationMetaStyle : {}) }}>
                            {notification.date} - {notification.chef} - {notification.work}
                          </p>
                          <p style={{ ...notificationTextStyle, ...(isResponsavel ? responsavelNotificationTextStyle : {}) }}>
                            {notification.note}
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p style={{ ...notificationEmptyStyle, ...(isResponsavel ? responsavelNotificationEmptyStyle : {}) }}>
                      {isResponsavel
                        ? 'Ainda não existem alertas de documentos ativos.'
                        : 'Ainda não existem notas novas dos chefes.'}
                    </p>
                  )}
                </Link>
              ) : (
                <div style={notificationCenterStyle}>
                  <div style={notificationHeaderStyle}>
                    <h3 style={notificationTitleStyle}>Central de notificações</h3>
                    <span style={{ ...notificationBadgeStyle, background: '#94a3b8' }}>Off</span>
                  </div>
                  <p style={notificationEmptyStyle}>Funcionalidade desativada no painel do programador.</p>
                </div>
              )}

              {!isResponsavel && calendarManagementEnabled ? (
                <Link href="/calendar" style={{ ...calendarCardStyle, textDecoration: 'none', color: 'inherit' }}>
                  <div style={calendarHeaderStyle}>
                    <div style={calendarTitleWrapStyle}>
                      <h3 style={calendarTitleStyle}>Calendário</h3>
                    </div>
                    <span style={notificationBadgeStyle}>{calendarOverview.unseenEventsCount}</span>
                  </div>
                  <div style={calendarTodayCardStyle}>
                    <span style={calendarTodayTextStyle}>Hoje · {smallCalendar.weekday}</span>
                    <span style={calendarTodayDayStyle}>{smallCalendar.day}</span>
                  </div>
                  {smallCalendar.showTomorrow && (
                    <p style={nextEventStyle}>
                      Amanhã · {smallCalendar.tomorrowLabel}: {smallCalendar.tomorrowEvent || 'sem eventos registados'}
                    </p>
                  )}
                </Link>
              ) : !isResponsavel ? (
                <div style={calendarCardStyle}>
                  <div style={calendarHeaderStyle}>
                    <h3 style={calendarTitleStyle}>Calendário</h3>
                    <p style={{ ...calendarMonthStyle, color: '#64748b' }}>Desativado</p>
                  </div>
                  <p style={notificationEmptyStyle}>O calendario foi desativado no painel do programador.</p>
                </div>
              ) : null}
            </div>
          </BentixResponsiveGrid>
        </section>

        <BentixResponsiveGrid as="section" preset="cards" style={cardsStyle}>
          {visibleModules.map(module => (
            <Link
              key={module.href}
              href={module.href}
              style={isResponsavel ? { ...cardStyle(module.accent), ...responsavelMainCardStyle } : cardStyle(module.accent)}
            >
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
        </BentixResponsiveGrid>
        </div>
      </BentixContent>
    </BentixPage>
  )
}
