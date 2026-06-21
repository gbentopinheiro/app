import { PrismaClient } from '@prisma/client'
import { createPrismaAdapter } from '../lib/prisma-adapter.js'
import {
  buildMysqlMigrationSnapshot,
  readMysqlMigrationSnapshot,
  snapshotFilePath,
  writeMysqlMigrationSnapshot,
} from './mysql-migration-utils.mjs'

const prisma = new PrismaClient({
  adapter: createPrismaAdapter(),
})

async function main() {
  const snapshot = await loadSnapshot()
  const target = snapshot.target

  await prisma.$connect()

  await prisma.$transaction([
    prisma.featureFlag.deleteMany(),
    prisma.auditTrailEvent.deleteMany(),
    prisma.calendarNotificationState.deleteMany(),
    prisma.calendarEvent.deleteMany(),
    prisma.personDocumentReminder.deleteMany(),
    prisma.material.deleteMany(),
    prisma.loginAttempt.deleteMany(),
    prisma.loginEvent.deleteMany(),
    prisma.dailyWorkNote.deleteMany(),
    prisma.workAssignment.deleteMany(),
    prisma.workPersonHourlyCost.deleteMany(),
    prisma.workRoleHourlyCost.deleteMany(),
    prisma.workWorkingDay.deleteMany(),
    prisma.user.deleteMany(),
    prisma.workPlan.deleteMany(),
    prisma.work.deleteMany(),
    prisma.person.deleteMany(),
    prisma.client.deleteMany(),
    prisma.company.deleteMany(),
  ])

  await prisma.company.createMany({ data: target.companies })
  await prisma.client.createMany({ data: target.clients })
  await prisma.person.createMany({ data: target.people })
  await prisma.work.createMany({ data: target.works.map(prepareWorkForImport) })
  await prisma.workWorkingDay.createMany({ data: target.workWorkingDays })
  await prisma.workRoleHourlyCost.createMany({ data: target.workRoleHourlyCosts })
  await prisma.workPersonHourlyCost.createMany({ data: target.workPersonHourlyCosts })
  await prisma.workPlan.createMany({ data: target.workPlans.map(prepareWorkPlanForImport) })
  await prisma.user.createMany({ data: target.users })
  await prisma.workAssignment.createMany({ data: target.workAssignments })
  await prisma.dailyWorkNote.createMany({ data: target.dailyWorkNotes.map(prepareDailyWorkNoteForImport) })
  await prisma.loginEvent.createMany({ data: target.loginEvents })
  await prisma.loginAttempt.createMany({ data: target.loginAttempts.map(prepareLoginAttemptForImport) })
  await prisma.auditTrailEvent.createMany({ data: target.auditTrailEvents.map(prepareAuditTrailEventForImport) })
  await prisma.material.createMany({ data: target.materials.map(prepareMaterialForImport) })
  await prisma.personDocumentReminder.createMany({
    data: target.personDocumentReminders.map(preparePersonDocumentReminderForImport),
  })
  await prisma.calendarEvent.createMany({
    data: target.calendarEvents.map(prepareCalendarEventForImport),
  })
  await prisma.calendarNotificationState.createMany({
    data: target.calendarNotificationStates.map(prepareCalendarNotificationStateForImport),
  })
  await prisma.featureFlag.createMany({
    data: target.featureFlags,
  })

  console.log('Importacao JSON -> MySQL concluida com sucesso.')
  console.log(JSON.stringify(snapshot.targetCounts, null, 2))
}

async function loadSnapshot() {
  try {
    const snapshot = await readMysqlMigrationSnapshot()

    if (
      Array.isArray(snapshot?.target?.calendarEvents) &&
      Array.isArray(snapshot?.target?.calendarNotificationStates) &&
      Array.isArray(snapshot?.target?.loginAttempts) &&
      Array.isArray(snapshot?.target?.auditTrailEvents) &&
      Array.isArray(snapshot?.target?.featureFlags)
    ) {
      return snapshot
    }

    const rebuiltSnapshot = await buildMysqlMigrationSnapshot()
    await writeMysqlMigrationSnapshot(rebuiltSnapshot)
    console.log(`Snapshot atualizado automaticamente em ${snapshotFilePath}`)
    return rebuiltSnapshot
  } catch (error) {
    const snapshot = await buildMysqlMigrationSnapshot()
    await writeMysqlMigrationSnapshot(snapshot)
    console.log(`Snapshot criado automaticamente em ${snapshotFilePath}`)
    return snapshot
  }
}

function toDateOnly(value) {
  if (!value) {
    return null
  }

  return new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`)
}

function prepareWorkForImport(work) {
  return {
    ...work,
    startDate: toDateOnly(work.startDate),
    endDate: toDateOnly(work.endDate),
  }
}

function prepareWorkPlanForImport(workPlan) {
  return {
    ...workPlan,
    date: toDateOnly(workPlan.date),
  }
}

function prepareDailyWorkNoteForImport(note) {
  return {
    ...note,
    date: toDateOnly(note.date),
  }
}

function prepareMaterialForImport(material) {
  return {
    ...material,
    createdAt: material.createdAt ? new Date(material.createdAt) : new Date(),
    updatedAt: material.updatedAt ? new Date(material.updatedAt) : new Date(),
  }
}

function prepareLoginAttemptForImport(loginAttempt) {
  return {
    ...loginAttempt,
    blockedUntil: loginAttempt.blockedUntil ? new Date(loginAttempt.blockedUntil) : null,
  }
}

function prepareAuditTrailEventForImport(auditTrailEvent) {
  return {
    ...auditTrailEvent,
    timestamp: auditTrailEvent.timestamp ? new Date(auditTrailEvent.timestamp) : new Date(),
  }
}

function preparePersonDocumentReminderForImport(reminder) {
  return {
    ...reminder,
    expirationDate: toDateOnly(reminder.expirationDate),
    createdAt: reminder.createdAt ? new Date(reminder.createdAt) : new Date(),
    updatedAt: reminder.updatedAt ? new Date(reminder.updatedAt) : new Date(),
  }
}

function prepareCalendarEventForImport(event) {
  return {
    ...event,
    date: toDateOnly(event.date),
    departureDate: toDateOnly(event.departureDate),
    arrivalDate: toDateOnly(event.arrivalDate),
    createdAt: event.createdAt ? new Date(event.createdAt) : new Date(),
    updatedAt: event.updatedAt ? new Date(event.updatedAt) : new Date(),
  }
}

function prepareCalendarNotificationStateForImport(item) {
  return {
    ...item,
    seenAt: item.seenAt ? new Date(item.seenAt) : new Date(),
  }
}

main()
  .catch(error => {
    console.error('Erro ao importar dados para MySQL:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
