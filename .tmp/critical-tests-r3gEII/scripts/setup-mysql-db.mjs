import { spawnSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import { createPrismaAdapter } from '../lib/prisma-adapter.js'
import { getMysqlCountSnapshot } from './mysql-validation-baseline-utils.mjs'
import {
  MYSQL_SETUP_CONFIRM_ENV,
  MYSQL_SETUP_CONFIRM_FLAG,
  readMysqlSetupConfirmation,
  summarizeMysqlCounts,
} from './mysql-setup-utils.mjs'

const stages = [
  {
    label: 'Sincronizar schema Prisma com MySQL',
    command: resolveCommand('npx'),
    args: ['prisma', 'db', 'push'],
  },
  {
    label: 'Importar snapshot JSON para MySQL',
    command: resolveCommand('npm'),
    args: ['run', 'db:import:mysql'],
  },
  {
    label: 'Validar contagens finais',
    command: resolveCommand('npm'),
    args: ['run', 'db:validate:mysql'],
  },
]

async function main() {
  const confirmation = readMysqlSetupConfirmation()

  console.log('Preparacao segura da base MySQL/MariaDB')
  console.log('Fluxo: prisma db push -> db:import:mysql -> db:validate:mysql')

  runStage(0)
  await verifyImportSafety(confirmation)
  runStage(1)
  runStage(2)

  console.log('')
  console.log('Base MySQL/MariaDB preparada com sucesso.')
}

function resolveCommand(commandName) {
  return process.platform === 'win32' ? `${commandName}.cmd` : commandName
}

function runStage(stageIndex) {
  const stage = stages[stageIndex]

  console.log('')
  console.log(`=== [${stageIndex + 1}/${stages.length}] ${stage.label} ===`)
  console.log(`> ${stage.command} ${stage.args.join(' ')}`)

  const result = spawnSync(stage.command, stage.args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const error = new Error(`Falha na etapa: ${stage.label}`)
    error.exitCode = result.status ?? 1
    error.alreadyLogged = true
    throw error
  }
}

async function verifyImportSafety(confirmation) {
  let prisma

  try {
    prisma = new PrismaClient({
      adapter: createPrismaAdapter(),
    })

    await prisma.$connect()

    const countSnapshot = await getMysqlCountSnapshot(prisma)
    const summary = summarizeMysqlCounts(countSnapshot)

    console.log('')
    console.log('=== Verificacao de seguranca antes da importacao ===')

    if (!summary.hasExistingData) {
      console.log('Base sem dados aplicacionais detetados. A importacao pode avancar.')
      return
    }

    console.log('Foram detetados dados existentes nas tabelas aplicacionais:')
    summary.nonEmptyEntries.forEach(([key, value]) => {
      console.log(`- ${key}: ${value}`)
    })
    console.log(`Total de registos detetados: ${summary.totalRows}`)
    console.log('A etapa "npm run db:import:mysql" apaga e repovoa dados antes de importar o snapshot.')

    if (confirmation.confirmed) {
      console.log(`Continuacao autorizada por ${confirmation.source}.`)
      return
    }

    console.error('Importacao bloqueada para evitar apagar dados existentes sem confirmacao explicita.')
    console.error(`Repete o comando com ${MYSQL_SETUP_CONFIRM_FLAG} ou define ${MYSQL_SETUP_CONFIRM_ENV}=1 apenas para esta execucao.`)

    const error = new Error('Importacao bloqueada por verificacao de seguranca.')
    error.exitCode = 1
    error.alreadyLogged = true
    throw error
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}

main().catch(error => {
  if (!error?.alreadyLogged) {
    console.error('')
    console.error('Falha ao preparar a base MySQL/MariaDB:', error)
  }

  process.exit(error?.exitCode ?? 1)
})
