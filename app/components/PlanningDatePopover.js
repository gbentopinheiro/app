'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const containerStyle = {
  width: '100%',
  display: 'grid',
  justifyItems: 'center',
  position: 'relative',
}

const triggerStyle = {
  width: '100%',
  maxWidth: '760px',
  border: 'none',
  background: 'transparent',
  color: '#ffffff',
  padding: '12px 18px',
  borderRadius: '28px',
  display: 'grid',
  justifyItems: 'center',
  cursor: 'pointer',
  transition: 'opacity 160ms ease',
}

const triggerTextStyle = {
  margin: 0,
  fontSize: 'clamp(24px, 4vw, 42px)',
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: '-0.04em',
}

const popoverBaseStyle = {
  position: 'fixed',
  zIndex: 80,
  padding: '20px',
  borderRadius: '24px',
  background: 'rgba(255, 255, 255, 0.98)',
  color: '#10233e',
  border: '1px solid rgba(140, 160, 184, 0.28)',
  boxShadow: '0 28px 64px rgba(16, 35, 62, 0.18)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  overflowY: 'auto',
}

const monthHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
}

const navButtonStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '999px',
  border: '1px solid rgba(16, 35, 62, 0.1)',
  background: '#ffffff',
  color: '#10233e',
  fontSize: '20px',
  fontWeight: 800,
  lineHeight: 1,
  cursor: 'pointer',
}

const monthLabelStyle = {
  margin: 0,
  fontSize: '20px',
  lineHeight: 1.1,
  fontWeight: 900,
  letterSpacing: '-0.02em',
  textTransform: 'capitalize',
}

const weekdaysGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: '10px',
  marginTop: '18px',
}

const weekdayCellStyle = {
  textAlign: 'center',
  fontSize: '12px',
  fontWeight: 800,
  color: '#5a708c',
  textTransform: 'uppercase',
}

const daysGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: '10px',
  marginTop: '14px',
}

function parseDateValue(value) {
  const [year, month, day] = String(value || '').split('-').map(Number)

  if (!year || !month || !day) {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
  }

  return new Date(year, month - 1, day, 12)
}

function toDateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12)
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12)
}

function capitalizeLabel(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function buildCalendarDays(visibleMonthDate, selectedValue, todayValue) {
  const firstDayOfMonth = startOfMonth(visibleMonthDate)
  const monthIndex = firstDayOfMonth.getMonth()
  const weekdayOffset = (firstDayOfMonth.getDay() + 6) % 7
  const gridStartDate = new Date(
    firstDayOfMonth.getFullYear(),
    firstDayOfMonth.getMonth(),
    1 - weekdayOffset,
    12,
  )

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      gridStartDate.getFullYear(),
      gridStartDate.getMonth(),
      gridStartDate.getDate() + index,
      12,
    )
    const value = toDateValue(date)

    return {
      date,
      value,
      label: date.getDate(),
      isCurrentMonth: date.getMonth() === monthIndex,
      isSelected: value === selectedValue,
      isToday: value === todayValue,
    }
  })
}

function formatAriaDate(date) {
  return capitalizeLabel(
    new Intl.DateTimeFormat('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date),
  )
}

function buildMonthLabel(date) {
  const monthLabel = capitalizeLabel(
    new Intl.DateTimeFormat('pt-PT', { month: 'long' }).format(date),
  )

  return `${monthLabel} ${date.getFullYear()}`
}

function getDayButtonStyle(day) {
  const style = {
    minHeight: '48px',
    borderRadius: '16px',
    border: '1px solid transparent',
    background: 'transparent',
    color: day.isCurrentMonth ? '#10233e' : '#8ca0b8',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease',
  }

  if (day.isToday) {
    style.border = '1px solid rgba(16, 35, 62, 0.16)'
    style.background = 'rgba(16, 35, 62, 0.045)'
  }

  if (day.isSelected) {
    style.background = 'var(--vp-accent)'
    style.border = '1px solid var(--vp-accent)'
    style.color = '#ffffff'
  } else if (!day.isCurrentMonth) {
    style.background = 'rgba(148, 163, 184, 0.06)'
  }

  return style
}

function resolvePopoverLayout(triggerRect) {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const horizontalMargin = 12
  const popoverWidth = Math.min(392, viewportWidth - horizontalMargin * 2)
  let left = triggerRect.left + triggerRect.width / 2 - popoverWidth / 2
  left = Math.max(horizontalMargin, Math.min(left, viewportWidth - popoverWidth - horizontalMargin))

  const top = triggerRect.bottom + 12

  return {
    top,
    left,
    width: popoverWidth,
    maxHeight: Math.max(260, viewportHeight - top - 16),
  }
}

export default function PlanningDatePopover({
  value,
  displayLabel,
  onChange,
  dialogLabel = 'Selecionar data do planeamento',
  previousMonthLabel = 'Mês anterior',
  nextMonthLabel = 'Mês seguinte',
}) {
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)
  const selectedDayRef = useRef(null)
  const todayDayRef = useRef(null)
  const fallbackDayRef = useRef(null)
  const [isClient, setIsClient] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [popoverLayout, setPopoverLayout] = useState(null)
  const selectedDate = useMemo(() => parseDateValue(value), [value])
  const todayValue = useMemo(() => toDateValue(new Date()), [])
  const [visibleMonthDate, setVisibleMonthDate] = useState(() => startOfMonth(selectedDate))

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setVisibleMonthDate(startOfMonth(selectedDate))
    }
  }, [isOpen, selectedDate])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handlePointerDown(event) {
      const withinTrigger = rootRef.current?.contains(event.target)
      const withinPopover = popoverRef.current?.contains(event.target)

      if (!withinTrigger && !withinPopover) {
        setIsOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      setIsOpen(false)
      requestAnimationFrame(() => triggerRef.current?.focus())
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function updateLayout() {
      const triggerRect = triggerRef.current?.getBoundingClientRect()

      if (!triggerRect) {
        return
      }

      setPopoverLayout(resolvePopoverLayout(triggerRect))
    }

    updateLayout()

    window.addEventListener('resize', updateLayout)
    window.addEventListener('scroll', updateLayout, true)

    return () => {
      window.removeEventListener('resize', updateLayout)
      window.removeEventListener('scroll', updateLayout, true)
    }
  }, [isOpen])

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonthDate, value, todayValue),
    [todayValue, value, visibleMonthDate],
  )
  const monthLabel = useMemo(() => buildMonthLabel(visibleMonthDate), [visibleMonthDate])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const targetButton =
      selectedDayRef.current || todayDayRef.current || fallbackDayRef.current

    targetButton?.focus()
  }, [calendarDays, isOpen])

  function toggleCalendar() {
    setVisibleMonthDate(startOfMonth(selectedDate))
    setIsOpen(current => !current)
  }

  function handleTriggerKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    toggleCalendar()
  }

  function handleSelectDate(nextValue) {
    onChange(nextValue)
    setIsOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const popover =
    isClient && isOpen && popoverLayout
      ? createPortal(
          <div
            id="planeamento-calendario"
            ref={popoverRef}
            role="dialog"
            aria-modal="false"
            aria-label={dialogLabel}
            className="vp-floating-calendar"
            style={{
              ...popoverBaseStyle,
              top: `${popoverLayout.top}px`,
              left: `${popoverLayout.left}px`,
              width: `${popoverLayout.width}px`,
              maxHeight: `${popoverLayout.maxHeight}px`,
            }}
          >
            <div style={monthHeaderStyle}>
              <button
                type="button"
                className="vp-planning-calendar-nav"
                onClick={() => setVisibleMonthDate(current => addMonths(current, -1))}
                style={navButtonStyle}
                aria-label={previousMonthLabel}
              >
                {'\u2039'}
              </button>
              <p style={monthLabelStyle}>{monthLabel}</p>
              <button
                type="button"
                className="vp-planning-calendar-nav"
                onClick={() => setVisibleMonthDate(current => addMonths(current, 1))}
                style={navButtonStyle}
                aria-label={nextMonthLabel}
              >
                {'\u203A'}
              </button>
            </div>

            <div style={weekdaysGridStyle} aria-hidden="true">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(label => (
                <div key={label} style={weekdayCellStyle}>
                  {label}
                </div>
              ))}
            </div>

            <div style={daysGridStyle}>
              {calendarDays.map((day, index) => {
                const ref =
                  day.isSelected
                    ? selectedDayRef
                    : day.isToday
                      ? todayDayRef
                      : index === 0
                        ? fallbackDayRef
                        : null

                return (
                  <button
                    key={day.value}
                    ref={ref}
                    type="button"
                    className="vp-planning-calendar-day"
                    style={getDayButtonStyle(day)}
                    onClick={() => handleSelectDate(day.value)}
                    aria-label={`Selecionar ${formatAriaDate(day.date)}`}
                    aria-pressed={day.isSelected}
                    aria-current={day.isToday ? 'date' : undefined}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} style={containerStyle}>
      <button
        ref={triggerRef}
        type="button"
        className="vp-planning-date-trigger"
        onClick={toggleCalendar}
        onKeyDown={handleTriggerKeyDown}
        style={triggerStyle}
        aria-label={`Selecionar data do planeamento: ${displayLabel}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="planeamento-calendario"
      >
        <p style={triggerTextStyle}>{displayLabel}</p>
      </button>
      {popover}
    </div>
  )
}
