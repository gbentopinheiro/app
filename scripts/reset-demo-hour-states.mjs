import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { parse as parseDotenv } from 'dotenv'

const DEFAULTS = Object.freeze({
  envFile: 'infra/environments/dev/.env',
  dbHost: '127.0.0.1',
  dbPort: '3307',
  dbName: 'bentix_test',
  personName: 'Simion Buburuzan',
  username: 'Simion_Buburuzan',
  workName: 'ZACK 25',
  date: '2026-06-30',
  approverUsername: 'admin',
})

const RESET_FIELDS = Object.freeze({
  submitted: false,
  submittedAt: null,
  submittedByUserId: null,
  submittedByName: null,
  approvedHours: null,
  adminApprovedAt: null,
  adminApprovedByUserId: null,
  adminApprovedByName: null,
})

function printHelp() {
  console.log(`
Limpeza segura de submissao/aprovacao de horas para demo DEV.

Uso:
  node scripts/reset-demo-hour-states.mjs [opcoes]

Opcoes:
  --env-file <path>           Ficheiro .env do ambiente DEV. Default: ${DEFAULTS.envFile}
  --db-host <host>            Host MariaDB. Default: ${DEFAULTS.dbHost}
  --db-port <port>            Porto MariaDB. Default: ${DEFAULTS.dbPort}
  --db-user <user>            Utilizador MariaDB. Default: valor de DB_USER no env file
  --db-password <password>    Password MariaDB. Default: valor de DB_PASSWORD no env file
  --db-name <name>            Base de dados. Default: ${DEFAULTS.dbName}
  --person-name <name>        Nome da pessoa alvo. Default: ${DEFAULTS.personName}
  --username <username>       Username esperado de submissao. Default: ${DEFAULTS.username}
  --work-name <name>          Nome exato da obra. Default: ${DEFAULTS.workName}
  --date <YYYY-MM-DD>         Data do plano diario. Default: ${DEFAULTS.date}
  --approver-username <name>  Username esperado do aprovador. Default: ${DEFAULTS.approverUsername}
  --dry-run                   Forca modo simulacao. E o default.
  --confirm                   Aplica a limpeza. Sem esta flag nao altera nada.
  --help                      Mostra esta ajuda.

Exemplos:
  npm run db:reset:demo-hours
  npm run db:reset:demo-hours -- --confirm
  npm run db:reset:demo-hours -- --env-file /srv/bentix/app/infra/environments/dev/.env --confirm
`)
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

    const key = arg.slice(2)
    const value = args[index + 1]

    if (!value || value.startsWith('--')) {
      throw new Error(`Falta valor para ${arg}`)
    }

    index += 1

    switch (key) {
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
      case 'person-name':
        options.personName = value
        break
      case 'username':
        options.username = value
        break
      case 'work-name':
        options.workName = value
        break
      case 'date':
        options.date = value
        break
      case 'approver-username':
        options.approverUsername = value
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

function assertValidDate(dateValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateValue || '').trim())) {
    throw new Error(`Data invalida: ${dateValue}. Usa o formato YYYY-MM-DD.`)
  }
}

function buildDatabaseUrl(connection) {
  const user = encodeURIComponent(connection.dbUser)
  const password = encodeURIComponent(connection.dbPassword)
  const host = connection.dbHost
  const port = connection.dbPort
  const dbName = connection.dbName

  return `mysql://${user}:${password}@${host}:${port}/${dbName}`
}

function resolveConfig(options, envFile) {
  const envValues = envFile.values
  const dbHost = pickFirstNonEmpty(options.dbHost, process.env.DB_HOST, DEFAULTS.dbHost)
  const dbPort = pickFirstNonEmpty(options.dbPort, envValues.DB_PORT, process.env.DB_PORT, DEFAULTS.dbPort)
  const dbUser = pickFirstNonEmpty(options.dbUser, envValues.DB_USER, process.env.DB_USER)
  const dbPassword = pickFirstNonEmpty(options.dbPassword, envValues.DB_PASSWORD, process.env.DB_PASSWORD)
  const dbName = pickFirstNonEmpty(options.dbName, envValues.DB_NAME, process.env.DB_NAME, DEFAULTS.dbName)
  const targetDate = pickFirstNonEmpty(options.date, DEFAULTS.date)
  const personName = pickFirstNonEmpty(options.personName, DEFAULTS.personName)
  const username = pickFirstNonEmpty(options.username, DEFAULTS.username)
  const workName = pickFirstNonEmpty(options.workName, DEFAULTS.workName)
  const approverUsername = pickFirstNonEmpty(options.approverUsername, DEFAULTS.approverUsername)
  const containerName = pickFirstNonEmpty(envValues.DB_CONTAINER_NAME, process.env.DB_CONTAINER_NAME, 'bentix-dev-db')

  assertValidDate(targetDate)

  if (!dbUser || !dbPassword) {
    throw new Error(
      'Nao foi possivel resolver DB_USER/DB_PASSWORD. Indica --db-user/--db-password ou usa um env file DEV com essas variaveis.',
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
      personName,
      username,
      workName,
      date: targetDate,
      approverUsername,
    },
  }
}

function createPrismaClient(databaseUrl) {
  return new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
    log: ['error'],
  })
}

function normalizeComparableValue(value) {
  return String(value || '').trim().toUpperCase()
}

function valuesMatch(left, right) {
  return normalizeComparableValue(left) !== '' && normalizeComparableValue(left) === normalizeComparableValue(right)
}

function formatNullable(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return String(value)
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

function hasSubmissionState(row) {
  return (
    isTrueLike(row.submitted) ||
    row.submittedAt !== null ||
    row.submittedByUserId !== null ||
    String(row.submittedByName || '').trim() !== ''
  )
}

function hasApprovalState(row) {
  return (
    row.approvedHours !== null ||
    row.adminApprovedAt !== null ||
    row.adminApprovedByUserId !== null ||
    String(row.adminApprovedByName || '').trim() !== ''
  )
}

function formatTargetSummary(config) {
  return {
    ambiente: 'DEV',
    container: config.connection.containerName,
    baseDeDados: config.connection.dbName,
    host: config.connection.dbHost,
    porto: config.connection.dbPort,
    utilizadorBd: config.connection.dbUser,
    passwordBd: maskPassword(config.connection.dbPassword),
    pessoa: config.target.personName,
    username: config.target.username,
    obra: config.target.workName,
    data: config.target.date,
    aprovador: config.target.approverUsername,
    modo: config.dryRun ? 'dry-run' : 'confirmado',
  }
}

async function resolvePerson(prisma, target) {
  const rows = await prisma.$queryRaw`
    SELECT
      p.id AS personId,
      p.name AS personName,
      p.role AS personRole,
      u.id AS userId,
      u.username AS username,
      u.name AS userDisplayName
    FROM people p
    LEFT JOIN users u ON u.person_id = p.id
    WHERE UPPER(p.name) = UPPER(${target.personName})
       OR UPPER(COALESCE(u.username, '')) = UPPER(${target.username})
    ORDER BY p.id ASC
  `

  return rows
}

async function resolveWork(prisma, target) {
  const rows = await prisma.$queryRaw`
    SELECT
      w.id AS workId,
      w.number AS workNumber,
      w.name AS workName,
      c.id AS clientId,
      c.name AS clientName
    FROM works w
    INNER JOIN clients c ON c.id = w.client_id
    WHERE UPPER(w.name) = UPPER(${target.workName})
    ORDER BY w.id ASC
  `

  return rows
}

async function resolveApprover(prisma, target) {
  const rows = await prisma.$queryRaw`
    SELECT
      u.id AS userId,
      u.username AS username,
      u.name AS displayName
    FROM users u
    WHERE UPPER(u.username) = UPPER(${target.approverUsername})
    ORDER BY u.id ASC
  `

  return rows
}

async function findMatchingAssignments(prisma, personId, workId, targetDate) {
  return prisma.$queryRaw`
    SELECT
      wa.id AS assignmentId,
      wa.work_plan_id AS workPlanId,
      DATE_FORMAT(wp.date, '%Y-%m-%d') AS planDate,
      wa.work_id AS workId,
      w.number AS workNumber,
      w.name AS workName,
      wa.person_id AS personId,
      p.name AS personName,
      wa.hours AS hours,
      wa.daily_hours AS dailyHours,
      wa.submitted AS submitted,
      wa.submitted_at AS submittedAt,
      wa.submitted_by_user_id AS submittedByUserId,
      wa.submitted_by_name AS submittedByName,
      submitter.username AS submittedByUsername,
      wa.approved_hours AS approvedHours,
      wa.admin_approved_at AS adminApprovedAt,
      wa.admin_approved_by_user_id AS adminApprovedByUserId,
      wa.admin_approved_by_name AS adminApprovedByName,
      approver.username AS adminApprovedByUsername
    FROM work_assignments wa
    INNER JOIN work_plans wp ON wp.id = wa.work_plan_id
    INNER JOIN works w ON w.id = wa.work_id
    INNER JOIN people p ON p.id = wa.person_id
    LEFT JOIN users submitter ON submitter.id = wa.submitted_by_user_id
    LEFT JOIN users approver ON approver.id = wa.admin_approved_by_user_id
    WHERE wa.person_id = ${personId}
      AND wa.work_id = ${workId}
      AND DATE(wp.date) = ${targetDate}
    ORDER BY wa.id ASC
  `
}

function extractStateRows(rows) {
  return rows.filter(row => hasSubmissionState(row) || hasApprovalState(row))
}

function evaluateRowSafety(row, person, approver) {
  const submittedMatchesTarget =
    !hasSubmissionState(row) ||
    Number(row.submittedByUserId) === Number(person.userId) ||
    valuesMatch(row.submittedByUsername, person.username) ||
    valuesMatch(row.submittedByName, person.personName) ||
    valuesMatch(row.submittedByName, person.userDisplayName)

  const approvalMatchesTarget =
    !hasApprovalState(row) ||
    Number(row.adminApprovedByUserId) === Number(approver.userId) ||
    valuesMatch(row.adminApprovedByUsername, approver.username) ||
    valuesMatch(row.adminApprovedByName, approver.displayName) ||
    valuesMatch(row.adminApprovedByName, approver.username)

  return {
    ...row,
    submitted: isTrueLike(row.submitted),
    submittedMatchesTarget,
    approvalMatchesTarget,
    safeToReset: submittedMatchesTarget && approvalMatchesTarget,
  }
}

function printRecordTable(rows) {
  if (rows.length === 0) {
    console.log('Nenhum registo encontrado para o alvo indicado.')
    return
  }

  console.table(rows.map(row => ({
    assignmentId: row.assignmentId,
    workPlanId: row.workPlanId,
    planDate: row.planDate,
    work: `${row.workNumber} - ${row.workName}`,
    person: row.personName,
    hours: formatNullable(row.hours),
    dailyHours: formatNullable(row.dailyHours),
    submitted: row.submitted === true ? 'sim' : 'nao',
    submittedAt: formatNullable(row.submittedAt),
    submittedBy: formatNullable(row.submittedByUsername || row.submittedByName),
    approvedHours: formatNullable(row.approvedHours),
    approvedAt: formatNullable(row.adminApprovedAt),
    approvedBy: formatNullable(row.adminApprovedByUsername || row.adminApprovedByName),
    safeToReset: row.safeToReset === false ? 'nao' : 'sim',
  })))
}

function printEntityResolution(label, rows) {
  console.log('')
  console.log(`${label}:`)
  console.table(rows)
}

async function resetAssignments(prisma, assignmentIds) {
  return prisma.workAssignment.updateMany({
    where: {
      id: {
        in: assignmentIds.map(id => Number(id)),
      },
    },
    data: RESET_FIELDS,
  })
}

async function validateReset(prisma, assignmentIds) {
  const rows = await prisma.workAssignment.findMany({
    where: {
      id: {
        in: assignmentIds.map(id => Number(id)),
      },
    },
    select: {
      id: true,
      hours: true,
      dailyHours: true,
      submitted: true,
      submittedAt: true,
      submittedByUserId: true,
      submittedByName: true,
      approvedHours: true,
      adminApprovedAt: true,
      adminApprovedByUserId: true,
      adminApprovedByName: true,
    },
    orderBy: {
      id: 'asc',
    },
  })

  const invalidRows = rows.filter(row =>
    row.submitted === true ||
    row.submittedAt !== null ||
    row.submittedByUserId !== null ||
    row.submittedByName !== null ||
    row.approvedHours !== null ||
    row.adminApprovedAt !== null ||
    row.adminApprovedByUserId !== null ||
    row.adminApprovedByName !== null,
  )

  return {
    rows,
    invalidRows,
  }
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

  console.log('Limpeza segura de estados de submissao/aprovacao para demo DEV')
  console.log('Nao remove plano diario, obra, cliente, afetacao ou utilizadores.')
  console.log('')
  console.table([formatTargetSummary(config)])
  console.log('')
  console.log(`Env file DEV: ${config.envFilePath}${config.envFileFound ? '' : ' (nao encontrado, a usar args/process.env)'}`)
  console.log('Tabela que pode ser alterada: work_assignments')
  console.log('Historico de atividade da aplicacao e derivado destes campos; nao existe limpeza adicional obrigatoria em tabelas de auditoria para o fluxo normal.')

  try {
    await prisma.$connect()

    const [people, works, approvers] = await Promise.all([
      resolvePerson(prisma, config.target),
      resolveWork(prisma, config.target),
      resolveApprover(prisma, config.target),
    ])

    printEntityResolution('Pessoas encontradas para o alvo', people)
    printEntityResolution('Obras encontradas para o alvo', works)
    printEntityResolution('Aprovadores encontrados para o alvo', approvers)

    if (people.length !== 1) {
      throw new Error(`Esperava exatamente 1 pessoa para o alvo, encontrei ${people.length}.`)
    }

    if (works.length !== 1) {
      throw new Error(`Esperava exatamente 1 obra para o alvo, encontrei ${works.length}.`)
    }

    if (approvers.length !== 1) {
      throw new Error(`Esperava exatamente 1 aprovador para o alvo, encontrei ${approvers.length}.`)
    }

    const person = people[0]
    const work = works[0]
    const approver = approvers[0]
    const foundRows = await findMatchingAssignments(prisma, Number(person.personId), Number(work.workId), config.target.date)
    const stateRows = extractStateRows(foundRows).map(row => evaluateRowSafety(row, person, approver))

    console.log('')
    console.log('Registos encontrados relacionados com submissao/aprovacao:')
    printRecordTable(stateRows)

    if (stateRows.length === 0) {
      console.log('')
      console.log('Nenhum estado de submissao/aprovacao encontrado. Nada a limpar.')
      return
    }

    const unsafeRows = stateRows.filter(row => row.safeToReset === false)

    if (unsafeRows.length > 0) {
      console.log('')
      console.error('Foram encontrados registos com submetedor/aprovador diferente do alvo esperado. Operacao abortada sem alterar dados.')
      if (unsafeRows.length !== stateRows.length) {
        printRecordTable(unsafeRows)
      }
      process.exitCode = 1
      return
    }

    const assignmentIds = stateRows.map(row => Number(row.assignmentId))

    console.log('')
    console.log(`IDs elegiveis para reset: ${assignmentIds.join(', ')}`)
    console.log('Campos que serao limpos: submitted, submittedAt, submittedByUserId, submittedByName, approvedHours, adminApprovedAt, adminApprovedByUserId, adminApprovedByName')
    console.log('Campos mantidos: hours, dailyHours, workPlanId, workId, personId, notes, hourlyCost, afetacao, plano diario, obra, cliente e utilizadores')

    if (config.dryRun) {
      console.log('')
      console.log('DRY-RUN: nenhuma alteracao foi aplicada.')
      console.log('Repete com --confirm para limpar estes estados no VPS DEV.')
      return
    }

    console.log('')
    console.log('Aplicar limpeza confirmada...')

    const result = await prisma.$transaction(async transactionPrisma => {
      const updateResult = await resetAssignments(transactionPrisma, assignmentIds)
      const validation = await validateReset(transactionPrisma, assignmentIds)

      if (validation.invalidRows.length > 0) {
        throw new Error('Validacao final falhou: alguns registos mantiveram estado de submissao/aprovacao.')
      }

      return {
        updateResult,
        validation,
      }
    })

    console.log('')
    console.log(`Registos atualizados em work_assignments: ${result.updateResult.count}`)
    console.table(result.validation.rows.map(row => ({
      assignmentId: row.id,
      hours: formatNullable(row.hours),
      dailyHours: formatNullable(row.dailyHours),
      submitted: row.submitted === true ? 'sim' : 'nao',
      submittedAt: formatNullable(row.submittedAt),
      approvedHours: formatNullable(row.approvedHours),
      approvedAt: formatNullable(row.adminApprovedAt),
    })))

    console.log('')
    console.log('Limpeza concluida com sucesso.')
    console.log('Tabelas alteradas: work_assignments')
    console.log(`Registos alterados: assignment ids ${assignmentIds.join(', ')}`)
    console.log('Fluxo reposto para demo:')
    console.log('1. submeter horas: permitido novamente porque submitted=false e submittedAt=null')
    console.log('2. aprovar horas: permitido novamente depois de nova submissao porque approvedHours/adminApprovedAt ficaram nulos')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(error => {
  console.error('')
  console.error('Falha na limpeza segura da demo DEV:', error.message || error)
  process.exitCode = 1
})
