import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { test } from 'node:test'
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..')
const dataDir = join(repoRoot, 'data')
const routeSandboxParentDir = join(repoRoot, '.tmp')
const routeSandboxEntries = ['app', 'config', 'data', 'frontend', 'lib', 'package.json', 'public', 'server', 'schema.prisma', 'prisma.config.ts']

function ensureDataDir() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
}

function writeJsonFixture(filename, value) {
  ensureDataDir()
  writeFileSync(join(dataDir, filename), JSON.stringify(value, null, 2), 'utf8')
}

function seedSummaryExportFixtures() {
  writeJsonFixture('companies.json', [
    {
      id: 1,
      holdingId: 1,
      name: 'Empresa Teste',
      slug: 'empresa-teste',
      countryCode: 'PT',
      documentMark: 'ET',
      documentLabel: 'Empresa Teste',
      documentLogoUrl: '',
      active: true,
    },
  ])

  writeJsonFixture('clients.json', [
    {
      id: 1,
      companyId: 1,
      name: 'Cliente Alfa',
      vatNumber: '',
      contactName: '',
      email: '',
      phone: '',
      notes: '',
    },
    {
      id: 2,
      companyId: 1,
      name: 'Client Français',
      vatNumber: '',
      contactName: '',
      email: '',
      phone: '',
      notes: '',
      summaryLanguage: 'fr',
    },
    {
      id: 3,
      companyId: 1,
      name: 'English Client',
      vatNumber: '',
      contactName: '',
      email: '',
      phone: '',
      notes: '',
      summaryLanguage: 'en',
    },
    {
      id: 4,
      companyId: 1,
      name: 'Cliente Español',
      vatNumber: '',
      contactName: '',
      email: '',
      phone: '',
      notes: '',
      summaryLanguage: 'es',
    },
  ])

  writeJsonFixture('people.json', [
    {
      id: 1,
      companyId: 1,
      name: 'Ana Silva',
      price: 10,
      monthlyPrice: 0,
      role: 'carpinteiro',
    },
    {
      id: 2,
      companyId: 1,
      name: 'Bruno Costa',
      price: 12,
      monthlyPrice: 0,
      role: 'trolha',
    },
    {
      id: 3,
      companyId: 1,
      name: 'Claire Dubois',
      price: 15,
      monthlyPrice: 0,
      role: 'ferrajeiro',
    },
    {
      id: 4,
      companyId: 1,
      name: 'John Smith',
      price: 16,
      monthlyPrice: 0,
      role: 'gruista',
    },
    {
      id: 5,
      companyId: 1,
      name: 'María López',
      price: 14,
      monthlyPrice: 0,
      role: 'carpinteiro',
    },
  ])

  writeJsonFixture('works.json', [
    {
      id: 1,
      number: 101,
      companyId: 1,
      name: 'Obra A',
      clientId: 1,
      location: 'Lisboa',
      status: 'planned',
      budget: 0,
      defaultHourlyCost: 10,
      roleHourlyCosts: {},
      specialPersonHourlyCosts: {},
      startDate: null,
      endDate: null,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      notes: '',
    },
    {
      id: 2,
      number: 102,
      companyId: 1,
      name: 'Obra B',
      clientId: 1,
      location: 'Porto',
      status: 'planned',
      budget: 0,
      defaultHourlyCost: 12,
      roleHourlyCosts: {},
      specialPersonHourlyCosts: {},
      startDate: null,
      endDate: null,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      notes: '',
    },
    {
      id: 3,
      number: 201,
      companyId: 1,
      name: 'Chantier FR',
      clientId: 2,
      location: 'Lyon',
      status: 'planned',
      budget: 0,
      defaultHourlyCost: 15,
      roleHourlyCosts: {},
      specialPersonHourlyCosts: {},
      startDate: null,
      endDate: null,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      notes: '',
    },
    {
      id: 4,
      number: 301,
      companyId: 1,
      name: 'English Work',
      clientId: 3,
      location: 'London',
      status: 'planned',
      budget: 0,
      defaultHourlyCost: 16,
      roleHourlyCosts: {},
      specialPersonHourlyCosts: {},
      startDate: null,
      endDate: null,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      notes: '',
    },
    {
      id: 5,
      number: 401,
      companyId: 1,
      name: 'Obra ES',
      clientId: 4,
      location: 'Madrid',
      status: 'planned',
      budget: 0,
      defaultHourlyCost: 14,
      roleHourlyCosts: {},
      specialPersonHourlyCosts: {},
      startDate: null,
      endDate: null,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      notes: '',
    },
  ])

  writeJsonFixture('work-plans.json', [
    { id: 1, date: '2026-06-10', notes: '' },
    { id: 2, date: '2026-06-11', notes: '' },
    { id: 3, date: '2026-07-05', notes: '' },
  ])

  writeJsonFixture('work-assignments.json', [
    {
      id: 1,
      workPlanId: 1,
      workId: 1,
      personId: 1,
      hours: 4,
      dailyHours: 4,
      approvedHours: 4,
      hourlyCost: 10,
      manualHourlyCost: false,
      notes: '',
      submitted: true,
      planningVisible: true,
      hasWorkAccess: false,
      assignmentPurpose: 'work',
    },
    {
      id: 2,
      workPlanId: 1,
      workId: 2,
      personId: 1,
      hours: 3,
      dailyHours: 3,
      approvedHours: 3,
      hourlyCost: 10,
      manualHourlyCost: false,
      notes: '',
      submitted: true,
      planningVisible: true,
      hasWorkAccess: false,
      assignmentPurpose: 'work',
    },
    {
      id: 3,
      workPlanId: 1,
      workId: 1,
      personId: 2,
      hours: 2,
      dailyHours: 2,
      approvedHours: 2,
      hourlyCost: 12,
      manualHourlyCost: false,
      notes: '',
      submitted: true,
      planningVisible: true,
      hasWorkAccess: false,
      assignmentPurpose: 'work',
    },
    {
      id: 4,
      workPlanId: 2,
      workId: 2,
      personId: 1,
      hours: 5,
      dailyHours: 5,
      approvedHours: 5,
      hourlyCost: 10,
      manualHourlyCost: false,
      notes: '',
      submitted: true,
      planningVisible: true,
      hasWorkAccess: false,
      assignmentPurpose: 'work',
    },
    {
      id: 5,
      workPlanId: 3,
      workId: 1,
      personId: 1,
      hours: 8,
      dailyHours: 8,
      approvedHours: 8,
      hourlyCost: 10,
      manualHourlyCost: false,
      notes: '',
      submitted: true,
      planningVisible: true,
      hasWorkAccess: false,
      assignmentPurpose: 'work',
    },
    {
      id: 6,
      workPlanId: 1,
      workId: 3,
      personId: 3,
      hours: 6,
      dailyHours: 6,
      approvedHours: 6,
      hourlyCost: 15,
      manualHourlyCost: false,
      notes: '',
      submitted: true,
      planningVisible: true,
      hasWorkAccess: false,
      assignmentPurpose: 'work',
    },
    {
      id: 7,
      workPlanId: 1,
      workId: 4,
      personId: 4,
      hours: 7,
      dailyHours: 7,
      approvedHours: 7,
      hourlyCost: 16,
      manualHourlyCost: false,
      notes: '',
      submitted: true,
      planningVisible: true,
      hasWorkAccess: false,
      assignmentPurpose: 'work',
    },
    {
      id: 8,
      workPlanId: 1,
      workId: 5,
      personId: 5,
      hours: 5,
      dailyHours: 5,
      approvedHours: 5,
      hourlyCost: 14,
      manualHourlyCost: false,
      notes: '',
      submitted: true,
      planningVisible: true,
      hasWorkAccess: false,
      assignmentPurpose: 'work',
    },
  ])

  writeJsonFixture('planning-workspaces.json', [])
  writeJsonFixture('planning-workspace-assignments.json', [])
  writeJsonFixture('work-extra-access-grants.json', [])
  writeJsonFixture('daily-work-notes.json', [])
  writeJsonFixture('feature-flags.json', {
    activityHistory: true,
    notificationsCenter: true,
    calendarManagement: true,
    dailyWorkNotes: true,
    hoursSubmission: true,
    hoursApproval: true,
  })
}

seedSummaryExportFixtures()

const { HttpError } = await import('../server/errors/http-error.js')
const { exportClientWorkSummaryService } = await import('../server/services/work-summary-export-service.js')
const { createSessionToken, SESSION_COOKIE_NAME } = await import('../lib/auth.js')
const {
  buildAssignmentsByMonth,
  buildWorkSummaryPrintDocument,
  buildSingleWorkSummaryWorkbook,
  buildSummaryExportFilename,
  buildWorkbookBytes,
} = await import('../lib/work-summary-export.js')

const adminSession = {
  userId: 1,
  username: 'admin',
  name: 'Administrador',
  role: 'admin',
  accountType: 'admin',
  permissionKeys: ['works.annual_summary.export'],
  workIds: [],
}

const scopedChefSession = {
  userId: 2,
  username: 'chef-alfa',
  name: 'Chefe Alfa',
  personId: 1,
  role: 'chef_primeira',
  accountType: 'identity',
  permissionKeys: ['works.annual_summary.export'],
  workIds: [1],
}

function readWorkbook(buffer) {
  return XLSX.read(Buffer.from(buffer), { type: 'buffer', cellStyles: true })
}

function readSheetRows(workbook, sheetName) {
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: '',
  })
}

function findRowByFirstCell(rows, value) {
  return rows.find(row => String(row?.[0] || '').trim() === value) || null
}

function getContentDispositionFilename(headerValue) {
  const utf8Match = String(headerValue || '').match(/filename\*=UTF-8''([^;]+)/i)

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const fallbackMatch = String(headerValue || '').match(/filename="?([^";]+)"?/i)
  return fallbackMatch?.[1] || ''
}

async function getAvailablePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      server.close(error => {
        if (error) {
          reject(error)
          return
        }

        resolve(port)
      })
    })
  })
}

function resolveNextCliPath() {
  let currentDir = repoRoot

  while (true) {
    const candidate = join(currentDir, 'node_modules', 'next', 'dist', 'bin', 'next')

    if (existsSync(candidate)) {
      return candidate
    }

    const parentDir = dirname(currentDir)

    if (parentDir === currentDir) {
      throw new Error('Nao foi possivel localizar o CLI do Next.js para o teste da rota de exportacao.')
    }

    currentDir = parentDir
  }
}

async function stopProcess(childProcess) {
  if (!childProcess || childProcess.exitCode !== null) {
    return
  }

  childProcess.kill('SIGTERM')

  const waitForExit = async timeoutMs => {
    const startedAt = Date.now()

    while (childProcess.exitCode === null && Date.now() - startedAt < timeoutMs) {
      await delay(100)
    }
  }

  await waitForExit(5000)

  if (childProcess.exitCode === null) {
    childProcess.kill('SIGKILL')
    await waitForExit(5000)
  }

  childProcess.stdout?.destroy()
  childProcess.stderr?.destroy()
}

async function startNextDevServer() {
  const port = await getAvailablePort()
  const nextCliPath = resolveNextCliPath()
  mkdirSync(routeSandboxParentDir, { recursive: true })
  const routeSandboxRoot = mkdtempSync(join(routeSandboxParentDir, 'summary-export-route-'))

  routeSandboxEntries.forEach(entry => {
    const sourcePath = join(repoRoot, entry)

    if (!existsSync(sourcePath)) {
      return
    }

    cpSync(sourcePath, join(routeSandboxRoot, entry), { recursive: true })
  })

  const stdoutChunks = []
  const stderrChunks = []
  const childProcess = spawn(
    process.execPath,
    [nextCliPath, 'dev', '--hostname', '127.0.0.1', '--port', String(port)],
    {
      cwd: routeSandboxRoot,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        BENTIX_DATA_SOURCE: 'json',
        DATABASE_URL: '',
        AUTH_SECRET: 'work-summary-route-test-secret',
        NEXT_TELEMETRY_DISABLED: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  childProcess.stdout?.on('data', chunk => {
    stdoutChunks.push(chunk.toString())
  })
  childProcess.stderr?.on('data', chunk => {
    stderrChunks.push(chunk.toString())
  })

  const startedAt = Date.now()
  const readinessUrl = `http://127.0.0.1:${port}/api/auth/payload-key`

  while (Date.now() - startedAt < 120000) {
    if (childProcess.exitCode !== null) {
      throw new Error(
        `Servidor Next terminou antes de ficar pronto.\nSTDOUT:\n${stdoutChunks.join('')}\nSTDERR:\n${stderrChunks.join('')}`,
      )
    }

    try {
      const response = await fetch(readinessUrl)

      if (response.ok) {
        return {
          port,
          childProcess,
          sandboxRoot: routeSandboxRoot,
          logs: () => ({
            stdout: stdoutChunks.join(''),
            stderr: stderrChunks.join(''),
          }),
        }
      }
    } catch {
      // Retry until the dev server is ready.
    }

    await delay(500)
  }

  await stopProcess(childProcess)
  rmSync(routeSandboxRoot, { recursive: true, force: true })
  throw new Error(
    `Servidor Next nao ficou pronto a tempo.\nSTDOUT:\n${stdoutChunks.join('')}\nSTDERR:\n${stderrChunks.join('')}`,
  )
}

test('work-page single-work workbook remains available through the centralized generator', () => {
  const workbook = buildSingleWorkSummaryWorkbook({
    work: { id: 1, name: 'Obra A', number: 101 },
    assignments: [
      {
        id: 1,
        workId: 1,
        personId: 1,
        date: '2026-06-10',
        approvedHours: 4,
        hourlyCost: 10,
        person: { id: 1, name: 'Ana Silva' },
      },
    ],
    startDate: '2026-06-01',
    endDate: '2026-06-30',
  })

  assert.deepEqual(workbook.SheetNames, ['Obra A-2026-06'])
  const rows = readSheetRows(workbook, workbook.SheetNames[0])
  assert.equal(rows[1][0], 'Obra A')
  assert.equal(rows[3][0], 'Trabalhador')
})

test('client export with one work returns one xlsx matching the single-work workbook structure', async () => {
  const result = await exportClientWorkSummaryService(adminSession, 1, {
    workIds: [1],
    startMonth: '2026-06',
    endMonth: '2026-06',
    summaryName: 'Obra A',
  })

  const serviceWorkbook = readWorkbook(result.body)
  const expectedWorkbook = buildSingleWorkSummaryWorkbook({
    work: { id: 1, name: 'Obra A', number: 101 },
    assignments: [
      {
        id: 1,
        workId: 1,
        personId: 1,
        date: '2026-06-10',
        approvedHours: 4,
        hourlyCost: 10,
        person: { id: 1, name: 'Ana Silva' },
      },
      {
        id: 3,
        workId: 1,
        personId: 2,
        date: '2026-06-10',
        approvedHours: 2,
        hourlyCost: 12,
        person: { id: 2, name: 'Bruno Costa' },
      },
    ],
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    summaryName: 'Obra A',
  })

  assert.equal(result.status, 200)
  assert.equal(result.headers['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  assert.match(result.headers['Content-Disposition'], /\.xlsx/)
  assert.deepEqual(serviceWorkbook.SheetNames, expectedWorkbook.SheetNames)
  assert.deepEqual(
    readSheetRows(serviceWorkbook, serviceWorkbook.SheetNames[0]),
    readSheetRows(expectedWorkbook, expectedWorkbook.SheetNames[0]),
  )
})

test('client export with multiple works returns one xlsx workbook and never an outer zip response', async () => {
  const result = await exportClientWorkSummaryService(adminSession, 1, {
    workIds: [1, 2],
    startMonth: '2026-06',
    endMonth: '2026-06',
    summaryName: 'Resumo Fase 1',
  })

  const workbook = readWorkbook(result.body)

  assert.equal(result.status, 200)
  assert.equal(result.headers['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  assert.match(result.headers['Content-Disposition'], /\.xlsx/)
  assert.equal(workbook.SheetNames.length, 1)
  assert.equal(workbook.SheetNames[0], 'Resumo Fase 1-2026-06')
})

test('client worked hours summary pdf reuses the same configured works and period', async () => {
  const result = await exportClientWorkSummaryService(adminSession, 1, {
    workIds: [1, 2],
    startMonth: '2026-06',
    endMonth: '2026-06',
    summaryName: 'Resumo Fase 1',
    format: 'pdf',
  })

  const html = String(result.body || '')

  assert.equal(result.status, 200)
  assert.match(result.headers['Content-Type'], /text\/html/i)
  assert.match(result.headers['Content-Disposition'], /\.pdf/)
  assert.match(html, /Resumo Fase 1/)
  assert.match(html, /Junho 2026/)
  assert.doesNotMatch(html, /Julho 2026/)
  assert.equal((html.match(/Ana Silva/g) || []).length, 1)
  assert.match(html, /Bruno Costa/)
  assert.doesNotMatch(html, /Obra A|Obra B/)
})

test('worked hours summary pdf print markup keeps the totals block after the table with compact pagination rules', () => {
  const html = buildWorkSummaryPrintDocument({
    title: 'Resumo Fase 1',
    assignments: [
      {
        id: 1,
        workId: 1,
        personId: 1,
        date: '2026-06-10',
        approvedHours: 4,
        hourlyCost: 10,
        person: { id: 1, name: 'Ana Silva' },
      },
      {
        id: 2,
        workId: 2,
        personId: 2,
        date: '2026-06-10',
        approvedHours: 2,
        hourlyCost: 12,
        person: { id: 2, name: 'Bruno Costa' },
      },
    ],
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    language: 'pt',
  })

  assert.match(html, /<table>[\s\S]*<\/table>\s*<div class="role-calc-box">/)
  assert.match(html, /@page\s*\{\s*margin:\s*9mm 8mm 10mm;/)
  assert.match(html, /\.sheet-header\s*\{[\s\S]*margin-bottom:\s*10px;/)
  assert.match(html, /thead\s*\{\s*display:\s*table-header-group;/)
  assert.match(
    html,
    /\.role-calc-box\s*\{[\s\S]*break-inside:\s*avoid;[\s\S]*page-break-inside:\s*avoid;[\s\S]*break-before:\s*avoid-page;[\s\S]*page-break-before:\s*avoid;/,
  )
  assert.doesNotMatch(html, /\.role-calc-box\s*\{[\s\S]*position:\s*absolute;/)
})

test('worked hours summary pdf keeps empty-period table and totals markup compact and printable', () => {
  const html = buildWorkSummaryPrintDocument({
    title: 'Resumo Vazio',
    assignments: [],
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    language: 'pt',
  })

  assert.match(html, /Sem dados no periodo\./)
  assert.match(html, /\.sheet\s*\{[\s\S]*padding:\s*14px 16px 16px;/)
  assert.match(html, /th,\s*td\s*\{[\s\S]*padding:\s*5px 3px;[\s\S]*font-size:\s*9\.5px;/)
  assert.match(html, /\.role-calc-empty\s*\{[\s\S]*padding:\s*10px 12px;[\s\S]*font-size:\s*10\.5px;/)
  assert.match(html, /<table>[\s\S]*Sem dados no periodo\.[\s\S]*<\/table>\s*<div class="role-calc-box">[\s\S]*TOTAL/)
})

test('duplicate payload work ids are ignored and never double-count hours', async () => {
  const deduplicatedResult = await exportClientWorkSummaryService(adminSession, 1, {
    workIds: [1, 2],
    startMonth: '2026-06',
    endMonth: '2026-06',
    summaryName: 'Resumo Fase 1',
  })
  const duplicatedResult = await exportClientWorkSummaryService(adminSession, 1, {
    workIds: [1, 1, 2],
    startMonth: '2026-06',
    endMonth: '2026-06',
    summaryName: 'Resumo Fase 1',
  })

  const deduplicatedWorkbook = readWorkbook(deduplicatedResult.body)
  const duplicatedWorkbook = readWorkbook(duplicatedResult.body)
  const deduplicatedRows = readSheetRows(deduplicatedWorkbook, deduplicatedWorkbook.SheetNames[0])
  const duplicatedRows = readSheetRows(duplicatedWorkbook, duplicatedWorkbook.SheetNames[0])

  assert.deepEqual(duplicatedWorkbook.SheetNames, deduplicatedWorkbook.SheetNames)
  assert.deepEqual(duplicatedRows, deduplicatedRows)
  assert.equal(findRowByFirstCell(duplicatedRows, 'Ana Silva')?.[10], '7')
})

test('two works with the same employee and same date are summed in the combined export', async () => {
  const result = await exportClientWorkSummaryService(adminSession, 1, {
    workIds: [1, 2],
    startMonth: '2026-06',
    endMonth: '2026-06',
    summaryName: 'Resumo Fase 1',
  })

  const workbook = readWorkbook(result.body)
  const rows = readSheetRows(workbook, workbook.SheetNames[0])
  const anaRow = findRowByFirstCell(rows, 'Ana Silva')

  assert.ok(anaRow)
  assert.equal(anaRow[10], '7')
})

test('the combined report does not expose source work names or work-origin columns', async () => {
  const result = await exportClientWorkSummaryService(adminSession, 1, {
    workIds: [1, 2],
    startMonth: '2026-06',
    endMonth: '2026-06',
    summaryName: 'Resumo Cliente Alfa',
  })

  const workbook = readWorkbook(result.body)
  const rows = workbook.SheetNames.flatMap(sheetName => readSheetRows(workbook, sheetName))
  const serializedWorkbook = JSON.stringify(rows)

  assert.ok(!serializedWorkbook.includes('Obra A'))
  assert.ok(!serializedWorkbook.includes('Obra B'))
  assert.ok(!rows[3].includes('Obra'))
})

test('same employee on different dates remains separated by calendar day', async () => {
  const result = await exportClientWorkSummaryService(adminSession, 1, {
    workIds: [1, 2],
    startMonth: '2026-06',
    endMonth: '2026-06',
    summaryName: 'Resumo Fase 1',
  })

  const workbook = readWorkbook(result.body)
  const rows = readSheetRows(workbook, workbook.SheetNames[0])
  const anaRow = findRowByFirstCell(rows, 'Ana Silva')

  assert.ok(anaRow)
  assert.equal(anaRow[10], '7')
  assert.equal(anaRow[11], '5')
})

test('different employees on the same date remain separated', async () => {
  const result = await exportClientWorkSummaryService(adminSession, 1, {
    workIds: [1, 2],
    startMonth: '2026-06',
    endMonth: '2026-06',
    summaryName: 'Resumo Fase 1',
  })

  const workbook = readWorkbook(result.body)
  const rows = readSheetRows(workbook, workbook.SheetNames[0])
  const anaRow = findRowByFirstCell(rows, 'Ana Silva')
  const brunoRow = findRowByFirstCell(rows, 'Bruno Costa')

  assert.ok(anaRow)
  assert.ok(brunoRow)
  assert.equal(anaRow[10], '7')
  assert.equal(brunoRow[10], '2')
})

test('multi-month export preserves month-based workbook structure and includes empty months', async () => {
  const result = await exportClientWorkSummaryService(adminSession, 1, {
    workIds: [1, 2],
    startMonth: '2026-05',
    endMonth: '2026-07',
    summaryName: 'Trabalhos Maio-Julho',
  })

  const workbook = readWorkbook(result.body)

  assert.deepEqual(workbook.SheetNames, [
    'Trabalhos Maio-Julho-2026-07',
    'Trabalhos Maio-Julho-2026-06',
    'Trabalhos Maio-Julho-2026-05',
  ])
})

test('empty months show the translated no-data message', async () => {
  const result = await exportClientWorkSummaryService(adminSession, 1, {
    workIds: [1, 2],
    startMonth: '2026-05',
    endMonth: '2026-05',
    summaryName: 'Sem Maio',
  })

  const workbook = readWorkbook(result.body)
  const rows = readSheetRows(workbook, workbook.SheetNames[0])

  assert.equal(rows[4][0], 'Sem dados no periodo.')
})

test('work from another client is rejected', async () => {
  await assert.rejects(
    () =>
      exportClientWorkSummaryService(adminSession, 1, {
        workIds: [3],
        startMonth: '2026-06',
        endMonth: '2026-06',
        summaryName: 'Inválido',
      }),
    error => {
      assert.ok(error instanceof HttpError)
      assert.equal(error.status, 400)
      assert.match(error.message, /não pertence ao cliente/i)
      return true
    },
  )
})

test('empty work selection is rejected', async () => {
  await assert.rejects(
    () =>
      exportClientWorkSummaryService(adminSession, 1, {
        workIds: [],
        startMonth: '2026-06',
        endMonth: '2026-06',
        summaryName: 'Sem obras',
      }),
    /pelo menos uma obra/i,
  )
})

test('invalid month ranges are rejected', async () => {
  await assert.rejects(
    () =>
      exportClientWorkSummaryService(adminSession, 1, {
        workIds: [1],
        startMonth: '2026-07',
        endMonth: '2026-06',
        summaryName: 'Período inválido',
      }),
    /mês final não pode ser anterior/i,
  )
})

test('blank custom summary names are rejected', async () => {
  await assert.rejects(
    () =>
      exportClientWorkSummaryService(adminSession, 1, {
        workIds: [1],
        startMonth: '2026-06',
        endMonth: '2026-06',
        summaryName: '   ',
      }),
    /indica o nome do resumo/i,
  )
})

test('filename sanitization produces one safe xlsx filename', async () => {
  const result = await exportClientWorkSummaryService(adminSession, 1, {
    workIds: [1],
    startMonth: '2026-06',
    endMonth: '2026-06',
    summaryName: '../Resumo: Norte*?',
  })

  const filename = getContentDispositionFilename(result.headers['Content-Disposition'])

  assert.equal(filename, 'resumo-norte-2026-06-01-2026-06-30.xlsx')
  assert.ok(!filename.includes('/'))
  assert.ok(!filename.includes('\\'))
})

test('existing client without summaryLanguage falls back to Portuguese', async () => {
  const result = await exportClientWorkSummaryService(adminSession, 1, {
    workIds: [1],
    startMonth: '2026-06',
    endMonth: '2026-06',
    summaryName: 'Resumo Português',
  })

  const workbook = readWorkbook(result.body)
  const rows = readSheetRows(workbook, workbook.SheetNames[0])

  assert.equal(rows[0][0], 'Mês: Junho 2026')
  assert.equal(rows[3][0], 'Trabalhador')
})

test('French clients receive translated report labels and month names', async () => {
  const result = await exportClientWorkSummaryService(adminSession, 2, {
    workIds: [3],
    startMonth: '2026-06',
    endMonth: '2026-06',
    summaryName: 'Résumé Client',
  })

  const workbook = readWorkbook(result.body)
  const rows = readSheetRows(workbook, workbook.SheetNames[0])

  assert.equal(rows[0][0], 'Mois: Juin 2026')
  assert.equal(rows[3][0], 'Travailleur')
  assert.equal(rows[4][0], 'Claire Dubois')
})

test('English clients receive translated report labels and month names', async () => {
  const result = await exportClientWorkSummaryService(adminSession, 3, {
    workIds: [4],
    startMonth: '2026-06',
    endMonth: '2026-06',
    summaryName: 'Customer Summary',
  })

  const workbook = readWorkbook(result.body)
  const rows = readSheetRows(workbook, workbook.SheetNames[0])

  assert.equal(rows[0][0], 'Month: June 2026')
  assert.equal(rows[3][0], 'Worker')
  assert.equal(rows[4][0], 'John Smith')
})

test('Spanish clients receive translated report labels and month names', async () => {
  const result = await exportClientWorkSummaryService(adminSession, 4, {
    workIds: [5],
    startMonth: '2026-06',
    endMonth: '2026-06',
    summaryName: 'Resumen Cliente',
  })

  const workbook = readWorkbook(result.body)
  const rows = readSheetRows(workbook, workbook.SheetNames[0])

  assert.equal(rows[0][0], 'Mes: Junio 2026')
  assert.equal(rows[3][0], 'Trabajador')
  assert.equal(rows[4][0], 'María López')
})

test('client export rejects inaccessible works for the current session', async () => {
  await assert.rejects(
    () =>
      exportClientWorkSummaryService(scopedChefSession, 1, {
        workIds: [2],
        startMonth: '2026-06',
        endMonth: '2026-06',
        summaryName: 'Sem acesso',
      }),
    error => {
      assert.ok(error instanceof HttpError)
      assert.equal(error.status, 403)
      assert.match(error.message, /sem permissao de exportacao/i)
      return true
    },
  )
})

test('POST /api/clients/{id}/summary-export returns one xlsx response with route headers', async () => {
  const previousAuthSecret = process.env.AUTH_SECRET
  process.env.AUTH_SECRET = 'work-summary-route-test-secret'

  let server = null

  try {
    server = await startNextDevServer()
    const sessionToken = await createSessionToken(adminSession)
    const response = await fetch(`http://127.0.0.1:${server.port}/api/clients/1/summary-export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
      },
      body: JSON.stringify({
        workIds: [1, 2],
        startMonth: '2026-06',
        endMonth: '2026-06',
        summaryName: 'Resumo Fase 1',
      }),
    })
    const contentType = response.headers.get('content-type') || ''
    const contentDisposition = response.headers.get('content-disposition') || ''
    const workbook = readWorkbook(await response.arrayBuffer())
    const rows = readSheetRows(workbook, workbook.SheetNames[0])

    assert.equal(response.status, 200)
    assert.match(contentType, /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/i)
    assert.match(contentDisposition, /attachment;/i)
    assert.equal(getContentDispositionFilename(contentDisposition), 'resumo-fase-1-2026-06-01-2026-06-30.xlsx')
    assert.deepEqual(workbook.SheetNames, ['Resumo Fase 1-2026-06'])
    assert.equal(findRowByFirstCell(rows, 'Ana Silva')?.[10], '7')
  } catch (error) {
    const serverLogs = server?.logs ? server.logs() : null
    const debugMessage = serverLogs
      ? `\nSTDOUT:\n${serverLogs.stdout}\nSTDERR:\n${serverLogs.stderr}`
      : ''

    throw new Error(`${error.message}${debugMessage}`)
  } finally {
    if (server?.childProcess) {
      await stopProcess(server.childProcess)
    }

    if (server?.sandboxRoot) {
      rmSync(server.sandboxRoot, { recursive: true, force: true })
    }

    if (previousAuthSecret === undefined) {
      delete process.env.AUTH_SECRET
    } else {
      process.env.AUTH_SECRET = previousAuthSecret
    }
  }
})

test('assignment grouping keeps only dates inside the requested period and adds empty months when required', () => {
  const months = buildAssignmentsByMonth(
    [
      {
        workId: 1,
        personId: 1,
        person: { id: 1, name: 'Ana Silva' },
        date: '2026-06-10',
        approvedHours: 4,
        hourlyCost: 10,
      },
      {
        workId: 1,
        personId: 1,
        person: { id: 1, name: 'Ana Silva' },
        date: '2026-07-02',
        approvedHours: 8,
        hourlyCost: 10,
      },
    ],
    {
      startDate: '2026-05-01',
      endDate: '2026-07-31',
      includeEmptyMonths: true,
      language: 'pt',
    },
  )

  assert.deepEqual(
    months.map(month => month.monthKey),
    ['2026-07', '2026-06', '2026-05'],
  )
  assert.equal(months[1].totalHours, 4)
  assert.equal(months[2].totalHours, 0)
})

test('summary filename builder always returns one sanitized xlsx filename', () => {
  assert.equal(
    buildSummaryExportFilename({
      summaryName: 'S-BOUW / Projeto Centro',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    }),
    's-bouw-projeto-centro-2026-01-01-2026-03-31.xlsx',
  )
})

test('the generated workbook bytes can be opened as a real xlsx workbook', () => {
  const workbook = buildSingleWorkSummaryWorkbook({
    work: { id: 1, name: 'Obra A', number: 101 },
    assignments: [
      {
        id: 1,
        workId: 1,
        personId: 1,
        date: '2026-06-10',
        approvedHours: 4,
        hourlyCost: 10,
        person: { id: 1, name: 'Ana Silva' },
      },
    ],
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    summaryName: 'Obra A',
  })

  const reopenedWorkbook = readWorkbook(buildWorkbookBytes(workbook))
  assert.deepEqual(reopenedWorkbook.SheetNames, ['Obra A-2026-06'])
})
