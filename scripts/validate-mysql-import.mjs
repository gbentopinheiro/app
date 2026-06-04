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

  await prisma.$connect()

  const actualCounts = {
    companies: await prisma.company.count(),
    clients: await prisma.client.count(),
    people: await prisma.person.count(),
    works: await prisma.work.count(),
    workWorkingDays: await prisma.workWorkingDay.count(),
    workRoleHourlyCosts: await prisma.workRoleHourlyCost.count(),
    workPersonHourlyCosts: await prisma.workPersonHourlyCost.count(),
    workPlans: await prisma.workPlan.count(),
    users: await prisma.user.count(),
    workAssignments: await prisma.workAssignment.count(),
    dailyWorkNotes: await prisma.dailyWorkNote.count(),
    loginEvents: await prisma.loginEvent.count(),
  }

  const expectedCounts = snapshot.targetCounts
  const mismatches = Object.entries(expectedCounts).filter(
    ([key, expectedValue]) => actualCounts[key] !== expectedValue,
  )

  console.log('Contagens esperadas:')
  console.log(JSON.stringify(expectedCounts, null, 2))
  console.log('Contagens atuais em MySQL:')
  console.log(JSON.stringify(actualCounts, null, 2))

  if (mismatches.length > 0) {
    console.error('Falha na validacao de contagens:')
    mismatches.forEach(([key, expectedValue]) => {
      console.error(`- ${key}: esperado ${expectedValue}, atual ${actualCounts[key]}`)
    })
    process.exitCode = 1
    return
  }

  console.log('Validacao MySQL concluida sem divergencias.')
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

main()
  .catch(error => {
    console.error('Erro ao validar dados em MySQL:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
