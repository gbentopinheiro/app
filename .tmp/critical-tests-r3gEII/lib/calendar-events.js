import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import {
  createCalendarEventDb,
  deleteCalendarEventDb,
  getAllCalendarEventsDb,
  updateCalendarEventDb,
} from './db/calendar-events-db.js'
import { isMysqlDataSourceEnabled } from './data-source.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '..', 'data')
const eventsFilePath = join(dataDir, 'calendar-events.json')
const defaultEventColor = '#2563eb'
const allowedEventColors = new Set(['#16a34a', '#2563eb', '#dc2626', '#111111'])
const allowedEventTypes = new Set(['viagem'])
const allowedTravelTransports = new Set(['comboio', 'aviao'])
const allowedTravelAirports = new Set(['zaventem', 'charleroi', 'bruxelles-midi', 'outro'])

export class CalendarEvent {
  constructor(data) {
    this.id = data.id
    this.date = String(data.date || '').trim()
    this.title = String(data.title || '').trim()
    this.type = normalizeEventType(data.type)
    this.transport = normalizeTravelTransport(data.transport)
    this.airport = normalizeTravelAirport(data.airport)
    this.destination = String(data.destination || '').trim()
    this.departureDate = String(data.departureDate || data.date || '').trim()
    this.arrivalDate = String(data.arrivalDate || '').trim()
    this.departureTime = String(data.departureTime || '').trim()
    this.arrivalTime = String(data.arrivalTime || '').trim()
    this.outboundFlightReference = String(data.outboundFlightReference || '').trim()
    this.returnFlightReference = String(data.returnFlightReference || '').trim()
    this.color = normalizeEventColor(data.color)
    this.createdBy = String(data.createdBy || '').trim()
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || this.createdAt
  }
}

export class CalendarEventsService {
  constructor(filePath = eventsFilePath) {
    this.filePath = filePath
    this.events = this.load()
  }

  ensureDataDir() {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  }

  load() {
    this.ensureDataDir()

    if (!existsSync(this.filePath)) {
      return []
    }

    try {
      const rawData = JSON.parse(readFileSync(this.filePath, 'utf8'))
      return normalizeEvents(rawData)
    } catch (error) {
      console.error('Error loading calendar events:', error.message)
      return []
    }
  }

  save() {
    if (isMysqlDataSourceEnabled()) {
      return
    }

    this.ensureDataDir()
    writeFileSync(this.filePath, JSON.stringify(this.events, null, 2), 'utf8')
  }

  refresh() {
    this.events = this.load()
    return this.events
  }

  getAll(filters = {}) {
    return this.refresh()
      .filter(event => !filters.year || new Date(`${event.date}T00:00:00`).getFullYear() === Number(filters.year))
      .filter(event => !filters.month || new Date(`${event.date}T00:00:00`).getMonth() + 1 === Number(filters.month))
  }

  getNextId() {
    if (this.events.length === 0) return 1
    return Math.max(...this.events.map(event => event.id)) + 1
  }

  create(data) {
    this.refresh()
    validateEventData(data)

    const event = new CalendarEvent({
      ...data,
      id: this.getNextId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    this.events.push(event)
    this.save()
    return event
  }

  update(id, data) {
    this.refresh()
    validateEventData(data)

    const eventId = parseInt(id)
    const currentIndex = this.events.findIndex(event => event.id === eventId)

    if (currentIndex < 0) {
      throw new Error('Evento não encontrado.')
    }

    const event = new CalendarEvent({
      ...this.events[currentIndex],
      ...data,
      id: eventId,
      createdAt: this.events[currentIndex].createdAt,
      updatedAt: new Date().toISOString(),
    })

    this.events[currentIndex] = event
    this.save()
    return event
  }

  delete(id) {
    this.refresh()

    const eventId = parseInt(id)
    const currentIndex = this.events.findIndex(event => event.id === eventId)

    if (currentIndex < 0) {
      throw new Error('Evento não encontrado.')
    }

    const [event] = this.events.splice(currentIndex, 1)
    this.save()
    return event
  }
}

function normalizeEvents(list) {
  if (!Array.isArray(list)) return []

  return list
    .map((event, index) => new CalendarEvent({
      ...event,
      id: event.id !== undefined ? parseInt(event.id) : index + 1,
    }))
    .filter(event => event.date && event.title)
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

  if (!allowedEventColors.has(color)) {
    throw new Error('Escolhe uma cor válida.')
  }

  if (!allowedEventTypes.has(type)) {
    throw new Error('Escolhe um tipo de evento válido.')
  }

  if (type === 'viagem' && (!allowedTravelTransports.has(transport) || !allowedTravelAirports.has(airport))) {
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

function normalizeEventColor(color) {
  const normalizedColor = String(color || defaultEventColor).trim().toLowerCase()
  return allowedEventColors.has(normalizedColor) ? normalizedColor : defaultEventColor
}

function normalizeEventType(type) {
  const normalizedType = String(type || 'viagem').trim().toLowerCase()
  return allowedEventTypes.has(normalizedType) ? normalizedType : 'viagem'
}

function normalizeTravelTransport(transport) {
  const normalizedTransport = String(transport || 'aviao').trim().toLowerCase()
  return allowedTravelTransports.has(normalizedTransport) ? normalizedTransport : 'aviao'
}

function normalizeTravelAirport(airport) {
  const normalizedAirport = String(airport || 'charleroi').trim().toLowerCase()
  return allowedTravelAirports.has(normalizedAirport) ? normalizedAirport : 'charleroi'
}

let calendarEventsService = null

function getLegacyCalendarEventsService() {
  if (isMysqlDataSourceEnabled()) {
    return null
  }

  if (!calendarEventsService) {
    calendarEventsService = new CalendarEventsService()
  }

  return calendarEventsService
}

function getAllCalendarEventsJson(filters) {
  return getLegacyCalendarEventsService()?.getAll(filters) || []
}

function createCalendarEventJson(data) {
  return getLegacyCalendarEventsService()?.create(data) || null
}

function updateCalendarEventJson(id, data) {
  return getLegacyCalendarEventsService()?.update(id, data) || null
}

function deleteCalendarEventJson(id) {
  return getLegacyCalendarEventsService()?.delete(id) || null
}

export async function getAllCalendarEvents(filters) {
  if (!isMysqlDataSourceEnabled()) {
    return getAllCalendarEventsJson(filters)
  }

  return getAllCalendarEventsDb(filters)
}

export async function createCalendarEvent(data) {
  if (!isMysqlDataSourceEnabled()) {
    return createCalendarEventJson(data)
  }

  return createCalendarEventDb(data)
}

export async function updateCalendarEvent(id, data) {
  if (!isMysqlDataSourceEnabled()) {
    return updateCalendarEventJson(id, data)
  }

  return updateCalendarEventDb(id, data)
}

export async function deleteCalendarEvent(id) {
  if (!isMysqlDataSourceEnabled()) {
    return deleteCalendarEventJson(id)
  }

  return deleteCalendarEventDb(id)
}
