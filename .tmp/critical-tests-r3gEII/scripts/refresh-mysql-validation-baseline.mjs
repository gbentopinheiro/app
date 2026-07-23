import { PrismaClient } from '@prisma/client'
import { createPrismaAdapter } from '../lib/prisma-adapter.js'
import {
  buildMysqlValidationBaselineFromCounts,
  getMysqlCountSnapshot,
  validationBaselineFilePath,
  writeMysqlValidationBaseline,
} from './mysql-validation-baseline-utils.mjs'

const prisma = new PrismaClient({
  adapter: createPrismaAdapter(),
})

async function main() {
  await prisma.$connect()

  const counts = await getMysqlCountSnapshot(prisma)
  const baseline = buildMysqlValidationBaselineFromCounts(counts)
  await writeMysqlValidationBaseline(baseline)

  console.log(`Baseline MySQL atualizada em ${validationBaselineFilePath}`)
  console.log(JSON.stringify(baseline.targetCounts, null, 2))
}

main()
  .catch(error => {
    console.error('Erro ao atualizar baseline de validacao MySQL:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
