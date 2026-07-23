import { PrismaClient } from '@prisma/client'
import { createPrismaAdapter } from '../lib/prisma-adapter.js'
import {
  buildMysqlValidationBaselineFromCounts,
  getMysqlCountSnapshot,
  readMysqlValidationBaseline,
  validationBaselineFilePath,
  writeMysqlValidationBaseline,
} from './mysql-validation-baseline-utils.mjs'

const prisma = new PrismaClient({
  adapter: createPrismaAdapter(),
})

async function main() {
  await prisma.$connect()

  const actualCounts = await getMysqlCountSnapshot(prisma)
  const baseline = await loadValidationBaseline(actualCounts)

  const expectedCounts = baseline.targetCounts
  const mismatches = Object.entries(expectedCounts).filter(
    ([key, expectedValue]) => actualCounts[key] !== expectedValue,
  )

  console.log(`Baseline de validacao: ${validationBaselineFilePath}`)
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

async function loadValidationBaseline(actualCounts) {
  try {
    return await readMysqlValidationBaseline()
  } catch (error) {
    const baseline = buildMysqlValidationBaselineFromCounts(actualCounts)
    await writeMysqlValidationBaseline(baseline)
    console.log(`Baseline de validacao criada automaticamente em ${validationBaselineFilePath}`)
    return baseline
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
