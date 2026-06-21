import { prisma } from '../prisma.js'
import { toDateTimeString, toRequiredString } from './core-mappers.js'

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase()
}

function normalizeSeenAt(seenAt) {
  const value = String(seenAt || '').trim()
  return Number.isNaN(new Date(value).getTime()) ? new Date().toISOString() : value
}

function mapCalendarNotificationStateRecord(record) {
  if (!record) {
    return null
  }

  return {
    username: normalizeUsername(record.username),
    seenAt: toDateTimeString(record.seenAt),
  }
}

export async function getCalendarNotificationStateDb(username) {
  const normalizedUsername = normalizeUsername(username)

  if (!normalizedUsername) {
    return null
  }

  const item = await prisma.calendarNotificationState.findUnique({
    where: {
      username: normalizedUsername,
    },
  })

  return mapCalendarNotificationStateRecord(item)
}

export async function markCalendarNotificationsSeenDb(username, seenAt = new Date().toISOString()) {
  const normalizedUsername = normalizeUsername(username)

  if (!normalizedUsername) {
    return null
  }

  const item = await prisma.calendarNotificationState.upsert({
    where: {
      username: normalizedUsername,
    },
    update: {
      seenAt: new Date(normalizeSeenAt(seenAt)),
    },
    create: {
      username: toRequiredString(normalizedUsername),
      seenAt: new Date(normalizeSeenAt(seenAt)),
    },
  })

  return mapCalendarNotificationStateRecord(item)
}
