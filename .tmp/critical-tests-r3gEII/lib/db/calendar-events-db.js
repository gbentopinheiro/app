import { prisma } from '../prisma.js'
import {
  toDateOnlyString,
  toDateOnlyValue,
  toDateTimeString,
  toOptionalString,
  toPositiveInt,
  toRequiredString,
} from './core-mappers.js'

const DEFAULT_EVENT_COLOR = '#2563eb'
const ALLOWED_EVENT_COLORS = new Set(['#16a34a', '#2563eb', '#dc2626', '#111111'])
const ALLOWED_EVENT_TYPES = new Set(['viagem'])
const ALLOWED_TRAVEL_TRANSPORTS = new Set(['comboio', 'aviao'])
const ALLOWED_TRAVEL_AIRPORTS = new Set(['zaventem', 'charleroi', 'bruxelles-midi', 'outro'])

function normalizeEventColor(color) {
  const normalizedColor = String(color || DEFAULT_EVENT_COLOR).trim().toLowerCase()
  return ALLOWED_EVENT_COLORS.has(normalizedColor) ? normalizedColor : DEFAULT_EVENT_COLOR
}

function normalizeEventType(type) {
  const normalizedType = String(type || 'viagem').trim().toLowerCase()
  return ALLOWED_EVENT_TYPES.has(normalizedType) ? normalizedType : 'viagem'
}

function normalizeTravelTransport(transport) {
  const normalizedTransport = String(transport || 'aviao').trim().toLowerCase()
  return ALLOWED_TRAVEL_TRANSPORTS.has(normalizedTransport) ? normalizedTransport : 'aviao'
}

function normalizeTravelAirport(airport) {
  const normalizedAirport = String(airport || 'charleroi').trim().toLowerCase()
  return ALLOWED_TRAVEL_AIRPORTS.has(normalizedAirport) ? normalizedAirport : 'charleroi'
}

function normalizeTime(value) {
  const normalizedValue = String(value || '').trim()
  return normalizedValue ? normalizedValue.slice(0, 8) : ''
}

function mapCalendarEventRecord(record) {
  if (!record) {
    return null
  }

  const date = toDateOnlyString(record.date) || ''

  return {
    id: Number(record.id),
    date,
    title: toRequiredString(record.title),
    type: normalizeEventType(record.type),
    transport: normalizeTravelTransport(record.transport),
    airport: normalizeTravelAirport(record.airport),
    destination: toRequiredString(record.destination),
    departureDate: toDateOnlyString(record.departureDate) || date,
    arrivalDate: toDateOnlyString(record.arrivalDate) || '',
    departureTime: normalizeTime(record.departureTime),
    arrivalTime: normalizeTime(record.arrivalTime),
    outboundFlightReference: toRequiredString(record.outboundFlightReference),
    returnFlightReference: toRequiredString(record.returnFlightReference),
    color: normalizeEventColor(record.color),
    createdBy: toRequiredString(record.createdBy),
    createdAt: toDateTimeString(record.createdAt),
    updatedAt: toDateTimeString(record.updatedAt),
  }
}

function buildCalendarEventMutationData(data, currentEvent = null) {
  const date = data?.date !== undefined ? String(data.date || '').trim() : String(currentEvent?.date || '').trim()
  const departureDate =
    data?.departureDate !== undefined
      ? String(data.departureDate || '').trim()
      : String(currentEvent?.departureDate || date).trim()

  return {
    date: toDateOnlyValue(date),
    title: data?.title !== undefined ? toRequiredString(data.title) : toRequiredString(currentEvent?.title),
    type:
      data?.type !== undefined
        ? normalizeEventType(data.type)
        : normalizeEventType(currentEvent?.type),
    transport:
      data?.transport !== undefined
        ? normalizeTravelTransport(data.transport)
        : normalizeTravelTransport(currentEvent?.transport),
    airport:
      data?.airport !== undefined
        ? normalizeTravelAirport(data.airport)
        : normalizeTravelAirport(currentEvent?.airport),
    destination:
      data?.destination !== undefined
        ? toOptionalString(data.destination)
        : toOptionalString(currentEvent?.destination),
    departureDate: toDateOnlyValue(departureDate),
    arrivalDate:
      data?.arrivalDate !== undefined
        ? toDateOnlyValue(String(data.arrivalDate || '').trim())
        : toDateOnlyValue(String(currentEvent?.arrivalDate || '').trim()),
    departureTime:
      data?.departureTime !== undefined
        ? toOptionalString(normalizeTime(data.departureTime))
        : toOptionalString(normalizeTime(currentEvent?.departureTime)),
    arrivalTime:
      data?.arrivalTime !== undefined
        ? toOptionalString(normalizeTime(data.arrivalTime))
        : toOptionalString(normalizeTime(currentEvent?.arrivalTime)),
    outboundFlightReference:
      data?.outboundFlightReference !== undefined
        ? toOptionalString(data.outboundFlightReference)
        : toOptionalString(currentEvent?.outboundFlightReference),
    returnFlightReference:
      data?.returnFlightReference !== undefined
        ? toOptionalString(data.returnFlightReference)
        : toOptionalString(currentEvent?.returnFlightReference),
    color:
      data?.color !== undefined
        ? normalizeEventColor(data.color)
        : normalizeEventColor(currentEvent?.color),
    createdBy:
      data?.createdBy !== undefined
        ? toOptionalString(data.createdBy)
        : toOptionalString(currentEvent?.createdBy),
  }
}

function validateEventData(data) {
  const date = String(data.date || '').trim()
  const title = String(data.title || '').trim()
  const color = normalizeEventColor(data.color)
  const type = normalizeEventType(data.type)
  const transport = normalizeTravelTransport(data.transport)
  const airport = normalizeTravelAirport(data.airport)
  const departureDate = String(data.departureDate || date).trim()
  const arrivalDate = String(data.arrivalDate || '').trim()
  const departureTime = String(data.departureTime || '').trim()
  const arrivalTime = String(data.arrivalTime || '').trim()

  if (!date || Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
    throw new Error('Escolhe um dia válido.')
  }

  if (!title) {
    throw new Error('Escreve o nome do evento.')
  }

  if (!ALLOWED_EVENT_COLORS.has(color)) {
    throw new Error('Escolhe uma cor válida.')
  }

  if (!ALLOWED_EVENT_TYPES.has(type)) {
    throw new Error('Escolhe um tipo de evento válido.')
  }

  if (type === 'viagem' && (!ALLOWED_TRAVEL_TRANSPORTS.has(transport) || !ALLOWED_TRAVEL_AIRPORTS.has(airport))) {
    throw new Error('Escolhe o transporte e o aeroporto da viagem.')
  }

  if (type === 'viagem' && (!departureDate || Number.isNaN(new Date(`${departureDate}T00:00:00`).getTime()))) {
    throw new Error('Escolhe o dia de partida.')
  }

  if (type === 'viagem' && (!arrivalDate || Number.isNaN(new Date(`${arrivalDate}T00:00:00`).getTime()))) {
    throw new Error('Escolhe o dia de chegada.')
  }

  if (type === 'viagem' && !departureTime) {
    throw new Error('Escolhe a hora de partida.')
  }

  if (type === 'viagem' && !arrivalTime) {
    throw new Error('Escolhe a hora de chegada.')
  }
}

async function getNextCalendarEventIdDb() {
  const result = await prisma.calendarEvent.aggregate({
    _max: {
      id: true,
    },
  })

  return Number(result?._max?.id || 0) + 1
}

function applyCalendarEventFilters(events, filters = {}) {
  return events
    .filter(event => !filters.year || new Date(`${event.date}T00:00:00`).getFullYear() === Number(filters.year))
    .filter(event => !filters.month || new Date(`${event.date}T00:00:00`).getMonth() + 1 === Number(filters.month))
}

export async function getAllCalendarEventsDb(filters = {}) {
  const events = await prisma.calendarEvent.findMany({
    orderBy: [{ id: 'asc' }],
  })

  return applyCalendarEventFilters(events.map(mapCalendarEventRecord), filters)
}

export async function getCalendarEventByIdDb(id) {
  const normalizedId = toPositiveInt(id)

  if (!normalizedId) {
    return null
  }

  const event = await prisma.calendarEvent.findUnique({
    where: { id: normalizedId },
  })

  return mapCalendarEventRecord(event)
}

export async function createCalendarEventDb(data) {
  validateEventData(data)

  const nextEventState = buildCalendarEventMutationData(data)
  const createData = {
    id: toPositiveInt(data?.id) || (await getNextCalendarEventIdDb()),
    ...nextEventState,
  }

  if (data?.createdAt) {
    createData.createdAt = new Date(data.createdAt)
  } else {
    createData.createdAt = new Date()
  }

  if (data?.updatedAt) {
    createData.updatedAt = new Date(data.updatedAt)
  } else {
    createData.updatedAt = new Date()
  }

  const event = await prisma.calendarEvent.create({
    data: createData,
  })

  return mapCalendarEventRecord(event)
}

export async function updateCalendarEventDb(id, data) {
  const currentEvent = await getCalendarEventByIdDb(id)

  if (!currentEvent) {
    throw new Error('Evento não encontrado.')
  }

  const nextEventInput = {
    date: data?.date !== undefined ? data.date : currentEvent.date,
    title: data?.title !== undefined ? data.title : currentEvent.title,
    type: data?.type !== undefined ? data.type : currentEvent.type,
    transport: data?.transport !== undefined ? data.transport : currentEvent.transport,
    airport: data?.airport !== undefined ? data.airport : currentEvent.airport,
    destination: data?.destination !== undefined ? data.destination : currentEvent.destination,
    departureDate: data?.departureDate !== undefined ? data.departureDate : currentEvent.departureDate,
    arrivalDate: data?.arrivalDate !== undefined ? data.arrivalDate : currentEvent.arrivalDate,
    departureTime: data?.departureTime !== undefined ? data.departureTime : currentEvent.departureTime,
    arrivalTime: data?.arrivalTime !== undefined ? data.arrivalTime : currentEvent.arrivalTime,
    color: data?.color !== undefined ? data.color : currentEvent.color,
  }

  validateEventData(nextEventInput)

  const updateData = buildCalendarEventMutationData(data, currentEvent)

  if (data?.createdAt) {
    updateData.createdAt = new Date(data.createdAt)
  } else {
    updateData.createdAt = new Date(currentEvent.createdAt)
  }

  if (data?.updatedAt) {
    updateData.updatedAt = new Date(data.updatedAt)
  } else {
    updateData.updatedAt = new Date()
  }

  const event = await prisma.calendarEvent.update({
    where: {
      id: Number(currentEvent.id),
    },
    data: updateData,
  })

  return mapCalendarEventRecord(event)
}

export async function deleteCalendarEventDb(id) {
  const currentEvent = await getCalendarEventByIdDb(id)

  if (!currentEvent) {
    throw new Error('Evento não encontrado.')
  }

  await prisma.calendarEvent.delete({
    where: {
      id: Number(currentEvent.id),
    },
  })

  return currentEvent
}
