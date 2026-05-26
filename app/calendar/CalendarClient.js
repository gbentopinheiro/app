'use client'

import { useEffect, useMemo, useState } from 'react'
import EditPencilIcon, { editPencilButtonStyle } from '../components/EditPencilIcon'
import { getBelgianHolidays } from '../../lib/belgian-holidays.js'

const eventTypeOptions = [
  { label: 'Viagem', value: 'viagem' },
]

const travelTransportOptions = [
  { label: 'Comboio', value: 'comboio', emoji: '🚆' },
  { label: 'Avião', value: 'aviao', emoji: '✈️' },
]

const travelAirportOptions = [
  { label: 'Zaventem', value: 'zaventem', color: '#16a34a' },
  { label: 'Charleroi', value: 'charleroi', color: '#2563eb' },
  { label: 'Bruxelles-Midi', value: 'bruxelles-midi', color: '#dc2626' },
  { label: 'Outro', value: 'outro', color: '#111111' },
]

const calendarCardStyle = {
  padding: '24px',
  borderRadius: '30px',
  background: 'var(--vp-surface-soft-strong)',
  border: '1px solid var(--vp-border)',
  boxShadow: 'var(--vp-shadow-panel)',
}

const monthLabelStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '28px',
  lineHeight: 1,
  letterSpacing: '-0.04em',
  fontWeight: 900,
  textTransform: 'capitalize',
}

const monthSwitcherStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '12px',
  justifyContent: 'center',
  width: 'fit-content',
  marginInline: 'auto',
  padding: '10px 14px',
  borderRadius: '999px',
  background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.16) 0%, rgba(255, 237, 213, 0.92) 100%)',
  border: '1px solid rgba(255, 140, 0, 0.22)',
  boxShadow: '0 16px 34px rgba(255, 140, 0, 0.12)',
  lineHeight: 1,
}

const monthNavButtonStyle = {
  width: '46px',
  height: '46px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(255, 140, 0, 0.35)',
  borderRadius: '999px',
  padding: 0,
  background: '#fff7ed',
  color: '#c2410c',
  fontSize: '22px',
  fontWeight: 900,
  lineHeight: 1,
  cursor: 'pointer',
  boxShadow: '0 10px 22px rgba(255, 140, 0, 0.16)',
}

const monthBadgeStyle = {
  minHeight: '52px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '210px',
  padding: '0 22px',
  borderRadius: '999px',
  border: '1px solid rgba(255, 140, 0, 0.4)',
  background: 'linear-gradient(135deg, #ffedd5 0%, #ffffff 52%, #fff7ed 100%)',
  color: '#9a3412',
  fontSize: '18px',
  letterSpacing: '-0.02em',
  fontWeight: 950,
  textTransform: 'capitalize',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.82), 0 12px 26px rgba(255, 140, 0, 0.12)',
  cursor: 'pointer',
}

const monthPickerWrapStyle = {
  position: 'relative',
}

const monthPickerPopoverStyle = {
  position: 'absolute',
  top: 'calc(100% + 12px)',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 20,
  width: 'min(360px, 92vw)',
  padding: '16px',
  borderRadius: '24px',
  border: '1px solid rgba(255, 140, 0, 0.22)',
  background: 'linear-gradient(180deg, #fffdf9 0%, #fff7ed 100%)',
  boxShadow: '0 24px 60px rgba(255, 140, 0, 0.18)',
}

const monthPickerHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  marginBottom: '14px',
}

const monthPickerYearStyle = {
  margin: 0,
  color: '#9a3412',
  fontSize: '18px',
  fontWeight: 950,
  letterSpacing: '-0.03em',
}

const monthGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '10px',
}

const monthOptionStyle = isSelected => ({
  minHeight: '44px',
  border: isSelected ? '1px solid #ea580c' : '1px solid rgba(255, 140, 0, 0.16)',
  borderRadius: '14px',
  background: isSelected ? 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)' : '#ffffff',
  color: isSelected ? '#ffffff' : '#9a3412',
  fontSize: '14px',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: isSelected ? '0 12px 24px rgba(249, 115, 22, 0.22)' : '0 8px 18px rgba(255, 140, 0, 0.08)',
})

const calendarTopBarStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '18px',
}

const topActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const leftTopActionsStyle = {
  ...topActionsStyle,
  justifyContent: 'flex-start',
}

const rightTopActionsStyle = {
  ...topActionsStyle,
  justifyContent: 'flex-end',
}

const addButtonStyle = {
  minHeight: '46px',
  border: 0,
  borderRadius: '14px',
  padding: '0 18px',
  background: 'linear-gradient(135deg, #2563eb 0%, #ff8c00 100%)',
  color: '#ffffff',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 16px 34px rgba(37, 99, 235, 0.2)',
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: '10px',
}

const weekdayStyle = {
  padding: '12px',
  borderRadius: '16px',
  background: 'rgba(37, 99, 235, 0.08)',
  color: '#1e3a8a',
  fontWeight: 900,
  textAlign: 'center',
  textTransform: 'uppercase',
}

const dayStyle = (isToday, isHoliday) => ({
  minHeight: '110px',
  padding: '14px',
  borderRadius: '20px',
  background: isToday ? 'linear-gradient(135deg, #2563eb 0%, #ff8c00 100%)' : isHoliday ? 'rgba(255, 140, 0, 0.1)' : '#ffffff',
  border: isToday ? 'none' : isHoliday ? '1px solid rgba(255, 140, 0, 0.42)' : '1px solid var(--vp-border)',
  color: isToday ? '#ffffff' : '#10233e',
  fontSize: '22px',
  fontWeight: 900,
  boxShadow: isToday ? '0 18px 38px rgba(37, 99, 235, 0.22)' : '0 12px 28px rgba(24, 58, 110, 0.08)',
})

const dayNumberStyle = {
  display: 'block',
}

const holidayLabelStyle = isToday => ({
  display: 'inline-flex',
  marginTop: '12px',
  maxWidth: '100%',
  padding: '6px 8px',
  borderRadius: '999px',
  background: isToday ? 'rgba(255,255,255,0.18)' : 'rgba(255, 140, 0, 0.16)',
  color: isToday ? '#ffffff' : '#9a4b00',
  fontSize: '11px',
  lineHeight: 1.2,
  fontWeight: 900,
})

const eventLabelStyle = (isToday, color = '#2563eb') => ({
  display: 'block',
  width: '100%',
  marginTop: '8px',
  padding: '7px 9px',
  borderRadius: '12px',
  background: isToday ? 'rgba(255,255,255,0.86)' : '#ffffff',
  border: `2px solid ${color}`,
  color: '#10233e',
  textAlign: 'left',
  fontSize: '12px',
  lineHeight: 1.25,
  fontWeight: 900,
  boxShadow: `0 10px 22px ${color}22`,
  cursor: 'pointer',
})

const eventTitleStyle = {
  display: 'block',
}

const eventDetailStyle = {
  display: 'block',
  marginTop: '4px',
  color: '#475569',
  fontSize: '10px',
  lineHeight: 1.25,
  fontWeight: 800,
}

const emptyDayStyle = {
  minHeight: '110px',
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'grid',
  placeItems: 'center',
  padding: '20px',
  background: 'rgba(7, 18, 38, 0.58)',
  backdropFilter: 'blur(8px)',
}

const modalStyle = {
  position: 'relative',
  width: 'min(460px, 100%)',
  padding: '28px',
  borderRadius: '26px',
  background: '#ffffff',
  border: '1px solid rgba(216, 225, 238, 0.95)',
  boxShadow: '0 28px 80px rgba(7, 18, 38, 0.34)',
}

const modalHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  marginBottom: '22px',
}

const closeButtonStyle = {
  flex: '0 0 auto',
  width: '34px',
  height: '34px',
  border: '1px solid #d8e1ee',
  borderRadius: '999px',
  background: '#ffffff',
  color: '#10233e',
  fontSize: '18px',
  fontWeight: 900,
  cursor: 'pointer',
  lineHeight: 1,
}

const modalTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '26px',
  letterSpacing: '-0.04em',
  fontWeight: 900,
}

const labelStyle = {
  display: 'grid',
  gap: '8px',
  marginBottom: '16px',
  color: '#10233e',
  fontSize: '14px',
  fontWeight: 900,
}

const inputStyle = {
  width: '100%',
  minHeight: '50px',
  boxSizing: 'border-box',
  border: '1px solid #d8e1ee',
  borderRadius: '14px',
  padding: '0 14px',
  color: '#10233e',
  fontSize: '15px',
  fontWeight: 700,
  outline: 'none',
}

const fixedTypeStyle = {
  minHeight: '50px',
  display: 'flex',
  alignItems: 'center',
  boxSizing: 'border-box',
  border: '1px solid #d8e1ee',
  borderRadius: '14px',
  padding: '0 14px',
  background: 'rgba(37, 99, 235, 0.06)',
  color: '#10233e',
  fontSize: '15px',
  fontWeight: 900,
}

const optionRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
}

const optionButtonStyle = isSelected => ({
  minHeight: '38px',
  border: isSelected ? '2px solid #10233e' : '1px solid #d8e1ee',
  borderRadius: '999px',
  padding: '0 14px',
  background: isSelected ? 'rgba(37, 99, 235, 0.08)' : '#ffffff',
  color: '#10233e',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: isSelected ? '0 10px 22px rgba(24, 58, 110, 0.12)' : 'none',
})

const airportButtonStyle = (color, isSelected) => ({
  ...optionButtonStyle(isSelected),
  border: isSelected ? `2px solid ${color}` : '1px solid #d8e1ee',
  boxShadow: isSelected ? `0 0 0 3px ${color}22, 0 10px 22px ${color}22` : 'none',
})

const airportDotStyle = color => ({
  width: '10px',
  height: '10px',
  display: 'inline-block',
  marginRight: '8px',
  borderRadius: '999px',
  background: color,
})

const errorStyle = {
  margin: '0 0 14px',
  padding: '10px 12px',
  borderRadius: '12px',
  background: 'rgba(220, 38, 38, 0.09)',
  color: '#991b1b',
  fontWeight: 800,
}

const detailPanelStyle = {
  display: 'grid',
  gap: '10px',
  padding: '14px',
  borderRadius: '18px',
  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(255, 140, 0, 0.07) 100%)',
  border: '1px solid rgba(216, 225, 238, 0.9)',
}

const detailRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '14px',
  color: '#10233e',
  fontSize: '14px',
  lineHeight: 1.35,
}

const detailLabelStyle = {
  color: '#64748b',
  fontWeight: 900,
}

const detailValueStyle = {
  textAlign: 'right',
  fontWeight: 900,
}

const modalActionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '22px',
}

const detailActionsStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '12px',
  marginTop: '22px',
}

const iconActionButtonStyle = color => ({
  width: '46px',
  height: '46px',
  border: `1px solid ${color}33`,
  borderRadius: '999px',
  background: '#ffffff',
  color,
  fontSize: '20px',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: `0 12px 26px ${color}22`,
})

const secondaryButtonStyle = {
  minHeight: '44px',
  border: '1px solid #d8e1ee',
  borderRadius: '13px',
  padding: '0 16px',
  background: '#ffffff',
  color: '#10233e',
  fontWeight: 900,
  cursor: 'pointer',
}

const primaryButtonStyle = {
  ...addButtonStyle,
  minHeight: '44px',
  boxShadow: '0 14px 30px rgba(255, 140, 0, 0.2)',
}

function getDefaultFormData(todayDate) {
  const defaultAirport = travelAirportOptions[1]

  return {
    date: todayDate,
    departureDate: todayDate,
    arrivalDate: todayDate,
    title: '',
    type: eventTypeOptions[0].value,
    transport: 'aviao',
    airport: defaultAirport.value,
    destination: '',
    color: defaultAirport.color,
    departureTime: '',
    arrivalTime: '',
  }
}

function getAirportColor(airport, fallbackColor) {
  return travelAirportOptions.find(option => option.value === airport)?.color || fallbackColor || '#2563eb'
}

function getTransportEmoji(transport) {
  if (transport === 'comboio') return '🚆'
  return '✈️'
}

function getAirportLabel(airport) {
  return travelAirportOptions.find(option => option.value === airport)?.label || 'Charleroi'
}

function getArrivalTitle(calendarEvent) {
  const destination = String(calendarEvent.destination || '').trim()
  return destination || calendarEvent.title
}

function getCalendarEventRoute(calendarEvent) {
  const departureLabel = getAirportLabel(calendarEvent.airport)
  const destinationLabel = String(calendarEvent.destination || '').trim() || '-'

  if (calendarEvent.calendarMoment === 'arrival') {
    return {
      origin: destinationLabel,
      destination: departureLabel,
    }
  }

  return {
    origin: departureLabel,
    destination: destinationLabel,
  }
}

function formatTravelDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateString || '-'
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function normalizeLocationValue(value) {
  return String(value || '').trim().toLowerCase()
}

function summarizeNames(names) {
  const safeNames = Array.from(new Set((names || []).map(name => String(name || '').trim()).filter(Boolean)))

  if (safeNames.length === 0) return 'Sem nome'
  if (safeNames.length === 1) return safeNames[0]
  if (safeNames.length === 2) return `${safeNames[0]} + ${safeNames[1]}`
  return `${safeNames[0]} + ${safeNames.length - 1}`
}

function getCalendarEventDisplayTitle(calendarEvent) {
  if (calendarEvent.isMerged) {
    return summarizeNames(calendarEvent.mergedTitles)
  }

  return calendarEvent.calendarMoment === 'arrival' ? getArrivalTitle(calendarEvent) : calendarEvent.title
}

function getCalendarEventDetail(calendarEvent) {
  const { origin, destination } = getCalendarEventRoute(calendarEvent)

  if (calendarEvent.calendarMoment === 'arrival') {
    return `Chegada ${origin} -> ${destination} às ${calendarEvent.arrivalTime || '--:--'}`
  }

  return `Partida ${origin} -> ${destination} às ${calendarEvent.departureTime || '--:--'}`
}

function sortCalendarEntries(entries) {
  return [...entries].sort((left, right) => {
    const leftTime = left.calendarMoment === 'arrival' ? left.arrivalTime || '' : left.departureTime || ''
    const rightTime = right.calendarMoment === 'arrival' ? right.arrivalTime || '' : right.departureTime || ''

    if (leftTime !== rightTime) {
      return leftTime.localeCompare(rightTime)
    }

    return getCalendarEventDisplayTitle(left).localeCompare(getCalendarEventDisplayTitle(right), 'pt-PT')
  })
}

function buildMergedCalendarEvents(events) {
  const groupedEvents = {}

  events.forEach(event => {
    const departureDate = event.departureDate || event.date
    const arrivalDate = event.arrivalDate
    const calendarEntries = []

    if (departureDate) {
      calendarEntries.push({
        ...event,
        calendarMoment: 'departure',
        calendarDate: departureDate,
      })
    }

    if (arrivalDate && arrivalDate !== departureDate) {
      calendarEntries.push({
        ...event,
        calendarMoment: 'arrival',
        calendarDate: arrivalDate,
      })
    }

    calendarEntries.forEach(entry => {
      const dateKey = entry.calendarDate
      const timeKey = entry.calendarMoment === 'arrival' ? entry.arrivalTime || '' : entry.departureTime || ''
      const groupKey = [
        entry.calendarMoment,
        timeKey,
        normalizeLocationValue(entry.airport),
        normalizeLocationValue(entry.destination),
        normalizeLocationValue(entry.transport),
      ].join('|')

      const dayGroups = groupedEvents[dateKey] || new Map()
      const currentGroup = dayGroups.get(groupKey)

      if (!currentGroup) {
        dayGroups.set(groupKey, {
          ...entry,
          mergedTitles: [entry.title],
          mergedEventIds: [entry.id],
          mergedEvents: [entry],
          isMerged: false,
        })
      } else {
        currentGroup.mergedTitles.push(entry.title)
        currentGroup.mergedEventIds.push(entry.id)
        currentGroup.mergedEvents.push(entry)
        currentGroup.isMerged = true
      }

      groupedEvents[dateKey] = dayGroups
    })
  })

  return Object.fromEntries(
    Object.entries(groupedEvents).map(([dateKey, groupMap]) => [
      dateKey,
      sortCalendarEntries(
        Array.from(groupMap.values()).map(group => ({
          ...group,
          mergedTitles: Array.from(new Set(group.mergedTitles)),
          mergedEventIds: Array.from(new Set(group.mergedEventIds)),
          mergedEvents: group.mergedEvents,
          mergedCount: Array.from(new Set(group.mergedTitles)).length,
        })),
      ),
    ]),
  )
}

function chunkDays(days) {
  const weeks = []

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7))
  }

  return weeks
}

function formatWeekRange(days) {
  const realDays = days.filter(day => day?.date)

  if (realDays.length === 0) {
    return ''
  }

  return `${formatTravelDate(realDays[0].date)} - ${formatTravelDate(realDays[realDays.length - 1].date)}`
}

function buildWeekPrintDocument(weekDays, weekdays, eventsByDate, monthLabel) {
  const rangeLabel = formatWeekRange(weekDays)
  const colorLegend = travelAirportOptions
    .map(option => `
      <span class="legend-item">
        <span class="legend-dot" style="background: ${escapeHtml(option.color)};"></span>
        ${escapeHtml(option.label)}
      </span>
    `)
    .join('')
  const dayColumns = weekDays
    .map((day, index) => {
      if (!day?.day || !day?.date) {
        return `
          <section class="day-card empty">
            <div class="day-head">${escapeHtml(weekdays[index] || '')}</div>
            <p class="empty-text">Sem dia do mês.</p>
          </section>
        `
      }

      const dayEvents = eventsByDate[day.date] || []
      const eventsMarkup = dayEvents.length > 0
        ? dayEvents
          .map(calendarEvent => `
            <article class="event-card" style="border-color: ${escapeHtml(getAirportColor(calendarEvent.airport, calendarEvent.color))}; box-shadow: 0 8px 18px ${escapeHtml(getAirportColor(calendarEvent.airport, calendarEvent.color))}22;">
              <h3>${escapeHtml(`${getTransportEmoji(calendarEvent.transport)} ${getCalendarEventDisplayTitle(calendarEvent)}`)}</h3>
              <p>${escapeHtml(getCalendarEventDetail(calendarEvent))}</p>
              ${calendarEvent.isMerged ? `<p>${escapeHtml(calendarEvent.mergedTitles.join(', '))}</p>` : ''}
            </article>
          `)
          .join('')
        : '<p class="empty-text">Sem viagens planeadas.</p>'

      return `
        <section class="day-card">
          <div class="day-head">
            <span>${escapeHtml(weekdays[index] || '')}</span>
            <strong>${escapeHtml(String(day.day))}</strong>
          </div>
          ${eventsMarkup}
        </section>
      `
    })
    .join('')

  return `<!DOCTYPE html>
  <html lang="pt-PT">
    <head>
      <meta charset="utf-8" />
      <title>Plano semanal</title>
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; color: #10233e; background: #ffffff; }
        .shell { padding: 18px; }
        .header { text-align: center; margin-bottom: 18px; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 6px 0 0; font-size: 14px; font-weight: 700; }
        .legend { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
        .legend-item { display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 999px; border: 1px solid #dbe4ef; background: #ffffff; font-size: 12px; font-weight: 800; }
        .legend-dot { width: 12px; height: 12px; border-radius: 999px; display: inline-block; }
        .week-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 10px; }
        .day-card { min-height: 220px; border: 2px solid rgba(255, 140, 0, 0.55); border-radius: 16px; padding: 12px; background: #fff7ed; box-shadow: inset 0 0 0 1px rgba(255, 140, 0, 0.08); }
        .day-card.empty { background: #ffffff; }
        .day-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(255, 140, 0, 0.35); font-size: 12px; font-weight: 900; text-transform: uppercase; }
        .day-head strong { font-size: 18px; }
        .event-card { margin-bottom: 8px; padding: 10px; border-radius: 12px; border: 1px solid rgba(255, 140, 0, 0.45); background: #ffffff; }
        .event-card h3 { margin: 0; font-size: 13px; }
        .event-card p { margin: 4px 0 0; font-size: 11px; line-height: 1.35; font-weight: 700; }
        .empty-text { margin: 0; color: #64748b; font-size: 12px; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="shell">
        <header class="header">
          <h1>Plano semanal</h1>
          <p>${escapeHtml(monthLabel)}${rangeLabel ? ` | ${escapeHtml(rangeLabel)}` : ''}</p>
        </header>
        <div class="legend">${colorLegend}</div>
        <main class="week-grid">${dayColumns}</main>
      </div>
    </body>
  </html>`
}

function sanitizePdfText(value) {
  return String(value ?? '')
    .replaceAll('€', 'EUR')
    .replaceAll('–', '-')
    .replaceAll('—', '-')
    .replaceAll('×', 'x')
    .replaceAll('\r', ' ')
    .replaceAll('\n', ' ')
    .replace(/[^\x20-\xFF]/g, character => {
      const normalized = character.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return /^[\x20-\xFF]$/.test(normalized) ? normalized : '?'
    })
}

function escapePdfText(value) {
  return sanitizePdfText(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
}

function measurePdfText(text, fontSize) {
  return escapePdfText(text).length * fontSize * 0.48
}

function fitPdfText(text, maxWidth, fontSize) {
  const safeText = sanitizePdfText(text)

  if (measurePdfText(safeText, fontSize) <= maxWidth) {
    return safeText
  }

  let trimmed = safeText
  while (trimmed.length > 0 && measurePdfText(`${trimmed}...`, fontSize) > maxWidth) {
    trimmed = trimmed.slice(0, -1)
  }

  return `${trimmed}...`
}

function stringToPdfBytes(value) {
  const safeValue = String(value ?? '')
  const bytes = new Uint8Array(safeValue.length)

  for (let index = 0; index < safeValue.length; index += 1) {
    bytes[index] = safeValue.charCodeAt(index) & 0xff
  }

  return bytes
}

function buildWeekPdfDocument(weekDays, weekdays, eventsByDate, monthLabel) {
  const pageWidth = 841.89
  const pageHeight = 595.28
  const marginLeft = 18
  const marginRight = 18
  const marginTop = 18
  const marginBottom = 18
  const gap = 8
  const objects = ['']
  const pageObjectIds = []

  function addObject(content) {
    objects.push(content)
    return objects.length - 1
  }

  function formatNumber(value) {
    return Number(value.toFixed(2)).toString()
  }

  function toPdfY(top, height = 0) {
    return pageHeight - top - height
  }

  function rectPath(x, top, width, height) {
    return `${formatNumber(x)} ${formatNumber(toPdfY(top, height))} ${formatNumber(width)} ${formatNumber(height)} re`
  }

  function drawFilledRect(commands, x, top, width, height, rgb) {
    commands.push(`q ${rgb.join(' ')} rg ${rectPath(x, top, width, height)} f Q`)
  }

  function drawRect(commands, x, top, width, height, lineWidth = 0.8, rgb = '0 0 0') {
    commands.push(`q ${rgb} RG ${formatNumber(lineWidth)} w ${rectPath(x, top, width, height)} S Q`)
  }

  function drawText(commands, text, x, baselineTop, options = {}) {
    const {
      font = 'F1',
      fontSize = 9,
      rgb = '0 0 0',
      maxWidth = null,
      align = 'left',
    } = options

    const fittedText = maxWidth ? fitPdfText(text, maxWidth, fontSize) : sanitizePdfText(text)
    const escapedText = escapePdfText(fittedText)
    const textWidth = measurePdfText(fittedText, fontSize)
    let drawX = x

    if (align === 'center' && maxWidth) {
      drawX += Math.max((maxWidth - textWidth) / 2, 0)
    } else if (align === 'right' && maxWidth) {
      drawX += Math.max(maxWidth - textWidth, 0)
    }

    commands.push(
      `BT /${font} ${formatNumber(fontSize)} Tf ${rgb} rg 1 0 0 1 ${formatNumber(drawX)} ${formatNumber(toPdfY(baselineTop))} Tm (${escapedText}) Tj ET`,
    )
  }

  const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  const pagesId = addObject('')

  const commands = []
  const rangeLabel = formatWeekRange(weekDays)

  drawText(commands, 'Plano semanal', marginLeft, marginTop + 8, {
    font: 'F2',
    fontSize: 18,
    maxWidth: pageWidth - marginLeft - marginRight,
    align: 'center',
  })
  drawText(commands, `${monthLabel}${rangeLabel ? ` | ${rangeLabel}` : ''}`, marginLeft, marginTop + 28, {
    font: 'F2',
    fontSize: 10,
    maxWidth: pageWidth - marginLeft - marginRight,
    align: 'center',
  })

  let legendX = marginLeft + 110
  const legendTop = marginTop + 42
  travelAirportOptions.forEach(option => {
    drawFilledRect(commands, legendX, legendTop, 10, 10, hexToPdfRgb(option.color))
    drawRect(commands, legendX, legendTop, 10, 10, 0.6, '0.75 0.75 0.75')
    drawText(commands, option.label, legendX + 14, legendTop + 8, {
      fontSize: 8.2,
      maxWidth: 80,
    })
    legendX += 95
  })

  const availableWidth = pageWidth - marginLeft - marginRight - gap * 6
  const dayWidth = availableWidth / 7
  const dayTop = marginTop + 64
  const dayHeight = pageHeight - dayTop - marginBottom
  const dayHeaderHeight = 28
  const eventHeight = 42

  weekDays.forEach((day, index) => {
    const cardX = marginLeft + index * (dayWidth + gap)
    const isEmpty = !day?.day || !day?.date

    drawFilledRect(commands, cardX, dayTop, dayWidth, dayHeight, isEmpty ? [1, 1, 1] : [1, 0.97, 0.93])
    drawRect(commands, cardX, dayTop, dayWidth, dayHeight, 1.2, '1 0.55 0')
    drawRect(commands, cardX, dayTop, dayWidth, dayHeaderHeight, 0.8, '1 0.55 0')

    drawText(commands, weekdays[index] || '', cardX + 6, dayTop + 11, {
      font: 'F2',
      fontSize: 7.2,
      maxWidth: dayWidth - 38,
    })
    drawText(commands, isEmpty ? '-' : String(day.day), cardX + dayWidth - 24, dayTop + 16, {
      font: 'F2',
      fontSize: 13,
      maxWidth: 18,
      align: 'right',
    })

    if (isEmpty) {
      drawText(commands, 'Sem dia do mes.', cardX + 8, dayTop + 54, {
        fontSize: 8,
        maxWidth: dayWidth - 16,
      })
      return
    }

    const dayEvents = eventsByDate[day.date] || []
    if (dayEvents.length === 0) {
      drawText(commands, 'Sem viagens planeadas.', cardX + 8, dayTop + 54, {
        fontSize: 8,
        maxWidth: dayWidth - 16,
      })
      return
    }

    const maxEvents = Math.max(Math.floor((dayHeight - dayHeaderHeight - 16) / (eventHeight + 6)), 1)
    const visibleEvents = dayEvents.slice(0, maxEvents)
    let eventTop = dayTop + dayHeaderHeight + 8

    visibleEvents.forEach(calendarEvent => {
      const eventColor = getAirportColor(calendarEvent.airport, calendarEvent.color)
      drawFilledRect(commands, cardX + 6, eventTop, dayWidth - 12, eventHeight, [1, 1, 1])
      drawRect(commands, cardX + 6, eventTop, dayWidth - 12, eventHeight, 1, pdfRgbString(hexToPdfRgb(eventColor)))
      drawText(commands, `${getTransportEmoji(calendarEvent.transport)} ${getCalendarEventDisplayTitle(calendarEvent)}`, cardX + 10, eventTop + 12, {
        font: 'F2',
        fontSize: 7.2,
        maxWidth: dayWidth - 20,
      })
      drawText(commands, getCalendarEventDetail(calendarEvent), cardX + 10, eventTop + 24, {
        fontSize: 6.1,
        maxWidth: dayWidth - 20,
      })
      if (calendarEvent.isMerged) {
        drawText(commands, calendarEvent.mergedTitles.join(', '), cardX + 10, eventTop + 35, {
          fontSize: 5.6,
          maxWidth: dayWidth - 20,
        })
      }
      eventTop += eventHeight + 6
    })

    if (dayEvents.length > visibleEvents.length) {
      drawText(commands, `+${dayEvents.length - visibleEvents.length} evento(s)`, cardX + 8, dayTop + dayHeight - 8, {
        font: 'F2',
        fontSize: 7,
        maxWidth: dayWidth - 16,
        align: 'right',
      })
    }
  })

  const stream = commands.join('\n')
  const streamBytes = stringToPdfBytes(stream)
  const contentId = addObject(`<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`)
  const pageId = addObject(
    `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${formatNumber(pageWidth)} ${formatNumber(pageHeight)}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`,
  )
  pageObjectIds.push(pageId)

  objects[pagesId] = `<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)

  let output = '%PDF-1.4\n%\xD3\xEB\xE9\xE1\n'
  const offsets = [0]

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = stringToPdfBytes(output).length
    output += `${index} 0 obj\n${objects[index]}\nendobj\n`
  }

  const xrefOffset = stringToPdfBytes(output).length
  output += `xref\n0 ${objects.length}\n`
  output += '0000000000 65535 f \n'

  for (let index = 1; index < objects.length; index += 1) {
    output += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }

  output += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return stringToPdfBytes(output)
}

function hexToPdfRgb(hex) {
  const normalized = String(hex || '#2563eb').replace('#', '')
  const safeHex = normalized.length === 6 ? normalized : '2563eb'
  return [
    Number.parseInt(safeHex.slice(0, 2), 16) / 255,
    Number.parseInt(safeHex.slice(2, 4), 16) / 255,
    Number.parseInt(safeHex.slice(4, 6), 16) / 255,
  ].map(value => Number(value.toFixed(3)))
}

function pdfRgbString(rgb) {
  return rgb.map(value => Number(value.toFixed(3)).toString()).join(' ')
}

function getMonthLabelFromKey(monthKey) {
  const [year, month] = String(monthKey || '').split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, (month || 1) - 1, 1)).replace(' de ', ' ')
}

function getMonthCalendarDays(monthKey, todayDate) {
  const [year, month] = String(monthKey || '').split('-').map(Number)
  const safeYear = Number.isInteger(year) ? year : new Date().getFullYear()
  const safeMonth = Number.isInteger(month) ? month : new Date().getMonth() + 1
  const holidays = getBelgianHolidays(safeYear)
  const firstDay = new Date(safeYear, safeMonth - 1, 1)
  const daysInMonth = new Date(safeYear, safeMonth, 0).getDate()
  const mondayStartOffset = (firstDay.getDay() + 6) % 7
  const days = []

  for (let index = 0; index < mondayStartOffset; index += 1) {
    days.push({ key: `empty-${safeYear}-${safeMonth}-${index}`, day: null, isToday: false })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${safeYear}-${String(safeMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    days.push({
      key: `day-${safeYear}-${safeMonth}-${day}`,
      day,
      date: dateKey,
      isToday: dateKey === todayDate,
      holiday: holidays[dateKey] || '',
    })
  }

  return days
}

function getDefaultDateForMonth(monthKey, todayDate) {
  if (String(todayDate || '').slice(0, 7) === monthKey) {
    return todayDate
  }

  return `${monthKey}-01`
}

function getPrintReferenceDate(monthKey, todayDate) {
  const [year, month] = String(monthKey || '').split('-').map(Number)
  const safeYear = Number.isInteger(year) ? year : new Date().getFullYear()
  const safeMonth = Number.isInteger(month) ? month : new Date().getMonth() + 1
  const todayDay = Number(String(todayDate || '').slice(8, 10)) || 1
  const daysInMonth = new Date(safeYear, safeMonth, 0).getDate()
  const safeDay = Math.min(todayDay, daysInMonth)

  return `${safeYear}-${String(safeMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`
}

function shiftMonthKey(monthKey, delta) {
  const [year, month] = String(monthKey || '').split('-').map(Number)
  const baseDate = new Date(Number.isInteger(year) ? year : new Date().getFullYear(), (Number.isInteger(month) ? month : 1) - 1, 1)
  baseDate.setMonth(baseDate.getMonth() + delta)
  return `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`
}

const monthPickerLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function openNativePicker(event) {
  try {
    event.currentTarget.showPicker?.()
  } catch (error) {
    // Some browsers only allow showPicker directly from a click/tap gesture.
  }
}

export default function CalendarClient({ initialMonthKey, weekdays, initialEvents, todayDate, peopleNames }) {
  const [monthKey, setMonthKey] = useState(initialMonthKey)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [monthPickerYear, setMonthPickerYear] = useState(Number(initialMonthKey.slice(0, 4)))
  const [events, setEvents] = useState(initialEvents)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [editingEventId, setEditingEventId] = useState(null)
  const [formData, setFormData] = useState(getDefaultFormData(getDefaultDateForMonth(initialMonthKey, todayDate)))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingMonth, setIsLoadingMonth] = useState(false)
  const isViewingEvent = Boolean(selectedEvent) && !editingEventId
  const monthLabel = useMemo(() => getMonthLabelFromKey(monthKey), [monthKey])
  const selectedMonthNumber = useMemo(() => Number(monthKey.slice(5, 7)), [monthKey])
  const days = useMemo(() => getMonthCalendarDays(monthKey, todayDate), [monthKey, todayDate])
  const defaultDateForMonth = useMemo(() => getDefaultDateForMonth(monthKey, todayDate), [monthKey, todayDate])
  const printReferenceDate = useMemo(() => getPrintReferenceDate(monthKey, todayDate), [monthKey, todayDate])

  useEffect(() => {
    let isCancelled = false

    async function loadMonthEvents() {
      setIsLoadingMonth(true)
      setError('')

      try {
        const [year, month] = monthKey.split('-')
        const response = await fetch(`/api/calendar-events?year=${year}&month=${month}`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Não foi possível carregar o calendário.')
        }

        if (!isCancelled) {
          setEvents(Array.isArray(payload) ? payload : [])
          setSelectedEvent(null)
          setEditingEventId(null)
          setIsOpen(false)
          setFormData(getDefaultFormData(getDefaultDateForMonth(monthKey, todayDate)))
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError.message)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMonth(false)
        }
      }
    }

    loadMonthEvents()

    return () => {
      isCancelled = true
    }
  }, [monthKey, todayDate])

  useEffect(() => {
    setMonthPickerYear(Number(monthKey.slice(0, 4)))
  }, [monthKey])

  const eventsByDate = useMemo(() => {
    return buildMergedCalendarEvents(events)
  }, [events])

  const calendarWeeks = useMemo(() => chunkDays(days), [days])
  const currentWeekDays = useMemo(
    () => calendarWeeks.find(week => week.some(day => day?.date === printReferenceDate)) || calendarWeeks[0] || [],
    [calendarWeeks, printReferenceDate],
  )

  function openModal() {
    setError('')
    setSelectedEvent(null)
    setEditingEventId(null)
    setFormData(getDefaultFormData(defaultDateForMonth))
    setIsOpen(true)
  }

  function openEventModal(calendarEvent) {
    const airportColor = getAirportColor(calendarEvent.airport, calendarEvent.color)

    setError('')
    setSelectedEvent(calendarEvent)
    setEditingEventId(null)
    setFormData({
      ...getDefaultFormData(defaultDateForMonth),
      ...calendarEvent,
      date: calendarEvent.departureDate || calendarEvent.date,
      departureDate: calendarEvent.departureDate || calendarEvent.date,
      color: airportColor,
    })
    setIsOpen(true)
  }

  function startEditingSelectedEvent() {
    if (!selectedEvent || selectedEvent.isMerged) return
    setError('')
    setEditingEventId(selectedEvent.id)
  }

  function closeModal() {
    if (isSaving) return
    setIsOpen(false)
    setSelectedEvent(null)
    setEditingEventId(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const eventTitle = String(formData.title || '').trim()
      const response = await fetch('/api/calendar-events', {
        method: editingEventId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingEventId,
          date: formData.departureDate,
          title: eventTitle,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Não foi possível criar o evento.')
      }

      setEvents(currentEvents => (
        editingEventId
          ? currentEvents.map(calendarEvent => (calendarEvent.id === editingEventId ? payload : calendarEvent))
          : [...currentEvents, payload]
      ))
      setIsOpen(false)
      setSelectedEvent(null)
      setEditingEventId(null)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteSelectedEvent() {
    if (!selectedEvent || selectedEvent.isMerged || isSaving) return

    setError('')
    setIsSaving(true)

    try {
      const response = await fetch('/api/calendar-events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedEvent.id }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Não foi possível remover o evento.')
      }

      setEvents(currentEvents => currentEvents.filter(calendarEvent => calendarEvent.id !== selectedEvent.id))
      setIsOpen(false)
      setSelectedEvent(null)
      setEditingEventId(null)
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setIsSaving(false)
    }
  }

  function handlePrintWeek() {
    const popupWidth = 1200
    const popupHeight = 900
    const screenLeft = typeof window.screenLeft === 'number' ? window.screenLeft : window.screenX
    const screenTop = typeof window.screenTop === 'number' ? window.screenTop : window.screenY
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || screen.width
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || screen.height
    const left = Math.max(screenLeft + Math.round((viewportWidth - popupWidth) / 2), 0)
    const top = Math.max(screenTop + Math.round((viewportHeight - popupHeight) / 2), 0)

    const printWindow = window.open(
      '',
      '_blank',
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`,
    )

    if (!printWindow) {
      setError('Não foi possível abrir a janela de impressão.')
      return
    }

    const documentHtml = buildWeekPrintDocument(currentWeekDays, weekdays, eventsByDate, monthLabel)
    printWindow.document.open()
    printWindow.document.write(documentHtml)
    printWindow.document.close()
    printWindow.focus()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  return (
    <>
      <section style={calendarCardStyle}>
        <div style={calendarTopBarStyle}>
          <div style={leftTopActionsStyle}>
            <button
              type="button"
              style={{ ...secondaryButtonStyle, border: '1px solid #ff8c00', color: '#ff8c00' }}
              onClick={handlePrintWeek}
            >
              Imprimir
            </button>
          </div>
          <div style={{ ...monthSwitcherStyle, ...monthPickerWrapStyle }}>
            <button
              type="button"
              style={monthNavButtonStyle}
              onClick={() => setMonthKey(current => shiftMonthKey(current, -1))}
              aria-label="Mês anterior"
            >
              ‹
            </button>
            <button
              type="button"
              style={monthBadgeStyle}
              onClick={() => setShowMonthPicker(current => !current)}
              aria-label="Abrir seletor mensal"
            >
              {monthLabel}
            </button>
            <button
              type="button"
              style={monthNavButtonStyle}
              onClick={() => setMonthKey(current => shiftMonthKey(current, 1))}
              aria-label="Mês seguinte"
            >
              ›
            </button>
            {showMonthPicker && (
              <div style={monthPickerPopoverStyle}>
                <div style={monthPickerHeaderStyle}>
                  <button
                    type="button"
                    style={monthNavButtonStyle}
                    onClick={() => setMonthPickerYear(current => current - 1)}
                    aria-label="Ano anterior"
                  >
                    ‹
                  </button>
                  <p style={monthPickerYearStyle}>{monthPickerYear}</p>
                  <button
                    type="button"
                    style={monthNavButtonStyle}
                    onClick={() => setMonthPickerYear(current => current + 1)}
                    aria-label="Ano seguinte"
                  >
                    ›
                  </button>
                </div>
                <div style={monthGridStyle}>
                  {monthPickerLabels.map((label, index) => {
                    const monthNumber = index + 1
                    const optionMonthKey = `${monthPickerYear}-${String(monthNumber).padStart(2, '0')}`
                    const isSelected = monthPickerYear === Number(monthKey.slice(0, 4)) && monthNumber === selectedMonthNumber

                    return (
                      <button
                        key={optionMonthKey}
                        type="button"
                        style={monthOptionStyle(isSelected)}
                        onClick={() => {
                          setMonthKey(optionMonthKey)
                          setShowMonthPicker(false)
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <div style={rightTopActionsStyle}>
            <button type="button" style={addButtonStyle} onClick={openModal}>Adicionar</button>
          </div>
        </div>
        {isLoadingMonth && <p style={{ margin: '0 0 14px', color: '#475569', fontWeight: 800 }}>A carregar o mês...</p>}
        <div style={gridStyle}>
          {weekdays.map(weekday => (
            <div key={weekday} style={weekdayStyle}>{weekday}</div>
          ))}
          {days.map(day => (
            day.day ? (
              <div key={day.key} style={dayStyle(day.isToday, Boolean(day.holiday))}>
                <span style={dayNumberStyle}>{day.day}</span>
                {day.holiday && <span style={holidayLabelStyle(day.isToday)}>{day.holiday}</span>}
                {(eventsByDate[day.date] || []).map(calendarEvent => (
                  <button
                    key={`${calendarEvent.id}-${calendarEvent.calendarMoment}`}
                    type="button"
                    style={eventLabelStyle(day.isToday, getAirportColor(calendarEvent.airport, calendarEvent.color))}
                    onClick={() => openEventModal(calendarEvent)}
                  >
                    <span style={eventTitleStyle}>
                      {getTransportEmoji(calendarEvent.transport)} {getCalendarEventDisplayTitle(calendarEvent)}
                    </span>
                    <span style={eventDetailStyle}>{getCalendarEventDetail(calendarEvent)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div key={day.key} style={emptyDayStyle} />
            )
          ))}
        </div>
      </section>

      {isOpen && (
        <div style={overlayStyle} role="presentation" onClick={closeModal}>
          <form style={modalStyle} onSubmit={handleSubmit} onClick={event => event.stopPropagation()}>
            <datalist id="calendar-people-names">
              {peopleNames.map(name => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <div style={modalHeaderStyle}>
              <h2 style={modalTitleStyle}>
                {isViewingEvent ? 'Detalhes do evento' : editingEventId ? 'Editar evento' : 'Adicionar evento'}
              </h2>
              <button type="button" style={closeButtonStyle} onClick={closeModal} aria-label="Fechar popup">
                ×
              </button>
            </div>

            {isViewingEvent && (
              <>
                <div style={detailPanelStyle}>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>{selectedEvent?.isMerged ? 'Pessoas' : 'Nome'}</span>
                    <span style={detailValueStyle}>
                      {selectedEvent?.isMerged ? selectedEvent.mergedTitles.join(', ') : formData.title || '-'}
                    </span>
                  </div>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>Transporte</span>
                    <span style={detailValueStyle}>{getTransportEmoji(formData.transport)} {formData.transport === 'comboio' ? 'Comboio' : 'Avião'}</span>
                  </div>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>Partida</span>
                    <span style={detailValueStyle}>{getAirportLabel(formData.airport)}</span>
                  </div>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>Destino</span>
                    <span style={detailValueStyle}>{formData.destination || '-'}</span>
                  </div>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>Partida</span>
                    <span style={detailValueStyle}>{formatTravelDate(formData.departureDate)} às {formData.departureTime || '--:--'}</span>
                  </div>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>Chegada</span>
                    <span style={detailValueStyle}>{formatTravelDate(formData.arrivalDate)} às {formData.arrivalTime || '--:--'}</span>
                  </div>
                </div>

                {error && <p style={errorStyle}>{error}</p>}

                {!selectedEvent?.isMerged && (
                  <div style={detailActionsStyle}>
                    <button
                      type="button"
                      style={editPencilButtonStyle}
                      onClick={startEditingSelectedEvent}
                      aria-label="Editar evento"
                      title="Editar"
                    >
                      <EditPencilIcon />
                    </button>
                    <button
                      type="button"
                      style={iconActionButtonStyle('#dc2626')}
                      onClick={handleDeleteSelectedEvent}
                      aria-label="Remover evento"
                      title="Remover"
                      disabled={isSaving}
                    >
                      🗑
                    </button>
                  </div>
                )}
              </>
            )}

            <div style={{ display: isViewingEvent ? 'none' : 'block' }}>
            <label style={labelStyle}>
              Nome
              <input
                type="text"
                required
                list="calendar-people-names"
                value={formData.title}
                onChange={event => setFormData(current => ({ ...current, title: event.target.value }))}
                placeholder="Escreve o nome"
                style={inputStyle}
              />
            </label>

            {formData.type === 'viagem' && (
              <>
                <div style={labelStyle}>
                  Transporte
                  <div style={optionRowStyle}>
                    {travelTransportOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        style={optionButtonStyle(formData.transport === option.value)}
                        onClick={() => setFormData(current => ({ ...current, transport: option.value }))}
                      >
                        {option.emoji} {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={labelStyle}>
                  Partida
                  <div style={optionRowStyle}>
                    {travelAirportOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        style={airportButtonStyle(option.color, formData.airport === option.value)}
                        onClick={() => setFormData(current => ({ ...current, airport: option.value, color: option.color }))}
                      >
                        <span style={airportDotStyle(option.color)} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <label style={labelStyle}>
              Destino
              <input
                type="text"
                value={formData.destination}
                onChange={event => setFormData(current => ({ ...current, destination: event.target.value }))}
                placeholder="Escreve o destino"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Dia de partida
              <input
                type="date"
                required
                value={formData.departureDate}
                onClick={openNativePicker}
                onChange={event => setFormData(current => ({
                  ...current,
                  date: event.target.value,
                  departureDate: event.target.value,
                }))}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Dia de chegada
              <input
                type="date"
                required
                value={formData.arrivalDate}
                onClick={openNativePicker}
                onChange={event => setFormData(current => ({ ...current, arrivalDate: event.target.value }))}
                placeholder="Ex.: Reunião de obra"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Hora de partida
              <input
                type="time"
                required
                value={formData.departureTime}
                onClick={openNativePicker}
                onChange={event => setFormData(current => ({ ...current, departureTime: event.target.value }))}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Hora de chegada
              <input
                type="time"
                required
                value={formData.arrivalTime}
                onClick={openNativePicker}
                onChange={event => setFormData(current => ({ ...current, arrivalTime: event.target.value }))}
                style={inputStyle}
              />
            </label>

            {error && <p style={errorStyle}>{error}</p>}

            <div style={modalActionsStyle}>
              <button type="button" style={secondaryButtonStyle} onClick={closeModal}>Cancelar</button>
              <button type="submit" style={primaryButtonStyle} disabled={isSaving}>
                {isSaving ? 'A guardar...' : editingEventId ? 'Guardar alterações' : 'Guardar evento'}
              </button>
            </div>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
