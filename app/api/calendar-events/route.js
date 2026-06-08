import { NextResponse } from 'next/server'
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getAllCalendarEvents,
  updateCalendarEvent,
} from '../../../lib/calendar-events.js'
import { markCalendarNotificationsSeen } from '../../../lib/calendar-notifications.js'
import { isFeatureEnabled } from '../../../lib/feature-flags.js'
import { hasPermission } from '../../../lib/permissions.js'
import { getServerSession } from '../../../lib/server-session.js'

async function requireCalendarPermission(permissionKey) {
  if (!isFeatureEnabled('calendarManagement')) {
    return {
      error: NextResponse.json({ message: 'O calendario esta desativado.' }, { status: 503 }),
    }
  }

  const session = await getServerSession()

  if (!session) {
    return {
      error: NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 }),
    }
  }

  if (!hasPermission(session, permissionKey)) {
    return {
      error: NextResponse.json({ message: 'Sem permissao.' }, { status: 403 }),
    }
  }

  return { session }
}

export async function GET(request) {
  const auth = await requireCalendarPermission('calendar.read')
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  return NextResponse.json(getAllCalendarEvents({ year, month }))
}

export async function POST(request) {
  const auth = await requireCalendarPermission('calendar.manage')
  if (auth.error) return auth.error

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
      createdBy: auth.session.name || auth.session.username,
    })

    markCalendarNotificationsSeen(auth.session.username, event.updatedAt || event.createdAt)

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Nao foi possivel criar o evento.' }, { status: 400 })
  }
}

export async function PUT(request) {
  const auth = await requireCalendarPermission('calendar.manage')
  if (auth.error) return auth.error

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
      createdBy: auth.session.name || auth.session.username,
    })

    markCalendarNotificationsSeen(auth.session.username, event.updatedAt || event.createdAt)

    return NextResponse.json(event)
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Nao foi possivel atualizar o evento.' }, { status: 400 })
  }
}

export async function DELETE(request) {
  const auth = await requireCalendarPermission('calendar.manage')
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const event = deleteCalendarEvent(body.id)

    return NextResponse.json(event)
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Nao foi possivel remover o evento.' }, { status: 400 })
  }
}
