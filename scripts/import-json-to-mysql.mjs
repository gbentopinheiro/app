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

  console.log('Importacao JSON -> MySQL concluida com sucesso.')
  console.log(JSON.stringify(snapshot.targetCounts, null, 2))
}

async function loadSnapshot() {
  try {
    return await readMysqlMigrationSnapshot()
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

main()
  .catch(error => {
    console.error('Erro ao importar dados para MySQL:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
