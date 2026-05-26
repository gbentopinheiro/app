import { NextResponse } from 'next/server'
import { canAccessCalendarManagement } from '../../../lib/auth.js'
import { createCalendarEvent, deleteCalendarEvent, getAllCalendarEvents, updateCalendarEvent } from '../../../lib/calendar-events.js'
import { markCalendarNotificationsSeen } from '../../../lib/calendar-notifications.js'
import { isFeatureEnabled } from '../../../lib/feature-flags.js'
import { getServerSession } from '../../../lib/server-session.js'

export async function GET(request) {
  if (!isFeatureEnabled('calendarManagement')) {
    return NextResponse.json({ message: 'O calendário está desativado.' }, { status: 503 })
  }

  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  if (!canAccessCalendarManagement(session.role)) {
    return NextResponse.json({ message: 'Sem permissão.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  return NextResponse.json(getAllCalendarEvents({ year, month }))
}

export async function POST(request) {
  if (!isFeatureEnabled('calendarManagement')) {
    return NextResponse.json({ message: 'O calendário está desativado.' }, { status: 503 })
  }

  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  if (!canAccessCalendarManagement(session.role)) {
    return NextResponse.json({ message: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const event = createCalendarEvent({
      date: body.date,
      title: body.title,
      type: body.type,
      transport: body.transport,
      airport: body.airport,
      destination: body.destination,
      departureDate: body.departureDate,
      arrivalDate: body.arrivalDate,
      departureTime: body.departureTime,
      arrivalTime: body.arrivalTime,
      color: body.color,
      createdBy: session.name || session.username,
    })

    markCalendarNotificationsSeen(session.username, event.updatedAt || event.createdAt)

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Não foi possível criar o evento.' }, { status: 400 })
  }
}

export async function PUT(request) {
  if (!isFeatureEnabled('calendarManagement')) {
    return NextResponse.json({ message: 'O calendário está desativado.' }, { status: 503 })
  }

  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  if (!canAccessCalendarManagement(session.role)) {
    return NextResponse.json({ message: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const event = updateCalendarEvent(body.id, {
      date: body.date,
      title: body.title,
      type: body.type,
      transport: body.transport,
      airport: body.airport,
      destination: body.destination,
      departureDate: body.departureDate,
      arrivalDate: body.arrivalDate,
      departureTime: body.departureTime,
      arrivalTime: body.arrivalTime,
      color: body.color,
      createdBy: session.name || session.username,
    })

    markCalendarNotificationsSeen(session.username, event.updatedAt || event.createdAt)

    return NextResponse.json(event)
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Não foi possível atualizar o evento.' }, { status: 400 })
  }
}

export async function DELETE(request) {
  if (!isFeatureEnabled('calendarManagement')) {
    return NextResponse.json({ message: 'O calendário está desativado.' }, { status: 503 })
  }

  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  if (!canAccessCalendarManagement(session.role)) {
    return NextResponse.json({ message: 'Sem permissão.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const event = deleteCalendarEvent(body.id)

    return NextResponse.json(event)
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Não foi possível remover o evento.' }, { status: 400 })
  }
}
