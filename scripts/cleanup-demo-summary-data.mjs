import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { parse as parseDotenv } from 'dotenv'

import { getApprovedAssignmentHours } from '../lib/work-assignment-approval.js'
import {
  getFinancialSummaryCost,
  getFinancialSummaryHours,
  getFinancialSummarySourceField,
} from '../lib/work-financial-summary.js'

const DEFAULTS = Object.freeze({
  envFile: 'infra/environments/dev/.env',
  dbHost: '127.0.0.1',
  dbPort: '3307',
  dbName: 'bentix_test',
  clientName: 'S-BOUW BVBA',
  year: '2026',
})

function printHelp() {
  console.log(`
Inspecao e limpeza segura de dados de resumo/demo.

Objetivo:
  - provar de onde os resumos de clientes/obras leem os valores;
  - listar os registos que alimentam o resumo anual;
  - limpar apenas artefactos derivados/cache, se existirem;
  - nunca tocar em work_plans, work_assignments, obras, clientes, pessoas ou utilizadores.

Uso:
  npm run db:cleanup:demo-summary
  npm run db:cleanup:demo-summary -- --client-name "S-BOUW BVBA" --year 2026
  npm run db:cleanup:demo-summary -- --confirm

Opcoes:
  --env-file <path>        Ficheiro .env do ambiente. Default: ${DEFAULTS.envFile}
  --db-host <host>         Host MariaDB. Default: ${DEFAULTS.dbHost}
  --db-port <port>         Porto MariaDB. Default: ${DEFAULTS.dbPort}
  --db-user <user>         Utilizador MariaDB. Default: valor de DB_USER no env file
  --db-password <pass>     Password MariaDB. Default: valor de DB_PASSWORD no env file
  --db-name <name>         Base de dados. Default: ${DEFAULTS.dbName}
  --client-name <name>     Nome exato do cliente. Default: ${DEFAULTS.clientName}
  --work-name <name>       Nome exato da obra. Opcional.
  --year <YYYY>            Ano do resumo. Default: ${DEFAULTS.year}
  --dry-run                Forca simulacao. E o default.
  --confirm                Aplica limpeza apenas se existirem artefactos derivados suportados.
  --help                   Mostra esta ajuda.
`)
}

export function hasValue(value) {
  return value !== null && value !== undefined && value !== ''
}

function toFiniteNumber(value, fallback = 0) {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : fallback
}

export function getAnnualSummaryHours(assignment) {
  return getFinancialSummaryHours(assignment)
}

export function getAnnualSummarySourceField(assignment) {
  return getFinancialSummarySourceField(assignment)
}

export function getAnnualSummaryCost(assignment) {
  return getFinancialSummaryCost(assignment)
}

export function summarizeAssignmentContribution(assignment) {
  const annualSummaryHours = getAnnualSummaryHours(assignment)
  const annualSummaryCost = getAnnualSummaryCost(assignment)
  const workDetailApprovedHours = getApprovedAssignmentHours(assignment)

  return {
    annualSummaryHours,
    annualSummaryCost,
    annualSummarySourceField: getAnnualSummarySourceField(assignment),
    workDetailApprovedHours,
    appearsInWorkDetailSummary: workDetailApprovedHours > 0,
  }
}

export function buildAnnualSummaryMonthlyTotals(assignments, year) {
  const formatter = new Intl.DateTimeFormat('pt-PT', { month: 'long' })
  const rows = Array.from({ length: 12 }, (_, monthIndex) => ({
    monthKey: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
    monthLabel: formatter.format(new Date(Number(year), monthIndex, 1)),
    totalHours: 0,
    totalCost: 0,
    workIds: new Set(),
  }))

  for (const assignment of Array.isArray(assignments) ? assignments : []) {
    const planDate = String(assignment?.planDate || '')

    if (!planDate.startsWith(`${year}-`)) {
      continue
    }

    const monthNumber = Number.parseInt(planDate.slice(5, 7), 10)

    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      continue
    }

    const monthRow = rows[monthNumber - 1]
    monthRow.totalHours = Number((monthRow.totalHours + getAnnualSummaryHours(assignment)).toFixed(2))
    monthRow.totalCost = Number((monthRow.totalCost + getAnnualSummaryCost(assignment)).toFixed(2))
    monthRow.workIds.add(Number(assignment?.workId))
  }

  return rows.map(row => ({
    monthKey: row.monthKey,
    monthLabel: row.monthLabel,
    totalHours: row.totalHours,
    totalCost: row.totalCost,
    workCount: row.workIds.size,
  }))
}

function parseArgs(argv) {
  const args = Array.from(argv)
  const options = {
    dryRun: true,
    confirm: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--help') {
      options.help = true
      continue
    }

    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }

    if (arg === '--confirm') {
      options.confirm = true
      options.dryRun = false
      continue
    }

    if (!arg.startsWith('--')) {
      throw new Error(`Argumento inesperado: ${arg}`)
    }

    const value = args[index + 1]

    if (!value || value.startsWith('--')) {
      throw new Error(`Falta valor para ${arg}`)
    }

    index += 1

    switch (arg.slice(2)) {
      case 'env-file':
        options.envFile = value
        break
      case 'db-host':
        options.dbHost = value
        break
      case 'db-port':
        options.dbPort = value
        break
      case 'db-user':
        options.dbUser = value
        break
      case 'db-password':
        options.dbPassword = value
        break
      case 'db-name':
        options.dbName = value
        break
      case 'client-name':
        options.clientName = value
        break
      case 'work-name':
        options.workName = value
        break
      case 'year':
        options.year = value
        break
      default:
        throw new Error(`Opcao desconhecida: ${arg}`)
    }
  }

  return options
}

function readEnvFile(envFilePath) {
  const resolvedPath = resolve(process.cwd(), envFilePath)

  if (!existsSync(resolvedPath)) {
    return {
      resolvedPath,
      values: {},
      found: false,
    }
  }

  return {
    resolvedPath,
    values: parseDotenv(readFileSync(resolvedPath, 'utf8')),
    found: true,
  }
}

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    if (value === undefined || value === null) {
      continue
    }

    const normalizedValue = String(value).trim()

    if (normalizedValue) {
      return normalizedValue
    }
  }

  return ''
}

function maskPassword(value) {
  if (!value) {
    return '(vazio)'
  }

  return '*'.repeat(Math.min(String(value).length, 12))
}

function assertValidYear(year) {
  if (!/^\d{4}$/.test(String(year || '').trim())) {
    throw new Error(`Ano invalido: ${year}. Usa o formato YYYY.`)
  }
}

function buildDatabaseUrl(connection) {
  const user = encodeURIComponent(connection.dbUser)
  const password = encodeURIComponent(connection.dbPassword)
  return `mysql://${user}:${password}@${connection.dbHost}:${connection.dbPort}/${connection.dbName}`
}

function resolveConfig(options, envFile) {
  const envValues = envFile.values
  const dbHost = pickFirstNonEmpty(options.dbHost, process.env.DB_HOST, DEFAULTS.dbHost)
  const dbPort = pickFirstNonEmpty(options.dbPort, envValues.DB_PORT, process.env.DB_PORT, DEFAULTS.dbPort)
  const dbUser = pickFirstNonEmpty(options.dbUser, envValues.DB_USER, process.env.DB_USER)
  const dbPassword = pickFirstNonEmpty(options.dbPassword, envValues.DB_PASSWORD, process.env.DB_PASSWORD)
  const dbName = pickFirstNonEmpty(options.dbName, envValues.DB_NAME, process.env.DB_NAME, DEFAULTS.dbName)
  const clientName = pickFirstNonEmpty(options.clientName, DEFAULTS.clientName)
  const workName = pickFirstNonEmpty(options.workName)
  const year = pickFirstNonEmpty(options.year, DEFAULTS.year)
  const containerName = pickFirstNonEmpty(envValues.DB_CONTAINER_NAME, process.env.DB_CONTAINER_NAME, 'bentix-dev-db')

  assertValidYear(year)

  if (!dbUser || !dbPassword) {
    throw new Error(
      'Nao foi possivel resolver DB_USER/DB_PASSWORD. Indica --db-user/--db-password ou usa um env file com essas variaveis.',
    )
  }

  return {
    dryRun: options.dryRun !== false,
    envFilePath: envFile.resolvedPath,
    envFileFound: envFile.found,
    connection: {
      containerName,
      dbHost,
      dbPort: Number.parseInt(dbPort, 10),
      dbUser,
      dbPassword,
      dbName,
    },
    target: {
      clientName,
      workName,
      year,
    },
  }
}

function createPrismaClient(databaseUrl) {
  return new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
    log: ['error'],
  })
}

function isTrueLike(value) {
  if (value === true) {
    return true
  }

  if (typeof value === 'number') {
    return value === 1
  }

  if (typeof value === 'bigint') {
    return value === 1n
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase()
    return normalizedValue === '1' || normalizedValue === 'true'
  }

  if (Buffer.isBuffer(value) && value.length > 0) {
    return value[0] === 1
  }

  return false
}

function formatNullable(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return String(value)
}

function formatDecimal(value) {
  const normalized = Number(value)

  if (!Number.isFinite(normalized)) {
    return '-'
  }

  return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(2)
}

async function findPotentialDerivedSummaryArtifacts(prisma, databaseName) {
  const tables = await prisma.$queryRaw`
    SELECT
      TABLE_NAME AS tableName,
      TABLE_TYPE AS tableType
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ${databaseName}
      AND (
        UPPER(TABLE_NAME) LIKE '%SUMMARY%'
        OR UPPER(TABLE_NAME) LIKE '%CACHE%'
      )
    ORDER BY TABLE_NAME ASC
  `

  const columns = await prisma.$queryRaw`
    SELECT
      TABLE_NAME AS tableName,
      COLUMN_NAME AS columnName
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ${databaseName}
      AND (
        UPPER(COLUMN_NAME) LIKE '%SUMMARY%'
        OR UPPER(COLUMN_NAME) LIKE '%CACHE%'
      )
    ORDER BY TABLE_NAME ASC, COLUMN_NAME ASC
  `

  return {
    tables,
    columns,
  }
}

async function findSummaryAssignments(prisma, target) {
  const rows = await prisma.$queryRaw`
    SELECT
      wa.id AS assignmentId,
      wa.work_plan_id AS workPlanId,
      DATE_FORMAT(wp.date, '%Y-%m-%d') AS planDate,
      c.id AS clientId,
      c.name AS clientName,
      w.id AS workId,
      w.number AS workNumber,
      w.name AS workName,
      p.id AS personId,
      p.name AS personName,
      wa.hours AS hours,
      wa.daily_hours AS dailyHours,
      wa.approved_hours AS approvedHours,
      wa.hourly_cost AS hourlyCost,
      wa.submitted AS submitted,
      wa.submitted_at AS submittedAt,
      wa.admin_approved_at AS adminApprovedAt
    FROM work_assignments wa
    INNER JOIN work_plans wp ON wp.id = wa.work_plan_id
    INNER JOIN works w ON w.id = wa.work_id
    INNER JOIN clients c ON c.id = w.client_id
    INNER JOIN people p ON p.id = wa.person_id
    WHERE UPPER(c.name) = UPPER(${target.clientName})
      AND YEAR(wp.date) = ${Number.parseInt(target.year, 10)}
    ORDER BY wp.date ASC, w.id ASC, p.name ASC, wa.id ASC
  `

  const normalizedWorkFilter = String(target.workName || '').trim().toUpperCase()

  return rows.filter(row => {
    if (!normalizedWorkFilter) {
      return true
    }

    return String(row.workName || '').trim().toUpperCase() === normalizedWorkFilter
  })
}

function buildContributorRows(rows) {
  return rows.map(row => {
    const contribution = summarizeAssignmentContribution(row)

    return {
      assignmentId: Number(row.assignmentId),
      workPlanId: Number(row.workPlanId),
      planDate: String(row.planDate || ''),
      work: `${formatNullable(row.workNumber)} - ${formatNullable(row.workName)}`,
      person: formatNullable(row.personName),
      hours: formatDecimal(row.hours),
      dailyHours: formatDecimal(row.dailyHours),
      approvedHours: formatDecimal(row.approvedHours),
      hourlyCost: formatDecimal(row.hourlyCost),
      annualSource: contribution.annualSummarySourceField,
      annualHours: formatDecimal(contribution.annualSummaryHours),
      annualCost: formatDecimal(contribution.annualSummaryCost),
      workDetailHours: formatDecimal(contribution.workDetailApprovedHours),
      submitted: isTrueLike(row.submitted) ? 'sim' : 'nao',
      submittedAt: formatNullable(row.submittedAt),
      approvedAt: formatNullable(row.adminApprovedAt),
    }
  })
}

function buildTotals(monthRows) {
  return monthRows.reduce(
    (totals, row) => ({
      totalHours: Number((totals.totalHours + Number(row.totalHours || 0)).toFixed(2)),
      totalCost: Number((totals.totalCost + Number(row.totalCost || 0)).toFixed(2)),
    }),
    { totalHours: 0, totalCost: 0 },
  )
}

function printTargetSummary(config) {
  console.log('Resumo da execucao:')
  console.table([{
    ambiente: 'DEV/LOCAL',
    container: config.connection.containerName,
    baseDeDados: config.connection.dbName,
    host: config.connection.dbHost,
    porto: config.connection.dbPort,
    utilizadorBd: config.connection.dbUser,
    passwordBd: maskPassword(config.connection.dbPassword),
    cliente: config.target.clientName,
    obra: config.target.workName || '(todas)',
    ano: config.target.year,
    modo: config.dryRun ? 'dry-run' : 'confirmado',
    envFile: config.envFileFound ? config.envFilePath : `${config.envFilePath} (nao encontrado)`,
  }])
}

function printSummaryArchitecture() {
  console.log('')
  console.log('Arquitetura atual dos resumos:')
  console.log('- Resumo anual geral/clientes: work_assignments + work_plans + works + clients.')
  console.log('- Campos usados no resumo anual: apenas horas aprovadas (approved_hours/admin approved), hourly_cost, work_plans.date e works.client_id.')
  console.log('- Resumo da obra: work_assignments + work_plans.')
  console.log('- Campos usados no resumo da obra: approved_hours, hourly_cost, admin_approved_at e submitted_at.')
  console.log('- O campo daily_hours nao alimenta estes resumos.')
}

function printDerivedArtifactSummary(artifacts) {
  console.log('')
  console.log('Artefactos derivados/cache pesquisados na base:')

  if (artifacts.tables.length === 0 && artifacts.columns.length === 0) {
    console.log('Nenhuma tabela/coluna de summary/cache foi encontrada.')
    return
  }

  if (artifacts.tables.length > 0) {
    console.log('Tabelas/views encontradas:')
    console.table(artifacts.tables)
  }

  if (artifacts.columns.length > 0) {
    console.log('Colunas encontradas:')
    console.table(artifacts.columns)
  }
}

function printAssignmentInvestigation(rows, monthRows) {
  console.log('')
  console.log('Registos que alimentam o resumo anual atual:')

  if (rows.length === 0) {
    console.log('Nenhuma afetacao encontrada para o cliente/ano indicados.')
  } else {
    console.table(buildContributorRows(rows))
  }

  console.log('')
  console.log('Resumo mensal replicado com a logica atual de app/works/page.js:')
  console.table(monthRows.map(row => ({
    mes: row.monthLabel,
    horas: formatDecimal(row.totalHours),
    custo: formatDecimal(row.totalCost),
    obras: row.workCount,
  })))

  const totals = buildTotals(monthRows)

  console.log('')
  console.log(`Total anual replicado: ${formatDecimal(totals.totalHours)}h | ${formatDecimal(totals.totalCost)} EUR`)

  const ignoredRows = buildContributorRows(rows).filter(
    row =>
      row.annualSource === 'notApproved' &&
      (Number(row.hours) > 0 || Number(row.dailyHours) > 0),
  )

  console.log('')
  if (ignoredRows.length === 0) {
    console.log('Nenhum registo com horas nao aprovadas foi encontrado para este cliente/ano.')
  } else {
    console.log('Registos com horas nao aprovadas que ficam fora do resumo financeiro anual:')
    console.table(ignoredRows)
  }
}

function printPlannedChanges(artifacts) {
  console.log('')
  console.log('Plano de alteracao:')

  if (artifacts.tables.length === 0 && artifacts.columns.length === 0) {
    console.table([{
      alvo: 'summary/cache derivados',
      registos: 0,
      acao: 'nenhuma',
      motivo: 'os resumos atuais sao calculados diretamente a partir de work_assignments',
    }])
    return
  }

  console.table([{
    alvo: 'summary/cache derivados',
    registos: 0,
    acao: 'nenhuma',
    motivo: 'artefactos encontrados, mas esta limpeza nao altera automaticamente estruturas nao suportadas',
  }])
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.help) {
    printHelp()
    return
  }

  const envFile = readEnvFile(options.envFile || DEFAULTS.envFile)
  const config = resolveConfig(options, envFile)
  const databaseUrl = buildDatabaseUrl(config.connection)
  const prisma = createPrismaClient(databaseUrl)

  console.log('Investigacao segura de dados de demonstracao nos resumos')
  console.log('Este comando nunca altera work_plans, work_assignments, obras, clientes, pessoas ou utilizadores.')

  try {
    const [artifacts, rows] = await Promise.all([
      findPotentialDerivedSummaryArtifacts(prisma, config.connection.dbName),
      findSummaryAssignments(prisma, config.target),
    ])

    const monthRows = buildAnnualSummaryMonthlyTotals(rows, config.target.year)

    console.log('')
    printTargetSummary(config)
    printSummaryArchitecture()
    printDerivedArtifactSummary(artifacts)
    printAssignmentInvestigation(rows, monthRows)
    printPlannedChanges(artifacts)

    if (config.dryRun) {
      console.log('')
      console.log('Dry-run concluido. Nenhuma alteracao foi aplicada.')
      return
    }

    console.log('')
    console.log('Nenhuma alteracao aplicada.')
    console.log('Motivo: nao foram encontrados dados derivados de resumo suportados para limpeza segura.')
    console.log('Para remover valores do resumo atual seria necessario limpar approved_hours/admin_approved_at relevantes ou alterar dados aprovados.')
  } finally {
    await prisma.$disconnect()
  }
}

const isDirectExecution = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false

if (isDirectExecution) {
  main().catch(error => {
    console.error('')
    console.error('Falha ao investigar/limpar dados de resumo da demo:', error)
    process.exit(error?.exitCode ?? 1)
  })
}
