import assert from 'node:assert/strict'
import { constants, createCipheriv, publicEncrypt, randomBytes } from 'node:crypto'
import { beforeEach, test } from 'node:test'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { hashPassword } from '../lib/passwords.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..')
const dataDir = join(repoRoot, 'data')
const dailyPlanPageSource = readFileSync(join(repoRoot, 'app', 'daily-plan', 'page.js'), 'utf8')
const planningClientBoardSource = readFileSync(join(repoRoot, 'app', 'daily-plan', 'PlanningClientBoard.js'), 'utf8')
const dailyHoursPageSource = readFileSync(join(repoRoot, 'app', 'daily-hours', 'page.js'), 'utf8')
const viewportLayoutSource = readFileSync(join(repoRoot, 'app', 'components', 'ViewportLayout.js'), 'utf8')
const globalCssSource = readFileSync(join(repoRoot, 'app', 'globals.css'), 'utf8')
const homePageSource = readFileSync(join(repoRoot, 'app', 'page.js'), 'utf8')
const peoplePageSource = readFileSync(join(repoRoot, 'app', 'people', 'page.js'), 'utf8')
const peopleWorkspaceSource = readFileSync(join(repoRoot, 'app', 'people', 'PeopleWorkspace.js'), 'utf8')
const peopleWorkspaceCss = readFileSync(join(repoRoot, 'app', 'people', 'PeopleWorkspace.module.css'), 'utf8')
const clientsPageSource = readFileSync(join(repoRoot, 'app', 'clients', 'page.js'), 'utf8')
const worksPageSource = readFileSync(join(repoRoot, 'app', 'works', 'page.js'), 'utf8')
const workDetailPageSource = readFileSync(join(repoRoot, 'app', 'works', '[id]', 'page.js'), 'utf8')
const companyReportsModalSource = readFileSync(join(repoRoot, 'app', 'components', 'CompanyReportsModal.js'), 'utf8')
const clientReportsModalSource = readFileSync(join(repoRoot, 'app', 'components', 'ClientReportsModal.js'), 'utf8')
const clientSummaryExportModalSource = readFileSync(join(repoRoot, 'app', 'components', 'ClientSummaryExportModal.js'), 'utf8')
const modalCloseButtonSource = readFileSync(join(repoRoot, 'app', 'components', 'ModalCloseButton.js'), 'utf8')
const clientAnnualSummaryPdfTemplateSource = worksPageSource.match(
  /function buildClientAnnualSummaryPrintDocument[\s\S]*?function buildGeneralAnnualSummaryPrintDocument/,
)?.[0] || ''
const materialsPageSource = readFileSync(join(repoRoot, 'app', 'materials', 'MaterialsClient.js'), 'utf8')
const loginPageSource = readFileSync(join(repoRoot, 'app', 'login', 'page.js'), 'utf8')

const fixturePasswords = {
  admin: 'AdminTeste#2026',
  chef: 'ChefTeste#2026',
  developer: 'Developer#2026',
}

function ensureDataDir() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
}

function writeJsonFile(filename, value) {
  ensureDataDir()
  writeFileSync(join(dataDir, filename), JSON.stringify(value, null, 2), 'utf8')
}

function buildFixtureData() {
  return {
    'companies.json': [
      {
        id: 1,
        holdingId: 1,
        name: 'Empresa Principal',
        slug: 'empresa-principal',
        countryCode: 'PT',
        documentMark: 'EP',
        documentLabel: 'Empresa Principal',
        documentLogoUrl: '',
        active: true,
      },
    ],
    'clients.json': [
      {
        id: 1,
        companyId: 1,
        name: 'Cliente Teste',
        vatNumber: '',
        contactName: '',
        email: '',
        phone: '',
        notes: '',
      },
    ],
    'people.json': [
      {
        id: 1,
        companyId: 1,
        name: 'Administrador Teste',
        price: 0,
        monthlyPrice: 0,
        role: 'admin',
      },
      {
        id: 2,
        companyId: 1,
        name: 'Chefe Teste',
        price: 0,
        monthlyPrice: 0,
        role: 'chef_primeira',
      },
      {
        id: 3,
        companyId: 1,
        name: 'Carpinteiro Teste',
        price: 12,
        monthlyPrice: 0,
        role: 'carpinteiro',
      },
      {
        id: 4,
        companyId: 1,
        name: 'Ferrajeiro Teste',
        price: 13,
        monthlyPrice: 0,
        role: 'ferrajeiro',
      },
    ],
    'works.json': [
      {
        id: 1,
        number: 101,
        companyId: 1,
        name: 'Obra Teste',
        clientId: 1,
        location: 'Lisboa',
        status: 'planned',
        budget: 0,
        defaultHourlyCost: 12,
        roleHourlyCosts: { carpinteiro: 12 },
        specialPersonHourlyCosts: {},
        startDate: null,
        endDate: null,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        notes: '',
      },
    ],
    'work-plans.json': [],
    'work-assignments.json': [],
    'planning-workspaces.json': [],
    'planning-workspace-assignments.json': [],
    'work-extra-access-grants.json': [],
    'daily-work-notes.json': [],
    'feature-flags.json': {
      activityHistory: true,
      notificationsCenter: true,
      calendarManagement: true,
      dailyWorkNotes: true,
      hoursSubmission: true,
      hoursApproval: true,
    },
    'admins.json': [
      {
        id: 1,
        username: 'admin_teste',
        password: hashPassword(fixturePasswords.admin),
        name: 'Administrador Teste',
      },
    ],
    'developers.json': [
      {
        id: 1,
        username: 'developer_teste',
        password: hashPassword(fixturePasswords.developer),
        name: 'Developer Teste',
      },
    ],
    'access-identities.json': [
      {
        id: 1,
        personId: 2,
        role: 'chef_primeira',
        username: 'chefe_teste',
        password: hashPassword(fixturePasswords.chef),
        works: [1],
      },
    ],
    'login-attempts.json': [],
    'login-events.json': [],
  }
}

function seedFixtureData() {
  const fixtureData = buildFixtureData()

  Object.entries(fixtureData).forEach(([filename, value]) => {
    writeJsonFile(filename, value)
  })
}

seedFixtureData()

const { getAccessIdentityByPersonId, getAccessIdentityByUsername } = await import('../lib/access-identities.js')
const { canApproveHours, createSessionToken, getDefaultPathForRole, readSessionToken } = await import('../lib/auth.js')
const {
  getUnauthorizedRedirectPath,
  isPublicAppPath,
} = await import('../lib/auth.js')
const {
  getNoCacheHeaders,
  isPublicAssetPath,
  shouldApplyNoCache,
} = await import('../lib/cache-policy.js')
const { getAllClients } = await import('../lib/clients.js')
const { decryptProtectedPayload, getLoginTransportPublicKey } = await import('../lib/login-transport.js')
const { verifyPassword } = await import('../lib/passwords.js')
const { normalizePersonPricingInput } = await import('../lib/person-pricing.js')
const { appendBuildVersion } = await import('../lib/pwa-version.js')
const {
  buildPlanningMessagePreview,
  comparePlanningMessageAssignments,
  filterPlanningMessageAssignmentsForWork,
} = await import('../lib/planning-message.js')
const { getEntityRoleLabel, getRoleDisplayLabel } = await import('../lib/roles.js')
const { getTomorrowPlanningDateValue } = await import('../lib/planning-date.js')
const { buildLoginRedirectPath, getSafeRedirectPath } = await import('../lib/safe-redirect.js')
const { buildOperationalWorkStatuses } = await import('../lib/work-operation-status.js')
const { getNextWorkNumber } = await import('../lib/work-numbering.js')
const { buildDailyHoursWarningMap } = await import('../lib/daily-hours-approval.js')
const {
  getWorkExtraAccessSelectionsByPersonData,
  replaceWorkExtraAccessSelectionsData,
} = await import('../lib/work-extra-access-grants.js')
const { deleteClientService } = await import('../server/services/clients-service.js')
const { createPersonService, updatePersonService } = await import('../server/services/people-service.js')
const { createWorkService, deleteWorkService } = await import('../server/services/works-service.js')
const {
  createWorkAssignment,
  createWorkAssignmentData,
  getAllWorkAssignments,
  submitWorkAssignment,
  updateWorkAssignment,
  updateWorkAssignmentData,
  updateWorkAssignmentPlanningData,
} = await import('../lib/work-assignments.js')
const {
  createDeveloperOverrideWorkAssignmentService,
  updateDeveloperOverrideWorkAssignmentService,
} = await import('../server/services/developer-work-assignments-overrides-service.js')
const { getAllWorkPlans, getWorkPlanByDate } = await import('../lib/work-plans.js')
const {
  approveWorkAssignmentsBatchService,
  approveWorkAssignmentService,
  createWorkAssignmentService,
  getWorkAssignmentsListService,
  submitWorkAssignmentService,
  updateWorkAssignmentService,
} = await import('../server/services/work-assignments-service.js')
const {
  createPlanningDraftAssignmentService,
  deletePlanningDraftAssignmentService,
  getPlanningWorkspaceViewService,
  initializePlanningWorkspaceDraftService,
  publishPlanningWorkspaceService,
  setPlanningWorkspaceToDraftService,
  updatePlanningDraftAssignmentService,
} = await import('../server/services/planning-publication-service.js')
const { getApprovedAssignmentHours } = await import('../lib/work-assignment-approval.js')
const { getHistoricalPlanningCorrectionState } = await import('../lib/planning-publication.js')
const { getAllWorks } = await import('../lib/works.js')
const ADMIN_SESSION = {
  role: 'admin',
  accountType: 'admin',
  accessProfile: 'admin',
  name: 'Administrador Teste',
}
const CHEF_SESSION = {
  role: 'chef_primeira',
  accountType: 'operational',
  accessProfile: 'chef',
  personId: 2,
  workIds: [1],
  name: 'Chefe Teste',
}
const PLANNING_WORKFLOW_DATE = '2030-02-10'
const REPUBLISH_WORKFLOW_DATE = '2030-02-11'
const AUTO_DRAFT_SOURCE_DATE = '2030-02-09'
const AUTO_DRAFT_TARGET_DATE = '2030-02-12'
const AUTO_PUBLISHED_TARGET_DATE = '2030-02-13'

beforeEach(() => {
  seedFixtureData()
})

function createSearchParams(params = {}) {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  )
}

function getLocalDateOffset(days, base = new Date()) {
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0, 0)
  date.setDate(date.getDate() + days)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getVisibleAssignmentForDate(date, { workId, personId } = {}) {
  return getAllWorkAssignments({ date }).find(assignment => {
    if (assignment.planningVisible === false) return false
    if (workId !== undefined && Number(assignment.workId) !== Number(workId)) return false
    if (personId !== undefined && Number(assignment.personId) !== Number(personId)) return false

    return true
  })
}

function getAssignmentForDate(date, { workId, personId } = {}) {
  return getAllWorkAssignments({ date }).find(assignment => {
    if (workId !== undefined && Number(assignment.workId) !== Number(workId)) return false
    if (personId !== undefined && Number(assignment.personId) !== Number(personId)) return false

    return true
  })
}

function createProtectedPayload(payload) {
  const contentKey = randomBytes(32)
  const encryptedKey = publicEncrypt(
    {
      key: getLoginTransportPublicKey(),
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    contentKey,
  )
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', contentKey, iv)
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ])

  return {
    encryptedKey: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  }
}

test('login valida payload protegido, password e sessao do chefe', async () => {
  const protectedPayload = createProtectedPayload({
    username: 'chefe_teste',
    password: fixturePasswords.chef,
  })
  const decryptedPayload = decryptProtectedPayload(protectedPayload)
  const identity = getAccessIdentityByUsername(decryptedPayload.username)

  assert.deepEqual(decryptedPayload, {
    username: 'chefe_teste',
    password: fixturePasswords.chef,
  })
  assert.ok(identity)
  assert.equal(identity.person?.role, 'chef_primeira')
  assert.equal(await verifyPassword(decryptedPayload.password, identity.password), true)

  const token = await createSessionToken({
    userId: identity.id,
    personId: identity.person?.id || identity.personId,
    username: identity.username,
    name: identity.person?.name || identity.username,
    role: identity.person?.role || identity.role,
    accountType: 'operational',
    workIds: identity.works.map(work => work.id),
  })
  const session = await readSessionToken(token)

  assert.ok(token)
  assert.equal(session.username, 'chefe_teste')
  assert.equal(session.role, 'chef_primeira')
  assert.equal(session.accountType, 'operational')
  assert.deepEqual(session.workIds, [1])
  assert.equal(getDefaultPathForRole(session.role), '/daily-hours')
})

test('redirectTo do login aceita apenas paths internos seguros', () => {
  assert.equal(getSafeRedirectPath('/mobile/chef'), '/mobile/chef')
  assert.equal(
    getSafeRedirectPath('/mobile/chef/settings?tab=notifications'),
    '/mobile/chef/settings?tab=notifications',
  )
  assert.equal(buildLoginRedirectPath('/mobile/chef'), '/login?redirectTo=%2Fmobile%2Fchef')
  assert.equal(
    buildLoginRedirectPath('/mobile/chef', '/mobile/login'),
    '/mobile/login?redirectTo=%2Fmobile%2Fchef',
  )
  assert.equal(getSafeRedirectPath('https://evil.example/mobile/chef'), null)
  assert.equal(getSafeRedirectPath('//evil.example/mobile/chef'), null)
  assert.equal(getSafeRedirectPath('mobile/chef'), null)
  assert.equal(getSafeRedirectPath('/\\evil'), null)
  assert.equal(buildLoginRedirectPath('https://evil.example/mobile/chef'), '/login')
  assert.equal(buildLoginRedirectPath('https://evil.example/mobile/chef', '/mobile/login'), '/mobile/login')
})

test('/mobile/login e tratado como rota publica pelo guard', () => {
  assert.equal(isPublicAppPath('/mobile/login'), true)
  assert.equal(getUnauthorizedRedirectPath('/mobile/login'), '/mobile/login')
})

test('Plano diÃƒÆ’Ã‚Â¡rio arranca com amanhÃƒÆ’Ã‚Â£ como data predefinida em hora local', () => {
  assert.equal(getTomorrowPlanningDateValue(new Date(2026, 6, 5, 10, 30, 0)), '2026-07-06')
  assert.match(dailyPlanPageSource, /useState\(\(\) => getTomorrowPlanningDateValue\(\)\)/)
})

test('Plano diÃƒÆ’Ã‚Â¡rio usa scroll ÃƒÆ’Ã‚Âºnico da pÃƒÆ’Ã‚Â¡gina e nÃƒÆ’Ã‚Â£o mantÃƒÆ’Ã‚Â©m ÃƒÆ’Ã‚Â¡rea interna com scroll prÃƒÆ’Ã‚Â³prio', () => {
  assert.doesNotMatch(dailyPlanPageSource, /lockViewport/)
  assert.doesNotMatch(dailyPlanPageSource, /ViewportScrollArea/)
})

test('workspace do Plano diÃƒÆ’Ã‚Â¡rio usa grelha em fluxo normal e rodapÃƒÆ’Ã‚Â© de aÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o sem sobreposiÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o', () => {
  assert.match(dailyPlanPageSource, /<PlanningClientBoard/)
  assert.match(planningClientBoardSource, /<ResponsiveGrid className="vp-planning-work-grid"/)
  assert.match(globalCssSource, /\.vp-planning-work-grid\s*\{[\s\S]*grid-auto-flow:\s*row/)
  assert.match(globalCssSource, /\.vp-planning-work-grid\s*\{[\s\S]*grid-auto-rows:\s*auto/)
  assert.match(globalCssSource, /\.vp-planning-secondary-action-bar\s*\{[\s\S]*justify-content:\s*flex-end/)
  assert.doesNotMatch(globalCssSource, /\.vp-planning-secondary-action-bar\s*\{[\s\S]*margin-top:\s*auto/)
})

test('Plano diÃƒÆ’Ã‚Â¡rio usa o modal final de acessos ÃƒÆ’Ã‚Â s obras e remove o workflow temporÃƒÆ’Ã‚Â¡rio dos chefes', () => {
  assert.match(dailyPlanPageSource, /Acessos [^\n]*obras/)
  assert.match(dailyPlanPageSource, /Acesso [^\n]* por afeta[^\n]*/)
  assert.match(dailyPlanPageSource, /Ainda [^\n]*chefes afetos[^\n]*planeamento\./)
  assert.match(dailyPlanPageSource, /eligibleChefAccessPeople/)
  assert.match(dailyPlanPageSource, /String\(work\.name \|\| 'Obra sem nome'\)/)
  assert.doesNotMatch(
    dailyPlanPageSource,
    /Selecione em quais obras cada chefe deve ter acesso extra\./,
  )
  assert.doesNotMatch(dailyPlanPageSource, /Chefes afetos a vÃƒÆ’Ã‚Â¡rias obras/)
  assert.doesNotMatch(dailyPlanPageSource, /Tipo de afetaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o do chefe/)
  assert.doesNotMatch(dailyPlanPageSource, /Dar estrela a este chefe/)
})

test('Adaptive Layout System expÃƒÆ’Ã‚Âµe primitivas reutilizÃƒÆ’Ã‚Â¡veis e classes globais partilhadas', () => {
  assert.match(viewportLayoutSource, /export function BentixPage/)
  assert.match(viewportLayoutSource, /export function BentixContent/)
  assert.match(viewportLayoutSource, /export function BentixSection/)
  assert.match(viewportLayoutSource, /export function BentixResponsiveGrid/)
  assert.match(viewportLayoutSource, /export function BentixOverflowX/)
  assert.match(globalCssSource, /\.vp-content-frame--app\s*\{/)
  assert.match(globalCssSource, /\.vp-content-frame--dashboard\s*\{/)
  assert.match(globalCssSource, /\.vp-content-frame--ultra\s*\{/)
  assert.match(globalCssSource, /--vp-frame-max:\s*clamp\(/)
  assert.match(globalCssSource, /\.btx-page--default\s*\{/)
  assert.match(globalCssSource, /\.btx-content--lg\s*\{/)
  assert.match(globalCssSource, /\.btx-responsive-grid--split\s*\{/)
  assert.match(globalCssSource, /\.btx-responsive-grid--dashboard-main\s*\{/)
  assert.match(globalCssSource, /\.btx-overflow-x\s*\{/)
})

test('pÃƒÆ’Ã‚Â¡ginas de maior risco usam scroll principal da pÃƒÆ’Ã‚Â¡gina sem ViewportScrollArea nem lockViewport', () => {
  for (const source of [
    homePageSource,
    dailyHoursPageSource,
    peoplePageSource,
    clientsPageSource,
    worksPageSource,
    workDetailPageSource,
    materialsPageSource,
    loginPageSource,
  ]) {
    assert.doesNotMatch(source, /lockViewport/)
    assert.doesNotMatch(source, /ViewportScrollArea/)
  }
})

test('pÃƒÆ’Ã‚Â¡ginas principais migradas usam primitivas adaptativas sem listas principais com altura fixa', () => {
  assert.match(homePageSource, /<BentixPage style=\{pageStyle\}/)
  assert.match(homePageSource, /<BentixContent width="app"/)
  assert.match(homePageSource, /<BentixResponsiveGrid preset="dashboard-main"/)
  assert.match(homePageSource, /className="btx-dashboard-responsavel-calendar"/)
  assert.match(peoplePageSource, /<BentixContent width="app"/)
  assert.match(peoplePageSource, /<PeopleWorkspace/)
  assert.doesNotMatch(peopleWorkspaceCss, /height:\s*\d+(?:vh|dvh)/)
  assert.match(clientsPageSource, /<BentixResponsiveGrid as="section" preset="split"/)
  assert.match(clientsPageSource, /<BentixSection as="div"/)
  assert.match(dailyHoursPageSource, /<BentixPage style=\{pageStyle\}>/)
  assert.match(dailyHoursPageSource, /<BentixContent width="app"/)
  assert.match(dailyHoursPageSource, /<BentixSection style=\{panelStyle\}>/)
  assert.match(dailyHoursPageSource, /<BentixOverflowX/)
  assert.match(dailyHoursPageSource, /className="btx-daily-hours-main-grid"/)
  assert.match(worksPageSource, /<BentixOverflowX/)
  assert.match(worksPageSource, /<BentixSection style=\{panelStyle\}>/)
  assert.match(worksPageSource, /className="btx-works-toolbar"/)
  assert.match(materialsPageSource, /<BentixResponsiveGrid as="section" preset="split"/)
  assert.match(loginPageSource, /<BentixPage padding="none"/)
})

test('drag do Plano diÃƒÆ’Ã‚Â¡rio ativa auto-scroll da pÃƒÆ’Ã‚Â¡gina perto das margens do viewport', () => {
  assert.match(dailyPlanPageSource, /AUTO_SCROLL_EDGE_THRESHOLD = 80/)
  assert.match(dailyPlanPageSource, /window\.addEventListener\('dragover', trackDragPointer\)/)
  assert.match(dailyPlanPageSource, /window\.scrollBy\(0, scrollDelta\)/)
  assert.match(dailyPlanPageSource, /requestAnimationFrame\(stepAutoScroll\)/)
  assert.match(dailyPlanPageSource, /cancelAnimationFrame\(dragAutoScrollFrameRef\.current\)/)
})

test('/mobile/chef sem sessao redireciona para /mobile/login com redirectTo seguro', () => {
  assert.equal(
    getUnauthorizedRedirectPath('/mobile/chef'),
    '/mobile/login?redirectTo=%2Fmobile%2Fchef',
  )
})

test('/login web normal continua publico e sem redirectTo forÃƒÆ’Ã‚Â§ado', () => {
  assert.equal(isPublicAppPath('/login'), true)
  assert.equal(getUnauthorizedRedirectPath('/works'), '/login')
})

test('politica de cache desativa cache para login mobile e paginas autenticadas', () => {
  assert.equal(shouldApplyNoCache('/login'), true)
  assert.equal(shouldApplyNoCache('/mobile/login'), true)
  assert.equal(shouldApplyNoCache('/mobile/chef'), true)
  assert.equal(shouldApplyNoCache('/works'), true)
  assert.equal(shouldApplyNoCache('/api/auth/login'), false)

  assert.equal(isPublicAssetPath('/manifest.webmanifest'), true)
  assert.equal(isPublicAssetPath('/sw.js'), true)
  assert.equal(isPublicAssetPath('/icons/icon-192.png'), true)

  assert.deepEqual(getNoCacheHeaders(), {
    'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  })
})

test('versionamento PWA acrescenta versao simples ao manifest e aos assets', () => {
  assert.equal(
    appendBuildVersion('/manifest.webmanifest', 'build-123'),
    '/manifest.webmanifest?v=build-123',
  )
  assert.equal(appendBuildVersion('/sw.js', 'build-123'), '/sw.js?v=build-123')
  assert.equal(appendBuildVersion('/mobile/chef', 'build-123'), '/mobile/chef?v=build-123')
})

test('especializacao do chefe de segunda usa labels de exibicao sem criar novos roles', () => {
  assert.equal(getRoleDisplayLabel('chef_segunda', 'ferrajeiro'), 'Chefe de Ferrajeiros')
  assert.equal(getRoleDisplayLabel('chef_segunda', ''), 'Chefe de segunda')
  assert.equal(getEntityRoleLabel({ role: 'chef_segunda', chefCategory: 'carpinteiro' }), 'Chefe de Carpinteiros')
  assert.equal(getEntityRoleLabel({ role: 'chef_primeira' }), 'Chefe')
})

test('normaliza precos vazios para zero sem bloquear o outro tipo de preco', () => {
  assert.deepEqual(normalizePersonPricingInput({ price: '15', monthlyPrice: '' }), {
    price: 15,
    monthlyPrice: 0,
  })
  assert.deepEqual(normalizePersonPricingInput({ price: '', monthlyPrice: '1200' }), {
    price: 0,
    monthlyPrice: 1200,
  })
})

test('criar pessoa aceita apenas preco hora ou apenas preco mensal', async () => {
  const session = {
    role: 'admin',
    accountType: 'admin',
    accessProfile: 'admin',
  }

  const hourlyPerson = await createPersonService(session, {
    name: 'Pessoa Horaria',
    price: 15,
    role: 'carpinteiro',
  })
  const monthlyPerson = await createPersonService(session, {
    name: 'Pessoa Mensal',
    monthlyPrice: 1200,
    role: 'carpinteiro',
  })

  assert.equal(hourlyPerson.price, 15)
  assert.equal(hourlyPerson.monthlyPrice, 0)
  assert.equal(hourlyPerson.isMonthlyBilling, false)
  assert.equal(monthlyPerson.price, 0)
  assert.equal(monthlyPerson.monthlyPrice, 1200)
  assert.equal(monthlyPerson.isMonthlyBilling, true)
})

test('chefes podem ser guardados sem acesso a app e editar pode remover o acesso', async () => {
  const session = {
    role: 'admin',
    accountType: 'admin',
    accessProfile: 'admin',
  }

  const chefWithoutAccess = await createPersonService(session, {
    name: 'Chefe sem acesso',
    role: 'chef_primeira',
  })

  assert.equal(getAccessIdentityByPersonId(chefWithoutAccess.id), null)

  await updatePersonService(session, 2, {
    role: 'chef_primeira',
    accessIdentity: {
      id: 1,
      username: '',
      password: '',
    },
  })

  assert.equal(getAccessIdentityByPersonId(2), null)
})

test('admin edita draft sem publicar e a versao oficial continua vazia', async () => {
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: PLANNING_WORKFLOW_DATE,
  })

  const createdAssignment = await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
    notes: 'Primeiro draft',
  })

  const updatedAssignment = await updatePlanningDraftAssignmentService(
    ADMIN_SESSION,
    createdAssignment.id,
    {
      notes: 'Draft revisto',
    },
  )
  const workspaceView = await getPlanningWorkspaceViewService(
    ADMIN_SESSION,
    createSearchParams({ date: PLANNING_WORKFLOW_DATE }),
  )

  assert.equal(updatedAssignment.notes, 'Draft revisto')
  assert.equal(workspaceView.workspace.state, 'draft')
  assert.equal(workspaceView.items.length, 1)
  assert.equal(workspaceView.items[0].notes, 'Draft revisto')
  assert.equal(getAllWorkAssignments({ date: PLANNING_WORKFLOW_DATE }).length, 0)
})

test('dashboard summary matches all four previous card calculations, preserving legacy approval and rounding', async () => {
  const { getDashboardSummaryService } = await import('../server/services/dashboard-summary-service.js')
  const { getAllPeopleData } = await import('../lib/people.js')
  const { getAllWorkAssignmentsData } = await import('../lib/work-assignments.js')
  const { getAllWorksData } = await import('../lib/works.js')
  const { filterAssignmentsForSession } = await import('../lib/work-assignment-policy.js')
  const { isAssignmentApproved, getApprovedAssignmentTotalCost } = await import('../lib/work-assignment-approval.js')
  const { isChefRole, isWorkerRole } = await import('../lib/roles.js')
  const fixtures = buildFixtureData()
  writeJsonFile('works.json', [fixtures['works.json'][0],
    { ...fixtures['works.json'][0], id: 2, number: 102, name: 'Obra B' },
    { ...fixtures['works.json'][0], id: 3, number: 103, name: 'Obra concluída', status: 'completed' }])
  writeJsonFile('work-plans.json', [
    { id: 1, companyId: 1, date: '2030-02-10' }, { id: 2, companyId: 1, date: '2030-01-31' },
    { id: 3, companyId: 1, date: '2029-12-31' }, { id: 4, companyId: 1, date: '2031-01-01' },
  ])
  const row = (id, extra = {}) => ({ id, workPlanId: 1, workId: 1, personId: 3, hours: 10, dailyHours: 10,
    hourlyCost: 12, approvedHours: null, submitted: false, ...extra })
  writeJsonFile('work-assignments.json', [
    row(1, { approvedHours: 8, adminApprovedAt: '2030-02-10T12:00:00Z' }),
    row(2, { personId: 4, approvedHours: 0.5, hourlyCost: 0.03 }),
    row(3, { workId: 2, approvedHours: 7.5, submittedAt: '2030-02-10T10:00:00Z' }),
    row(4, { approvedHours: 0 }), row(5, { approvedHours: null, adminApprovedAt: '2030-02-10T12:00:00Z' }),
    row(6, { workPlanId: 2, approvedHours: 7.5, hourlyCost: 1.23 }),
    row(7, { workPlanId: 3, approvedHours: 8 }), row(8),
    row(9, { workId: 3, assignmentPurpose: 'access' }), row(10, { workId: 3 }),
    row(11, { workId: 2, planningVisible: false, hours: 0, dailyHours: 0 }),
    row(12, { workId: 2, planningVisible: false, submitted: true }),
    row(13, { workPlanId: 4, approvedHours: 8 }),
  ])
  const [people, all, today, month, works] = await Promise.all([
    getAllPeopleData(), getAllWorkAssignmentsData(), getAllWorkAssignmentsData({ date: '2030-02-10' }),
    getAllWorkAssignmentsData({ dateFrom: '2030-02-01', dateTo: '2030-02-28' }), getAllWorksData(),
  ])
  const ids = new Set(filterAssignmentsForSession(today, ADMIN_SESSION).filter(a => !isAssignmentApproved(a)).map(a => String(a.workId)))
  const before = {
    totalWorkers: people.filter(p => isWorkerRole(p.role) || isChefRole(p.role)).length,
    annualRevenue: all.filter(a => a.date.startsWith('2030-') && isAssignmentApproved(a))
      .reduce((sum, a) => sum + Number((Number(a.approvedHours) * Number(a.hourlyCost)).toFixed(2)), 0),
    monthlyRevenue: month.reduce((sum, a) => sum + getApprovedAssignmentTotalCost(a), 0),
    pendingWorks: works.filter(w => w.status !== 'completed' && ids.has(String(w.id))).length,
  }
  const saved = readFileSync(join(dataDir, 'work-assignments.json'), 'utf8')
  const actual = await getDashboardSummaryService(ADMIN_SESSION, createSearchParams({ date: '2030-02-10' }))
  assert.deepEqual(actual, before)
  assert.equal(actual.totalWorkers, 3)
  assert.equal(actual.pendingWorks, 2)
  assert.deepEqual(Object.keys(actual).sort(), ['annualRevenue', 'monthlyRevenue', 'pendingWorks', 'totalWorkers'])
  assert.equal(readFileSync(join(dataDir, 'work-assignments.json'), 'utf8'), saved, 'historical rows must not be rewritten')
})

test('dashboard summary enforces Admin and dashboard.read, validates dates and returns real empty totals', async () => {
  const { getDashboardSummaryService } = await import('../server/services/dashboard-summary-service.js')
  const { canAccessPathByPermission, shouldUsePermissionPathGuard } = await import('../lib/auth.js')
  for (const [session, status] of [[null, 401], [CHEF_SESSION, 403],
    [{ ...ADMIN_SESSION, role: 'responsavel', accessProfile: 'responsavel' }, 403],
    [{ ...ADMIN_SESSION, role: 'developer', accessProfile: 'developer' }, 403],
    [{ ...ADMIN_SESSION, accessProfile: 'worker_no_access', permissionKeys: [] }, 403]]) {
    await assert.rejects(() => getDashboardSummaryService(session), error => error.status === status)
  }
  assert.equal(shouldUsePermissionPathGuard({ ...ADMIN_SESSION, permissionKeys: ['dashboard.read'] }, '/api/dashboard/summary'), true)
  assert.equal(canAccessPathByPermission({ ...ADMIN_SESSION, accessProfile: 'worker_no_access', permissionKeys: [] }, '/api/dashboard/summary'), false)
  for (const date of ['', 'invalid', '2026-02-30', '2026-10-21T00:00:00Z']) {
    await assert.rejects(() => getDashboardSummaryService(ADMIN_SESSION, createSearchParams({ date: date || ' ' })), error => error.status === 400)
  }
  writeJsonFile('people.json', [])
  writeJsonFile('works.json', [])
  assert.deepEqual(await getDashboardSummaryService(ADMIN_SESSION, createSearchParams({ date: '2030-02-10' })), {
    totalWorkers: 0, annualRevenue: 0, monthlyRevenue: 0, pendingWorks: 0,
  })
  writeFileSync(join(dataDir, 'people.json'), 'invalid JSON')
  await assert.rejects(() => getDashboardSummaryService(ADMIN_SESSION), SyntaxError, 'storage failures must not become zero totals')
})

test('dashboard summary returns 400 for unsupported years and impossible calendar dates', async () => {
  const { getDashboardSummaryService } = await import('../server/services/dashboard-summary-service.js')
  for (const date of ['0999-12-31', '10000-01-01', '0001-01-01', '0000-01-01', '0099-01-01',
    '1000-02-29', '1900-02-29', '2026-02-29', '2100-02-29', '9999-02-29', '2026-04-31', '2026-13-01']) {
    await assert.rejects(() => getDashboardSummaryService(ADMIN_SESSION, createSearchParams({ date })), error => error.status === 400, date)
  }
})

test('dashboard summary includes December 31 at both supported limits and separates consecutive calendar years', async () => {
  const { getDashboardSummaryService } = await import('../server/services/dashboard-summary-service.js')
  const dates = ['1000-01-01', '1000-12-31', '9999-01-01', '9999-12-31', '2026-12-31', '2027-01-01']
  writeJsonFile('work-plans.json', dates.map((date, index) => ({ id: index + 1, companyId: 1, date })))
  writeJsonFile('work-assignments.json', dates.map((date, index) => ({
    id: index + 1, workPlanId: index + 1, workId: 1, personId: 3,
    hours: 1, dailyHours: 1, approvedHours: 1, hourlyCost: index + 1,
  })))
  const expected = [
    ['1000-01-01', 3, 1], ['1000-12-31', 3, 2],
    ['9999-01-01', 7, 3], ['9999-12-31', 7, 4],
    ['2026-12-31', 5, 5], ['2027-01-01', 6, 6],
  ]
  for (const [date, annualRevenue, monthlyRevenue] of expected) {
    const result = await getDashboardSummaryService(ADMIN_SESSION, createSearchParams({ date }))
    assert.equal(result.annualRevenue, annualRevenue, date)
    assert.equal(result.monthlyRevenue, monthlyRevenue, date)
    assert.equal(result.pendingWorks, 0, date)
  }
})

test('deleting a daily-note notification persists only its numeric source ID and updates the active count', async () => {
  const { getOperationNotifications } = await import('../lib/operation-notifications.js')
  const { deleteDailyWorkNotesService } = await import('../server/services/daily-work-notes-service.js')
  const { getNotificationDeleteSourceIds } = await import('../lib/operation-notification-state.js')
  writeJsonFile('daily-work-notes.json', [1, 2].map(id => ({
    id, date: `2030-02-${10 + id}`, workId: 1, note: `Nota ${id}`,
    authorName: 'Chefe Teste', updatedAt: '2030-02-10T10:00:00Z',
  })))
  const notices = () => getOperationNotifications({ audience: 'admin' })
  const before = await notices()
  assert.equal(before.length, 2)
  const target = before.find(item => item.id === 'daily-note-1')
  assert.ok(target)
  const result = await deleteDailyWorkNotesService(ADMIN_SESSION, { ids: getNotificationDeleteSourceIds([target]) })
  assert.equal(result.removedCount, 1)
  assert.deepEqual((await notices()).map(item => item.id), ['daily-note-2'])
  assert.deepEqual(JSON.parse(readFileSync(join(dataDir, 'daily-work-notes.json'), 'utf8')).map(item => item.id), [2])
  assert.equal((await notices()).length, 1, 'successive refreshes cannot restore the removed note')
  await assert.rejects(() => deleteDailyWorkNotesService(CHEF_SESSION, { ids: [2] }), error => error.status === 403)
  assert.equal((await notices()).length, 1, 'a rejected deletion leaves count and records unchanged')
})

test('bulk notification deletion preserves unselected notes and repeated deletion cannot change the count', async () => {
  const { getOperationNotifications } = await import('../lib/operation-notifications.js')
  const { deleteDailyWorkNotesService } = await import('../server/services/daily-work-notes-service.js')
  const { getNotificationDeleteSourceIds } = await import('../lib/operation-notification-state.js')
  const rows = [1, 2, 3].map(id => ({ id, date: `2030-02-${10 + id}`, workId: 1,
    note: `Nota ${id}`, authorName: 'Chefe Teste', updatedAt: '2030-02-10T10:00:00Z' }))
  writeJsonFile('daily-work-notes.json', rows)
  const notices = await getOperationNotifications({ audience: 'admin' })
  const selected = notices.filter(item => item.sourceId !== 2)
  const ids = getNotificationDeleteSourceIds([...selected, selected[0]])
  assert.equal((await deleteDailyWorkNotesService(ADMIN_SESSION, { ids })).removedCount, 2)
  const saved = JSON.parse(readFileSync(join(dataDir, 'daily-work-notes.json'), 'utf8'))
  assert.deepEqual(saved.map(item => item.id), [2])
  assert.equal(saved[0].note, rows[1].note)
  assert.equal(saved[0].updatedAt, rows[1].updatedAt)
  assert.equal((await deleteDailyWorkNotesService(ADMIN_SESSION, { ids })).removedCount, 0)
  for (let refresh = 0; refresh < 3; refresh += 1) {
    assert.deepEqual((await getOperationNotifications({ audience: 'admin' })).map(item => item.id), ['daily-note-2'])
  }
})

test('planning conflicts join existing notifications once, track Draft edits and disappear without changing Published', async () => {
  const { getOperationNotifications } = await import('../lib/operation-notifications.js')
  const workB = await createWorkService(ADMIN_SESSION, { number: 102, name: 'Obra B', clientId: 1, defaultHourlyCost: 12 })
  const workC = await createWorkService(ADMIN_SESSION, { number: 103, name: 'Obra C', clientId: 1, defaultHourlyCost: 12 })
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date: PLANNING_WORKFLOW_DATE })
  const base = await createPlanningDraftAssignmentService(ADMIN_SESSION, { workspaceId: workspace.id, workId: 1, personId: 3 })
  await createPlanningDraftAssignmentService(ADMIN_SESSION, { workspaceId: workspace.id, workId: 1, personId: 4 })
  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)
  await setPlanningWorkspaceToDraftService(ADMIN_SESSION, workspace.id)
  writeJsonFile('daily-work-notes.json', [{ id: 1, date: PLANNING_WORKFLOW_DATE, workId: 1, note: 'Nota existente', authorName: 'Chefe Teste', updatedAt: '2030-02-10T10:00:00Z' }])
  const notices = () => getOperationNotifications({ audience: 'admin', withYear: true })
  const conflicts = async () => (await notices()).filter(item => item.sourceType === 'planning-conflict')
  assert.equal((await conflicts()).length, 0)

  const extra = await createPlanningDraftAssignmentService(ADMIN_SESSION, { workspaceId: workspace.id, workId: workB.id, personId: 3 })
  await createPlanningDraftAssignmentService(ADMIN_SESSION, { workspaceId: workspace.id, workId: 1, personId: 2 })
  await createPlanningDraftAssignmentService(ADMIN_SESSION, { workspaceId: workspace.id, workId: workB.id, personId: 2 })
  const first = await conflicts()
  assert.equal(first.length, 1, 'chefs in multiple works must retain their existing exemption')
  assert.match(first[0].note, /Carpinteiro Teste/)
  assert.match(first[0].note, /Obra B/)
  assert.equal(first[0].href, `/daily-plan?date=${PLANNING_WORKFLOW_DATE}#planning-conflicts`)
  assert.deepEqual(await conflicts(), first, 'successive reads cannot duplicate or change versions')
  assert.equal((await notices()).filter(item => item.sourceType === 'daily-note').length, 1)
  assert.equal((await getOperationNotifications({ audience: 'responsavel' })).some(item => item.sourceType === 'planning-conflict'), false)
  assert.equal((await getOperationNotifications({ audience: 'admin', limit: 1 }))[0].id, first[0].id)

  await updatePlanningDraftAssignmentService(ADMIN_SESSION, extra.id, { personId: 4 })
  let next = await conflicts()
  assert.equal(next.length, 1)
  assert.match(next[0].note, /Ferrajeiro Teste/)
  assert.notEqual(next[0].id, first[0].id)
  await updatePlanningDraftAssignmentService(ADMIN_SESSION, extra.id, { personId: 3 })
  assert.equal((await conflicts())[0].id, first[0].id)

  await updatePlanningDraftAssignmentService(ADMIN_SESSION, base.id, { workId: workC.id })
  assert.match((await conflicts())[0].work, /Obra C/)
  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)
  assert.equal((await conflicts()).length, 1, 'publishing does not resolve a real multi-work conflict')
  const publishedBefore = JSON.stringify(getAllWorkAssignments({ date: PLANNING_WORKFLOW_DATE }))
  await setPlanningWorkspaceToDraftService(ADMIN_SESSION, workspace.id)
  await deletePlanningDraftAssignmentService(ADMIN_SESSION, extra.id)
  assert.equal((await conflicts()).length, 0, 'resolved Draft must remove the warning even while Published still has it')
  assert.equal(JSON.stringify(getAllWorkAssignments({ date: PLANNING_WORKFLOW_DATE })), publishedBefore)
  assert.equal((await notices()).filter(item => item.sourceType === 'daily-note').length, 1)
})

test('mensagem gerada usa apenas as afetaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes reais do planeamento', () => {
  const groupedAssignments = [
    {
      workId: '10',
      workName: 'Obra A',
      assignments: [
        { personId: '2', person: { name: 'Chefe Teste', role: 'chef_primeira' } },
        { personId: '3', person: { name: 'Carpinteiro Teste', role: 'carpinteiro' } },
      ],
    },
    {
      workId: '11',
      workName: 'Obra B',
      assignments: [
        { personId: '4', person: { name: 'Ferrajeiro Teste', role: 'ferrajeiro' } },
      ],
    },
  ]
  const message = buildPlanningMessagePreview({
    planningDate: '2030-02-15',
    groupedAssignments,
    selectedWorkIds: ['10', '11'],
  })

  assert.match(message, /Obra A[\s\S]*Chefe Teste/)
  assert.match(message, /Obra A[\s\S]*Carpinteiro Teste/)
  assert.match(message, /Obra B[\s\S]*Ferrajeiro Teste/)
})

test('modal de importar mensagem reutiliza o mesmo filtro da mensagem gerada', () => {
  assert.match(dailyPlanPageSource, /filterPlanningMessageAssignmentsForWork/)
  assert.match(dailyPlanPageSource, /messagePreviewAssignmentsByWorkId/)
  assert.match(dailyPlanPageSource, /Sem pessoas na mensagem/)
})

test('daily comparison prefers the previous day Published over its edited Draft and ignores current-day publication', async () => {
  const previousDate = '2030-02-09'
  const date = PLANNING_WORKFLOW_DATE
  const workB = await createWorkService(ADMIN_SESSION, { number: 102, name: 'Obra B', clientId: 1, defaultHourlyCost: 12 })
  const previous = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date: previousDate })
  const previousAssignment = await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: previous.workspace.id, workId: 1, personId: 3,
  })
  await createPlanningDraftAssignmentService(ADMIN_SESSION, { workspaceId: previous.workspace.id, workId: 1, personId: 4 })
  await publishPlanningWorkspaceService(ADMIN_SESSION, previous.workspace.id)
  await setPlanningWorkspaceToDraftService(ADMIN_SESSION, previous.workspace.id)
  await updatePlanningDraftAssignmentService(ADMIN_SESSION, previousAssignment.id, { workId: workB.id })

  const current = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date })
  await createPlanningDraftAssignmentService(ADMIN_SESSION, { workspaceId: current.workspace.id, workId: workB.id, personId: 3 })
  await createPlanningDraftAssignmentService(ADMIN_SESSION, { workspaceId: current.workspace.id, workId: workB.id, personId: 2 })
  const getView = () => getPlanningWorkspaceViewService(ADMIN_SESSION, createSearchParams({ date }))
  const beforePublish = await getView()
  assert.equal(beforePublish.previousDaySnapshot.date, previousDate)
  assert.equal(beforePublish.previousDaySnapshot.state, 'published')
  assert.equal(beforePublish.previousDaySnapshot.assignments.find(a => a.personId === 3).workId, 1)
  const compare = view => comparePlanningMessageAssignments({
    planningDate: date, assignments: view.items, previousDaySnapshot: view.previousDaySnapshot,
  })
  assert.deepEqual([...compare(beforePublish).changedPersonIds], ['3'])
  assert.deepEqual([...compare(beforePublish).newPersonIds], ['2'])
  assert.deepEqual(compare(beforePublish).removedAssignments.map(a => a.personId).sort(), [3, 4])

  await publishPlanningWorkspaceService(ADMIN_SESSION, current.workspace.id)
  const afterPublish = await getView()
  assert.equal(afterPublish.workspace.state, 'published')
  assert.deepEqual(afterPublish.previousDaySnapshot, beforePublish.previousDaySnapshot)
  assert.deepEqual([...compare(afterPublish).changedPersonIds], ['3'], 'publishing this day must not clear day-to-day differences')
  await setPlanningWorkspaceToDraftService(ADMIN_SESSION, current.workspace.id)
  assert.deepEqual([...compare(await getView()).changedPersonIds], ['3'])

  await publishPlanningWorkspaceService(ADMIN_SESSION, previous.workspace.id)
  const updatedReference = await getView()
  assert.equal(compare(updatedReference).changedPersonIds.size, 0, 'republishing the previous day refreshes its reference')
})

test('switching selected dates loads each immediately preceding calendar day, independently of today', async () => {
  const pairs = [
    ['2026-10-20', '2026-10-19'], ['2026-10-21', '2026-10-20'],
    ['2026-10-22', '2026-10-21'], ['2026-10-25', '2026-10-24'], ['2026-11-01', '2026-10-31'],
    ['2027-01-01', '2026-12-31'],
  ]
  const dates = [...new Set(pairs.flat())]
  writeJsonFile('work-plans.json', dates.map((date, index) => ({ id: index + 1, companyId: 1, date })))
  writeJsonFile('work-assignments.json', dates.map((date, index) => ({
    id: index + 1, workPlanId: index + 1, workId: 1, personId: 3, hours: 8,
  })))
  for (const [date, referenceDate] of [...pairs, ...pairs.toReversed()]) {
    const view = await getPlanningWorkspaceViewService(ADMIN_SESSION, createSearchParams({ date }))
    assert.equal(view.workspace.date, date)
    assert.equal(view.previousDaySnapshot.date, referenceDate)
    assert.equal(view.previousDaySnapshot.state, 'published')
    assert.equal(view.previousDaySnapshot.workPlanId, dates.indexOf(referenceDate) + 1)
    const changes = comparePlanningMessageAssignments({
      planningDate: date, assignments: view.items, previousDaySnapshot: view.previousDaySnapshot,
    })
    assert.equal(changes.changedPersonIds.size + changes.newPersonIds.size + changes.removedAssignments.length, 0)
  }
  const missing = await getPlanningWorkspaceViewService(ADMIN_SESSION, createSearchParams({ date: '2026-10-28' }))
  assert.equal(missing.previousDaySnapshot, null, 'a gap cannot fall back to today or the last available plan')
})

test('daily comparison uses the previous day Draft only when no publication exists, without mutating it', async () => {
  const previousDate = '2030-02-09'
  const previous = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date: previousDate })
  await createPlanningDraftAssignmentService(ADMIN_SESSION, { workspaceId: previous.workspace.id, workId: 1, personId: 3 })
  const current = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date: PLANNING_WORKFLOW_DATE })
  await createPlanningDraftAssignmentService(ADMIN_SESSION, { workspaceId: current.workspace.id, workId: 1, personId: 3 })
  const previousBefore = await getPlanningWorkspaceViewService(ADMIN_SESSION, createSearchParams({ date: previousDate }))
  const currentView = await getPlanningWorkspaceViewService(ADMIN_SESSION, createSearchParams({ date: PLANNING_WORKFLOW_DATE }))
  assert.equal(currentView.previousDaySnapshot.state, 'draft')
  assert.equal(currentView.previousDaySnapshot.date, previousDate)
  assert.equal(currentView.previousDaySnapshot.workPlanId, null)
  assert.equal(comparePlanningMessageAssignments({
    planningDate: PLANNING_WORKFLOW_DATE, assignments: currentView.items, previousDaySnapshot: currentView.previousDaySnapshot,
  }).changedPersonIds.size, 0)
  assert.deepEqual(await getPlanningWorkspaceViewService(ADMIN_SESSION, createSearchParams({ date: previousDate })), previousBefore)
  assert.equal(getWorkPlanByDate(previousDate, 1), null)
})

test('daily comparison never skips missing days and treats an empty Published as the real baseline', async () => {
  const older = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date: '2030-02-08' })
  await createPlanningDraftAssignmentService(ADMIN_SESSION, { workspaceId: older.workspace.id, workId: 1, personId: 3 })
  await publishPlanningWorkspaceService(ADMIN_SESSION, older.workspace.id)
  const current = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date: PLANNING_WORKFLOW_DATE })
  await createPlanningDraftAssignmentService(ADMIN_SESSION, { workspaceId: current.workspace.id, workId: 1, personId: 3 })
  const read = () => getPlanningWorkspaceViewService(ADMIN_SESSION, createSearchParams({ date: PLANNING_WORKFLOW_DATE }))
  assert.equal((await read()).previousDaySnapshot, null, 'do not use the latest available earlier day')
  const missingPrevious = await getPlanningWorkspaceViewService(ADMIN_SESSION, createSearchParams({ date: '2030-02-09' }))
  assert.equal(missingPrevious.workspace, null, 'comparison must not create a workspace for a missing previous day')
  const empty = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date: '2030-02-09' })
  await publishPlanningWorkspaceService(ADMIN_SESSION, empty.workspace.id)
  await setPlanningWorkspaceToDraftService(ADMIN_SESSION, empty.workspace.id)
  await createPlanningDraftAssignmentService(ADMIN_SESSION, { workspaceId: empty.workspace.id, workId: 1, personId: 3 })
  const view = await read()
  assert.equal(view.previousDaySnapshot.state, 'published')
  assert.deepEqual(view.previousDaySnapshot.assignments, [], 'empty Published takes priority over populated Draft')
  assert.deepEqual([...comparePlanningMessageAssignments({
    planningDate: PLANNING_WORKFLOW_DATE, assignments: view.items, previousDaySnapshot: view.previousDaySnapshot,
  }).newPersonIds], ['3'])
})

test('mensagem gerada exclui afetaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes persistidas como sÃƒÆ’Ã‚Â³ acesso', () => {
  const filteredAssignments = filterPlanningMessageAssignmentsForWork({
    workId: '11',
    assignments: [
      {
        personId: '2',
        assignmentPurpose: 'access',
        person: { id: '2', name: 'Chefe Acesso', role: 'chef_primeira' },
      },
      {
        personId: '3',
        assignmentPurpose: 'work',
        person: { id: '3', name: 'Carpinteiro Teste', role: 'carpinteiro' },
      },
    ],
  })

  assert.deepEqual(
    filteredAssignments.map(assignment => String(assignment.personId)),
    ['3'],
  )
})

test('inicializacao automatica cria draft a partir do ultimo planeamento publicado quando a data ainda nao existe', async () => {
  const { workspace: sourceWorkspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: AUTO_DRAFT_SOURCE_DATE,
  })

  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: sourceWorkspace.id,
    workId: 1,
    personId: 3,
    notes: 'Publicado base para copia automatica',
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, sourceWorkspace.id)

  const initializedWorkspace = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: AUTO_DRAFT_TARGET_DATE,
    clonePreviousDay: true,
    onlyIfMissing: true,
  })
  const targetWorkspaceView = await getPlanningWorkspaceViewService(
    ADMIN_SESSION,
    createSearchParams({ date: AUTO_DRAFT_TARGET_DATE }),
  )

  assert.equal(initializedWorkspace.workspace.state, 'draft')
  assert.equal(initializedWorkspace.reusedWorkspace, false)
  assert.equal(initializedWorkspace.clonedAssignments, 1)
  assert.equal(initializedWorkspace.clonedFromDate, AUTO_DRAFT_SOURCE_DATE)
  assert.equal(targetWorkspaceView.workspace.state, 'draft')
  assert.equal(targetWorkspaceView.items.length, 1)
  assert.equal(targetWorkspaceView.items[0].notes, 'Publicado base para copia automatica')
  assert.equal(targetWorkspaceView.items[0].personId, 3)
})

test('inicializacao automatica cria apenas draft e nao altera o publicado visivel aos chefes', async () => {
  const { workspace: sourceWorkspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: AUTO_DRAFT_SOURCE_DATE,
  })

  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: sourceWorkspace.id,
    workId: 1,
    personId: 3,
    notes: 'Publicado base para auto-draft invisivel',
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, sourceWorkspace.id)

  const initializedWorkspace = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: AUTO_DRAFT_TARGET_DATE,
    clonePreviousDay: true,
    onlyIfMissing: true,
  })
  const targetOfficialWorkPlan = getWorkPlanByDate(AUTO_DRAFT_TARGET_DATE, 1)
  const targetOfficialAssignments = getAllWorkAssignments({ date: AUTO_DRAFT_TARGET_DATE })
  const chefAssignments = await getWorkAssignmentsListService(
    CHEF_SESSION,
    createSearchParams({ date: AUTO_DRAFT_TARGET_DATE }),
  )

  assert.equal(initializedWorkspace.workspace.state, 'draft')
  assert.equal(targetOfficialWorkPlan, null)
  assert.equal(targetOfficialAssignments.length, 0)
  assert.deepEqual(chefAssignments, [])
})

test('inicializacao automatica nao sobrescreve um draft existente nem volta a copiar', async () => {
  const { workspace: sourceWorkspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: AUTO_DRAFT_SOURCE_DATE,
  })

  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: sourceWorkspace.id,
    workId: 1,
    personId: 3,
    notes: 'Publicado base',
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, sourceWorkspace.id)

  const firstInitialization = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: AUTO_DRAFT_TARGET_DATE,
    clonePreviousDay: true,
    onlyIfMissing: true,
  })

  await updatePlanningDraftAssignmentService(
    ADMIN_SESSION,
    firstInitialization.items[0].id,
    {
      notes: 'Rascunho alterado manualmente',
    },
  )

  const secondInitialization = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: AUTO_DRAFT_TARGET_DATE,
    clonePreviousDay: true,
    onlyIfMissing: true,
  })
  const targetWorkspaceView = await getPlanningWorkspaceViewService(
    ADMIN_SESSION,
    createSearchParams({ date: AUTO_DRAFT_TARGET_DATE }),
  )

  assert.equal(secondInitialization.workspace.id, firstInitialization.workspace.id)
  assert.equal(secondInitialization.reusedWorkspace, true)
  assert.equal(secondInitialization.clonedAssignments, 0)
  assert.equal(targetWorkspaceView.workspace.state, 'draft')
  assert.equal(targetWorkspaceView.items.length, 1)
  assert.equal(targetWorkspaceView.items[0].notes, 'Rascunho alterado manualmente')
})

test('inicializacao automatica respeita um planeamento ja publicado e nao o converte em draft', async () => {
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: AUTO_PUBLISHED_TARGET_DATE,
  })

  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 4,
    notes: 'Publicado final',
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)

  const initializationAttempt = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: AUTO_PUBLISHED_TARGET_DATE,
    clonePreviousDay: true,
    onlyIfMissing: true,
  })
  const workspaceView = await getPlanningWorkspaceViewService(
    ADMIN_SESSION,
    createSearchParams({ date: AUTO_PUBLISHED_TARGET_DATE }),
  )

  assert.equal(initializationAttempt.workspace.state, 'published')
  assert.equal(initializationAttempt.reusedWorkspace, true)
  assert.equal(initializationAttempt.clonedAssignments, 0)
  assert.equal(workspaceView.workspace.state, 'published')
  assert.equal(workspaceView.items.length, 1)
  assert.equal(workspaceView.items[0].notes, 'Publicado final')
  assert.equal(workspaceView.items[0].personId, 4)
})

test('copiar anterior cria ou substitui apenas o draft e nunca publica automaticamente', async () => {
  const { workspace: sourceWorkspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: AUTO_DRAFT_SOURCE_DATE,
  })

  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: sourceWorkspace.id,
    workId: 1,
    personId: 4,
    notes: 'Publicado base para copia manual',
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, sourceWorkspace.id)

  const copiedWorkspace = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: AUTO_DRAFT_TARGET_DATE,
    clonePreviousDay: true,
  })
  const targetOfficialWorkPlan = getWorkPlanByDate(AUTO_DRAFT_TARGET_DATE, 1)
  const targetOfficialAssignments = getAllWorkAssignments({ date: AUTO_DRAFT_TARGET_DATE })
  const chefAssignments = await getWorkAssignmentsListService(
    CHEF_SESSION,
    createSearchParams({ date: AUTO_DRAFT_TARGET_DATE }),
  )

  assert.equal(copiedWorkspace.workspace.state, 'draft')
  assert.equal(copiedWorkspace.clonedAssignments, 1)
  assert.equal(targetOfficialWorkPlan, null)
  assert.equal(targetOfficialAssignments.length, 0)
  assert.deepEqual(chefAssignments, [])
})

test('afetaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes normais mantÃƒÆ’Ã‚Âªm assignmentPurpose work apenas por compatibilidade interna', async () => {
  const targetDate = '2030-02-14'
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: targetDate,
  })

  const draftAssignment = await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
    notes: 'AfetaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o normal',
  })

  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)

  const publishedAssignment = getAllWorkAssignments({ date: targetDate }).find(
    assignment => assignment.personId === 3 && assignment.planningVisible !== false,
  )

  assert.equal(draftAssignment.assignmentPurpose, 'work')
  assert.equal(publishedAssignment?.assignmentPurpose, 'work')
})

test('chefe atribuÃƒÆ’Ã‚Â­do mantÃƒÆ’Ã‚Â©m acesso automÃƒÆ’Ã‚Â¡tico, aparece no planeamento e entra na mensagem', async () => {
  const createdWork = await createWorkService(ADMIN_SESSION, {
    name: 'Obra Chefe AtribuÃƒÆ’Ã‚Â­do',
    clientId: 1,
    number: 102,
    location: 'Porto',
    status: 'planned',
    defaultHourlyCost: 12,
  })
  const targetDate = '2030-02-15'
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: targetDate,
  })

  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: createdWork.id,
    personId: 2,
    notes: 'Chefe na obra',
  })
  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: createdWork.id,
    personId: 3,
    notes: 'Operacional',
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)

  const workspaceView = await getPlanningWorkspaceViewService(
    ADMIN_SESSION,
    createSearchParams({ date: targetDate }),
  )
  const workAssignments = workspaceView.items.filter(
    assignment => Number(assignment.workId) === Number(createdWork.id),
  )
  const identity = getAccessIdentityByPersonId(2)
  const message = buildPlanningMessagePreview({
    planningDate: targetDate,
    groupedAssignments: [
      {
        workId: String(createdWork.id),
        workName: createdWork.name,
        assignments: workAssignments,
      },
    ],
    selectedWorkIds: [String(createdWork.id)],
  })

  assert.ok(workAssignments.some(assignment => Number(assignment.personId) === 2))
  assert.ok(identity?.works?.some(work => Number(work.id) === Number(createdWork.id)))
  assert.match(message, /Chefe Teste/)
})

test('acesso extra mostra a obra no mobile sem adicionar o chefe como trabalhador', async () => {
  const createdWork = await createWorkService(ADMIN_SESSION, {
    name: 'Obra Acesso Extra',
    clientId: 1,
    number: 103,
    location: 'Braga',
    status: 'planned',
    defaultHourlyCost: 12,
  })
  const targetDate = '2030-02-16'
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: targetDate,
  })

  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: createdWork.id,
    personId: 3,
    notes: 'Operacional',
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)
  await replaceWorkExtraAccessSelectionsData({
    2: [createdWork.id],
  })

  const selections = await getWorkExtraAccessSelectionsByPersonData({ personIds: [2] })
  const identity = getAccessIdentityByPersonId(2)
  const scopedChefSession = {
    ...CHEF_SESSION,
    personId: 2,
    workIds: identity?.works?.map(work => Number(work.id)) || CHEF_SESSION.workIds,
  }
  const mobileList = await getWorkAssignmentsListService(
    scopedChefSession,
    createSearchParams({ date: targetDate, includeDefaults: true, workId: createdWork.id }),
  )

  assert.deepEqual(selections, {
    2: [createdWork.id],
  })
  assert.ok(identity?.works?.some(work => Number(work.id) === Number(createdWork.id)))
  assert.ok(mobileList.defaults.works.some(work => Number(work.id) === Number(createdWork.id)))
  assert.ok(mobileList.items.some(assignment => Number(assignment.personId) === 3))
  assert.ok(!mobileList.items.some(assignment => Number(assignment.personId) === 2))
})

test('remover acesso extra remove apenas o acesso e nÃƒÆ’Ã‚Â£o altera as afetaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes publicadas', async () => {
  const createdWork = await createWorkService(ADMIN_SESSION, {
    name: 'Obra Remover Acesso',
    clientId: 1,
    number: 104,
    location: 'SetÃƒÆ’Ã‚Âºbal',
    status: 'planned',
    defaultHourlyCost: 12,
  })
  const targetDate = '2030-02-17'
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: targetDate,
  })

  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: createdWork.id,
    personId: 3,
    notes: 'Operacional publicado',
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)
  await replaceWorkExtraAccessSelectionsData({
    2: [createdWork.id],
  })
  await replaceWorkExtraAccessSelectionsData({
    2: [],
  })

  const selections = await getWorkExtraAccessSelectionsByPersonData({ personIds: [2] })
  const identity = getAccessIdentityByPersonId(2)
  const workspaceView = await getPlanningWorkspaceViewService(
    ADMIN_SESSION,
    createSearchParams({ date: targetDate }),
  )
  const workAssignments = workspaceView.items.filter(
    assignment => Number(assignment.workId) === Number(createdWork.id),
  )

  assert.deepEqual(selections, {})
  assert.ok(!identity?.works?.some(work => Number(work.id) === Number(createdWork.id)))
  assert.equal(workAssignments.length, 1)
  assert.equal(workAssignments[0].personId, 3)
})

test('draft fica invisivel para chefes enquanto nao for publicado', async () => {
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: PLANNING_WORKFLOW_DATE,
  })

  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
    notes: 'So em draft',
  })

  const chefAssignments = await getWorkAssignmentsListService(
    CHEF_SESSION,
    createSearchParams({ date: PLANNING_WORKFLOW_DATE }),
  )

  assert.deepEqual(chefAssignments, [])
})

test('publicar torna o planeamento visivel para chefes', async () => {
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: PLANNING_WORKFLOW_DATE,
  })

  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
    notes: 'Planeamento publicado',
  })

  const publishedWorkspace = await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)
  const workPlan = getWorkPlanByDate(PLANNING_WORKFLOW_DATE, 1)
  const chefAssignments = await getWorkAssignmentsListService(
    CHEF_SESSION,
    createSearchParams({ date: PLANNING_WORKFLOW_DATE }),
  )

  assert.equal(publishedWorkspace.state, 'published')
  assert.ok(workPlan)
  assert.equal(chefAssignments.length, 1)
  assert.equal(chefAssignments[0].personId, 3)
  assert.equal(chefAssignments[0].notes, 'Planeamento publicado')
})

test('Edit devolve o planeamento a draft sem esconder a ultima versao publicada', async () => {
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: PLANNING_WORKFLOW_DATE,
  })

  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
    notes: 'Publicado antes do edit',
  })

  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)
  const draftWorkspace = await setPlanningWorkspaceToDraftService(ADMIN_SESSION, workspace.id)
  const chefAssignments = await getWorkAssignmentsListService(
    CHEF_SESSION,
    createSearchParams({ date: PLANNING_WORKFLOW_DATE }),
  )

  assert.equal(draftWorkspace.state, 'draft')
  assert.equal(chefAssignments.length, 1)
  assert.equal(chefAssignments[0].notes, 'Publicado antes do edit')
})

test('ultima versao publicada mantem-se visivel ate nova publicacao', async () => {
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: REPUBLISH_WORKFLOW_DATE,
  })

  const firstDraftAssignment = await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
    notes: 'Equipa publicada',
  })

  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)
  await setPlanningWorkspaceToDraftService(ADMIN_SESSION, workspace.id)
  await deletePlanningDraftAssignmentService(ADMIN_SESSION, firstDraftAssignment.id)
  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 4,
    notes: 'Nova equipa em draft',
  })

  const chefAssignmentsBeforeRepublish = await getWorkAssignmentsListService(
    CHEF_SESSION,
    createSearchParams({ date: REPUBLISH_WORKFLOW_DATE }),
  )

  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)

  const chefAssignmentsAfterRepublish = await getWorkAssignmentsListService(
    CHEF_SESSION,
    createSearchParams({ date: REPUBLISH_WORKFLOW_DATE }),
  )
  const officialAssignments = getAllWorkAssignments({ date: REPUBLISH_WORKFLOW_DATE })
  const hiddenPreviousAssignment = officialAssignments.find(assignment => assignment.personId === 3)
  const visibleRepublishedAssignment = officialAssignments.find(assignment => assignment.personId === 4)

  assert.equal(chefAssignmentsBeforeRepublish.length, 1)
  assert.equal(chefAssignmentsBeforeRepublish[0].personId, 3)
  assert.equal(chefAssignmentsAfterRepublish.length, 1)
  assert.equal(chefAssignmentsAfterRepublish[0].personId, 4)
  assert.equal(officialAssignments.length, 2)
  assert.equal(hiddenPreviousAssignment?.planningVisible, false)
  assert.equal(visibleRepublishedAssignment?.planningVisible, true)
})

test('workflow de submissao continua funcional com planeamento publicado', async () => {
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: PLANNING_WORKFLOW_DATE,
  })

  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
    notes: 'Submissao valida',
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)

  const publishedAssignment = getAllWorkAssignments({ date: PLANNING_WORKFLOW_DATE }).find(
    assignment => assignment.personId === 3 && assignment.planningVisible !== false,
  )
  const submittedAssignment = await submitWorkAssignmentService(CHEF_SESSION, publishedAssignment.id)

  assert.equal(submittedAssignment.submitted, true)
  assert.equal(submittedAssignment.submittedBy, 'Chefe Teste')
  assert.equal(submittedAssignment.approvedHours, null)
})

test('workflow de aprovacao continua funcional com planeamento publicado', async () => {
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: PLANNING_WORKFLOW_DATE,
  })

  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
    notes: 'Aprovacao valida',
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)

  const publishedAssignment = getAllWorkAssignments({ date: PLANNING_WORKFLOW_DATE }).find(
    assignment => assignment.personId === 3 && assignment.planningVisible !== false,
  )

  await submitWorkAssignmentService(CHEF_SESSION, publishedAssignment.id)
  const approvedAssignment = await approveWorkAssignmentService(ADMIN_SESSION, publishedAssignment.id, {
    approvedHours: 7,
  })

  assert.equal(approvedAssignment.approvedHours, 7)
  assert.equal(approvedAssignment.adminApprovedBy, 'Administrador Teste')
  assert.ok(approvedAssignment.adminApprovedAt)
})

test('admin pode corrigir planeamento ate 30 dias e datas mais antigas sao rejeitadas', async () => {
  const withinWindowDate = getLocalDateOffset(-30)
  const olderDate = getLocalDateOffset(-31)
  const futureDate = getLocalDateOffset(10)

  assert.equal(getHistoricalPlanningCorrectionState(withinWindowDate).blocked, false)
  assert.equal(getHistoricalPlanningCorrectionState(olderDate).blocked, true)
  assert.equal(getHistoricalPlanningCorrectionState(futureDate).blocked, false)

  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: withinWindowDate,
  })
  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
    notes: 'Correcao dentro da janela',
  })

  const publishedWorkspace = await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)
  assert.equal(publishedWorkspace.state, 'published')

  await assert.rejects(
    () => initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date: olderDate }),
    /corrigir planeamentos ate 30 dias/,
  )

  const futureDraft = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: futureDate,
  })
  assert.ok(futureDraft.workspace?.id)
})

test('correcao historica A para B sem horas publica a nova obra sem herdar horas', async () => {
  const date = getLocalDateOffset(-1)
  const workB = await createWorkService(ADMIN_SESSION, {
    name: 'Obra Historica B',
    clientId: 1,
    number: 120,
    location: 'Porto',
    status: 'planned',
    defaultHourlyCost: 12,
  })
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date })
  const draftA = await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
    notes: 'Obra A original',
  })

  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)
  await setPlanningWorkspaceToDraftService(ADMIN_SESSION, workspace.id)
  await updatePlanningDraftAssignmentService(ADMIN_SESSION, draftA.id, {
    workId: workB.id,
    personId: 3,
    notes: 'Obra B corrigida',
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)

  const oldAssignment = getAssignmentForDate(date, { workId: 1, personId: 3 })
  const newAssignment = getVisibleAssignmentForDate(date, { workId: workB.id, personId: 3 })

  assert.equal(oldAssignment?.planningVisible, false)
  assert.equal(oldAssignment?.hours, 0)
  assert.equal(oldAssignment?.approvedHours, null)
  assert.ok(newAssignment)
  assert.equal(newAssignment.hours, 0)
  assert.equal(newAssignment.dailyHours, 0)
  assert.equal(newAssignment.approvedHours, null)
})

test('correcao historica A para B invalida horas submetidas sem as transferir', async () => {
  const date = getLocalDateOffset(-2)
  const workB = await createWorkService(ADMIN_SESSION, {
    name: 'Obra Historica Submetida',
    clientId: 1,
    number: 120,
    location: 'Porto',
    status: 'planned',
    defaultHourlyCost: 12,
  })
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date })
  const draftA = await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
  })

  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)
  const publishedA = getVisibleAssignmentForDate(date, { workId: 1, personId: 3 })
  updateWorkAssignment(publishedA.id, { hours: 8, dailyHours: 8 })
  submitWorkAssignment(publishedA.id, 'Chefe Teste')

  await setPlanningWorkspaceToDraftService(ADMIN_SESSION, workspace.id)
  await updatePlanningDraftAssignmentService(ADMIN_SESSION, draftA.id, {
    workId: workB.id,
    personId: 3,
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)

  const oldAssignment = getAssignmentForDate(date, { workId: 1, personId: 3 })
  const newAssignment = getVisibleAssignmentForDate(date, { workId: workB.id, personId: 3 })
  const chefAssignments = await getWorkAssignmentsListService(
    { ...CHEF_SESSION, workIds: [1, workB.id] },
    createSearchParams({ date }),
  )

  assert.equal(oldAssignment?.planningVisible, false)
  assert.equal(oldAssignment?.hours, 0)
  assert.equal(oldAssignment?.dailyHours, 0)
  assert.equal(oldAssignment?.submitted, false)
  assert.equal(oldAssignment?.submittedAt, null)
  assert.equal(oldAssignment?.submittedBy, null)
  assert.equal(newAssignment?.hours, 0)
  assert.equal(newAssignment?.submitted, false)
  assert.equal(chefAssignments.length, 1)
  assert.equal(chefAssignments[0].workId, workB.id)
})

test('correcao historica A para B invalida horas aprovadas e exige nova aprovacao', async () => {
  const date = getLocalDateOffset(-3)
  const workB = await createWorkService(ADMIN_SESSION, {
    name: 'Obra Historica Aprovada',
    clientId: 1,
    number: 120,
    location: 'Porto',
    status: 'planned',
    defaultHourlyCost: 12,
  })
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date })
  const draftA = await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
  })

  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)
  const publishedA = getVisibleAssignmentForDate(date, { workId: 1, personId: 3 })
  updateWorkAssignment(publishedA.id, { hours: 8, dailyHours: 8 })
  submitWorkAssignment(publishedA.id, 'Chefe Teste')
  updateWorkAssignment(publishedA.id, {
    approvedHours: 8,
    adminApprovedAt: '2030-01-01T10:00:00.000Z',
    adminApprovedBy: 'Administrador Teste',
  })
  assert.equal(getApprovedAssignmentHours(getAssignmentForDate(date, { workId: 1, personId: 3 })), 8)

  await setPlanningWorkspaceToDraftService(ADMIN_SESSION, workspace.id)
  await updatePlanningDraftAssignmentService(ADMIN_SESSION, draftA.id, {
    workId: workB.id,
    personId: 3,
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)

  const oldAssignment = getAssignmentForDate(date, { workId: 1, personId: 3 })
  const newAssignment = getVisibleAssignmentForDate(date, { workId: workB.id, personId: 3 })
  const assignmentsAfterCorrection = getAllWorkAssignments({ date })
  const workerApprovedHours = assignmentsAfterCorrection
    .filter(assignment => Number(assignment.personId) === 3)
    .reduce((sum, assignment) => sum + getApprovedAssignmentHours(assignment), 0)
  const workAApprovedHours = assignmentsAfterCorrection
    .filter(assignment => Number(assignment.workId) === 1)
    .reduce((sum, assignment) => sum + getApprovedAssignmentHours(assignment), 0)

  assert.equal(oldAssignment?.planningVisible, false)
  assert.equal(oldAssignment?.approvedHours, null)
  assert.equal(oldAssignment?.adminApprovedAt, null)
  assert.equal(getApprovedAssignmentHours(oldAssignment), 0)
  assert.equal(workerApprovedHours, 0)
  assert.equal(workAApprovedHours, 0)
  assert.equal(newAssignment?.hours, 0)
  assert.equal(getApprovedAssignmentHours(newAssignment), 0)

  updateWorkAssignment(newAssignment.id, { hours: 7, dailyHours: 7 })
  submitWorkAssignment(newAssignment.id, 'Chefe Teste')
  assert.equal(
    getApprovedAssignmentHours(getAssignmentForDate(date, { workId: workB.id, personId: 3 })),
    0,
  )

  updateWorkAssignment(newAssignment.id, {
    approvedHours: 7,
    adminApprovedAt: '2030-01-01T12:00:00.000Z',
    adminApprovedBy: 'Administrador Teste',
  })

  const approvedB = getAssignmentForDate(date, { workId: workB.id, personId: 3 })
  assert.equal(getApprovedAssignmentHours(approvedB), 7)
})

test('republicar a mesma afetacao e editar notas preserva as horas existentes', async () => {
  const date = getLocalDateOffset(-4)
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date })
  const draftA = await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
    notes: 'Nota original',
  })

  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)
  const publishedA = getVisibleAssignmentForDate(date, { workId: 1, personId: 3 })
  updateWorkAssignment(publishedA.id, { hours: 6, dailyHours: 6 })
  submitWorkAssignment(publishedA.id, 'Chefe Teste')
  updateWorkAssignment(publishedA.id, {
    approvedHours: 6,
    adminApprovedAt: '2030-01-01T10:00:00.000Z',
    adminApprovedBy: 'Administrador Teste',
  })

  await setPlanningWorkspaceToDraftService(ADMIN_SESSION, workspace.id)
  await updatePlanningDraftAssignmentService(ADMIN_SESSION, draftA.id, {
    notes: 'Nota revista sem alterar a obra',
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)

  const preservedAssignment = getVisibleAssignmentForDate(date, { workId: 1, personId: 3 })
  assert.equal(preservedAssignment?.id, publishedA.id)
  assert.equal(preservedAssignment?.hours, 6)
  assert.equal(preservedAssignment?.approvedHours, 6)
  assert.equal(getApprovedAssignmentHours(preservedAssignment), 6)
})

test('remover trabalhador numa correcao historica invalida as horas da afetacao', async () => {
  const date = getLocalDateOffset(-5)
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date })
  const draftA = await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
  })

  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)
  const publishedA = getVisibleAssignmentForDate(date, { workId: 1, personId: 3 })
  updateWorkAssignment(publishedA.id, { hours: 5, dailyHours: 5 })
  submitWorkAssignment(publishedA.id, 'Chefe Teste')
  updateWorkAssignment(publishedA.id, {
    approvedHours: 5,
    adminApprovedAt: '2030-01-01T10:00:00.000Z',
    adminApprovedBy: 'Administrador Teste',
  })

  await setPlanningWorkspaceToDraftService(ADMIN_SESSION, workspace.id)
  await deletePlanningDraftAssignmentService(ADMIN_SESSION, draftA.id)
  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)

  const removedAssignment = getAssignmentForDate(date, { workId: 1, personId: 3 })
  assert.equal(removedAssignment?.planningVisible, false)
  assert.equal(removedAssignment?.hours, 0)
  assert.equal(removedAssignment?.approvedHours, null)
  assert.equal(getVisibleAssignmentForDate(date, { workId: 1, personId: 3 }), undefined)
})

test('correcao com multiplas afetacoes invalida apenas a relacao substituida', async () => {
  const date = getLocalDateOffset(-6)
  const workB = await createWorkService(ADMIN_SESSION, {
    name: 'Obra Historica B Multipla',
    clientId: 1,
    number: 120,
    location: 'Porto',
    status: 'planned',
    defaultHourlyCost: 12,
  })
  const workC = await createWorkService(ADMIN_SESSION, {
    name: 'Obra Historica C Multipla',
    clientId: 1,
    number: 121,
    location: 'Braga',
    status: 'planned',
    defaultHourlyCost: 13,
  })
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, { date })
  const draftA = await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
  })
  await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: workC.id,
    personId: 3,
  })

  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)
  const publishedA = getVisibleAssignmentForDate(date, { workId: 1, personId: 3 })
  const publishedC = getVisibleAssignmentForDate(date, { workId: workC.id, personId: 3 })

  updateWorkAssignment(publishedA.id, { hours: 8, dailyHours: 8 })
  submitWorkAssignment(publishedA.id, 'Chefe Teste')
  updateWorkAssignment(publishedA.id, {
    approvedHours: 8,
    adminApprovedAt: '2030-01-01T10:00:00.000Z',
    adminApprovedBy: 'Administrador Teste',
  })
  updateWorkAssignment(publishedC.id, { hours: 4, dailyHours: 4 })
  submitWorkAssignment(publishedC.id, 'Chefe Teste')
  updateWorkAssignment(publishedC.id, {
    approvedHours: 4,
    adminApprovedAt: '2030-01-01T10:30:00.000Z',
    adminApprovedBy: 'Administrador Teste',
  })

  await setPlanningWorkspaceToDraftService(ADMIN_SESSION, workspace.id)
  await updatePlanningDraftAssignmentService(ADMIN_SESSION, draftA.id, {
    workId: workB.id,
    personId: 3,
  })
  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)

  const oldA = getAssignmentForDate(date, { workId: 1, personId: 3 })
  const newB = getVisibleAssignmentForDate(date, { workId: workB.id, personId: 3 })
  const preservedC = getVisibleAssignmentForDate(date, { workId: workC.id, personId: 3 })
  const approvedTotal = getAllWorkAssignments({ date })
    .filter(assignment => Number(assignment.personId) === 3)
    .reduce((sum, assignment) => sum + getApprovedAssignmentHours(assignment), 0)

  assert.equal(oldA?.planningVisible, false)
  assert.equal(getApprovedAssignmentHours(oldA), 0)
  assert.equal(newB?.hours, 0)
  assert.equal(getApprovedAssignmentHours(newB), 0)
  assert.equal(preservedC?.id, publishedC.id)
  assert.equal(preservedC?.hours, 4)
  assert.equal(getApprovedAssignmentHours(preservedC), 4)
  assert.equal(approvedTotal, 4)
})

test('registo, edição e aprovação aceitam apenas incrementos de 0,5 h entre 0 e 24', async () => {
  const validHours = [0, 0.5, 1, 1.5, 7.5, 8, 23.5, 24]
  const invalidHours = [-1, 0.1, 0.91, 0.92, 1.25, 7.2, 7.75, 23.9, 24.5, 25, 'valor-invalido']

  for (const [index, hours] of validHours.entries()) {
    const assignment = await createWorkAssignmentService(ADMIN_SESSION, {
      date: `2030-04-${String(index + 1).padStart(2, '0')}`,
      workId: 1,
      personId: 3,
      hours,
    })

    assert.equal(assignment.hours, hours)
  }

  for (const [index, hours] of invalidHours.entries()) {
    await assert.rejects(
      () =>
        createWorkAssignmentService(ADMIN_SESSION, {
          date: `2030-04-${String(index + 10).padStart(2, '0')}`,
          workId: 1,
          personId: 3,
          hours,
        }),
      /hours tem de estar entre 0 e 24/,
    )
  }

  const assignment = await createWorkAssignmentService(ADMIN_SESSION, {
    date: '2030-04-20',
    workId: 1,
    personId: 3,
    hours: 8,
  })

  for (const hours of validHours) {
    const updatedAssignment = await updateWorkAssignmentService(ADMIN_SESSION, assignment.id, {
      hours,
    })

    assert.equal(updatedAssignment.hours, hours)
  }

  for (const hours of invalidHours) {
    await assert.rejects(
      () => updateWorkAssignmentService(ADMIN_SESSION, assignment.id, { hours }),
      /hours tem de estar entre 0 e 24/,
    )

    await assert.rejects(
      () => approveWorkAssignmentService(ADMIN_SESSION, assignment.id, { approvedHours: hours }),
      /approvedHours tem de estar entre 0 e 24/,
    )
  }

  for (const approvedHours of validHours) {
    const approvedAssignment = await approveWorkAssignmentService(ADMIN_SESSION, assignment.id, {
      approvedHours,
    })

    assert.equal(approvedAssignment.approvedHours, approvedHours)
  }
})

test('submissão aceita todos os incrementos válidos, incluindo zero e 24 horas', async () => {
  for (const [index, hours] of [0, 0.5, 1, 1.5, 7.5, 8, 23.5, 24].entries()) {
    const assignment = createWorkAssignment({ date: `2030-05-0${index + 1}`, workId: 1, personId: 3, hours })
    const submitted = await submitWorkAssignmentService(CHEF_SESSION, assignment.id)
    assert.equal(submitted.hours, hours)
    assert.equal(submitted.dailyHours, hours)
    assert.equal(submitted.submitted, true)
  }
})

test('submissão rejeita horas históricas fora do incremento sem gravar ou arredondar', async () => {
  const assignment = createWorkAssignment({ date: '2030-05-10', workId: 1, personId: 3, hours: 8 })
  const file = join(dataDir, 'work-assignments.json')
  for (const hours of [0.1, 0.91, 0.92, 1.25, 7.2, 7.75, 23.9, 24.5]) {
    const records = JSON.parse(readFileSync(file, 'utf8'))
    records[0].hours = hours
    records[0].dailyHours = hours
    writeJsonFile('work-assignments.json', records)
    const before = readFileSync(file, 'utf8')
    await assert.rejects(() => submitWorkAssignmentService(CHEF_SESSION, assignment.id), error =>
      error.status === 400 && /incrementos de 0,5/.test(error.message),
    )
    assert.throws(() => submitWorkAssignment(assignment.id, 'Chefe Teste'), /incrementos de 0,5/)
    assert.equal(readFileSync(file, 'utf8'), before)
  }
})

test('aprovação em lote valida cada valor e deixa intactas as entradas rejeitadas', async () => {
  const valid = [0, 0.5, 1, 1.5, 7.5, 8, 23.5, 24]
  const invalid = [0.1, 0.91, 0.92, 1.25, 7.2, 7.75, 23.9, 24.5]
  const items = [...valid, ...invalid].map((approvedHours, index) => {
    const assignment = createWorkAssignment({ date: `2030-06-${String(index + 1).padStart(2, '0')}`, workId: 1, personId: 3, hours: 8 })
    return { assignmentId: assignment.id, approvedHours }
  })
  const file = join(dataDir, 'work-assignments.json')
  const before = JSON.parse(readFileSync(file, 'utf8'))
  const result = await approveWorkAssignmentsBatchService(ADMIN_SESSION, { items })
  assert.equal(result.approvedCount, valid.length)
  assert.equal(result.failedCount, invalid.length)
  assert.equal(result.skippedCount, 0)
  assert.ok(result.failed.every(item => /incrementos de 0,5/.test(item.message)))
  const after = JSON.parse(readFileSync(file, 'utf8'))
  valid.forEach((value, index) => assert.equal(after[index].approvedHours, value))
  assert.deepEqual(after.slice(valid.length), before.slice(valid.length))
})

test('decimais próximos dos limites devolvem 400 sem criar planos ou alterar horas', async () => {
  const assignment = createWorkAssignment({ date: '2030-05-14', workId: 1, personId: 3, hours: 8 })
  const files = ['work-plans.json', 'work-assignments.json']
  const before = files.map(file => readFileSync(join(dataDir, file), 'utf8'))
  for (const hours of [-Number.EPSILON, Number.MIN_VALUE, 0.5 - Number.EPSILON,
    0.5 + Number.EPSILON, 24 - Number.EPSILON * 16, 24 + Number.EPSILON * 16, '0.91', '7.2']) {
    const isValidationError = error => error.status === 400 && /incrementos de 0,5/.test(error.message)
    await assert.rejects(() => createWorkAssignmentService(ADMIN_SESSION, {
      date: '2030-05-15', workId: 1, personId: 3, hours,
    }), isValidationError)
    await assert.rejects(() => updateWorkAssignmentService(ADMIN_SESSION, assignment.id, { hours }), isValidationError)
    await assert.rejects(() => approveWorkAssignmentService(ADMIN_SESSION, assignment.id, { approvedHours: hours }), isValidationError)
  }
  files.forEach((file, index) => assert.equal(readFileSync(join(dataDir, file), 'utf8'), before[index]))
})

test('serviços de dados rejeitam horas inválidas antes de criar planos ou gravar campos de horas', async () => {
  const payload = { date: '2030-05-11', workId: 1, personId: 3, hours: 7.75 }
  assert.throws(() => createWorkAssignment(payload), /incrementos de 0,5/)
  await assert.rejects(() => createWorkAssignmentData(payload), /incrementos de 0,5/)
  assert.equal(getWorkPlanByDate(payload.date, 1), null)
  const assignment = createWorkAssignment({ ...payload, hours: 8 })
  const file = join(dataDir, 'work-assignments.json')
  const before = readFileSync(file, 'utf8')
  for (const field of ['hours', 'dailyHours', 'approvedHours']) {
    assert.throws(() => updateWorkAssignment(assignment.id, { [field]: 7.75 }), /incrementos de 0,5/)
    await assert.rejects(() => updateWorkAssignmentData(assignment.id, { [field]: 7.75 }), /incrementos de 0,5/)
  }
  assert.equal(readFileSync(file, 'utf8'), before)
})

test('leitura e alterações de planeamento preservam horas históricas sem as normalizar', async () => {
  const assignment = createWorkAssignment({ date: '2030-05-12', workId: 1, personId: 3, hours: 8 })
  const file = join(dataDir, 'work-assignments.json')
  const records = JSON.parse(readFileSync(file, 'utf8'))
  Object.assign(records[0], { hours: 7.75, dailyHours: 7.2, approvedHours: 1.25, submitted: true })
  writeJsonFile('work-assignments.json', records)
  const before = readFileSync(file, 'utf8')
  const historical = await getWorkAssignmentsListService(ADMIN_SESSION, createSearchParams({ date: '2030-05-12' }))
  assert.equal(historical[0].hours, 7.75)
  assert.equal(historical[0].dailyHours, 7.2)
  assert.equal(historical[0].approvedHours, 1.25)
  assert.equal(readFileSync(file, 'utf8'), before)
  await updateWorkAssignmentPlanningData(assignment.id, { notes: 'Nota sem alteração de horas' })
  const after = JSON.parse(readFileSync(file, 'utf8'))[0]
  assert.equal(after.hours, 7.75)
  assert.equal(after.dailyHours, 7.2)
  assert.equal(after.approvedHours, 1.25)
})

test('override técnico usa a mesma validação de horas na criação e edição', async () => {
  const session = { role: 'developer', accountType: 'developer', accessProfile: 'developer', permissionKeys: ['developer.work_assignments.override_lock'] }
  const assignment = createWorkAssignment({ date: '2030-05-13', workId: 1, personId: 3, hours: 8 })
  for (const hours of [0.1, 0.91, 1.25, 7.75, 23.9, 24.5]) {
    const payload = { workPlanId: assignment.workPlanId, workId: 1, personId: 4, hours }
    await assert.rejects(() => createDeveloperOverrideWorkAssignmentService(session, payload, { reason: 'Teste de validação' }), error =>
      error.status === 400 && /incrementos de 0,5/.test(error.message),
    )
    await assert.rejects(() => updateDeveloperOverrideWorkAssignmentService(session, assignment.id, { hours }, { reason: 'Teste de validação' }), error =>
      error.status === 400 && /incrementos de 0,5/.test(error.message),
    )
  }
  const created = await createDeveloperOverrideWorkAssignmentService(session, { workPlanId: assignment.workPlanId, workId: 1, personId: 4, hours: 0.5 }, { reason: 'Teste de validação' })
  assert.equal(created.hours, 0.5)
  const updated = await updateDeveloperOverrideWorkAssignmentService(session, assignment.id, { hours: 7.5 }, { reason: 'Teste de validação' })
  assert.equal(updated.hours, 7.5)
})

test('propoe automaticamente o proximo numero de obra', () => {
  assert.equal(getNextWorkNumber(getAllWorks()), 102)
  assert.equal(getNextWorkNumber([]), 1)
  assert.equal(
    getNextWorkNumber([{ number: 8 }, { number: '15' }, { number: '' }, { number: null }]),
    16,
  )
})

test('estado operacional mostra apenas obras com pessoal afeto hoje', () => {
  const statuses = buildOperationalWorkStatuses(
    [
      { id: 1, name: 'Obra com equipa', status: 'planned' },
      { id: 2, name: 'Obra sem equipa hoje', status: 'planned' },
      { id: 3, name: 'Obra concluida', status: 'completed' },
    ],
    [
      { workId: 1, submitted: false },
      { workId: 1, submitted: true },
      { workId: 3, submitted: true },
    ],
  )

  assert.deepEqual(statuses, [
    {
      id: 1,
      name: 'Obra com equipa',
      submitted: true,
    },
  ])
})

test('criar afetaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o cria o work plan pela empresa da obra', () => {
  const assignment = createWorkAssignment({
    date: '2030-01-15',
    workId: 1,
    personId: 3,
    hours: 8,
    notes: 'Entrada de teste',
  })

  const workPlan = getWorkPlanByDate('2030-01-15', 1)
  const assignments = getAllWorkAssignments({ date: '2030-01-15' })

  assert.ok(workPlan)
  assert.equal(workPlan.companyId, 1)
  assert.equal(assignment.workPlan.companyId, 1)
  assert.equal(assignment.person.id, 3)
  assert.equal(assignment.work.id, 1)
  assert.equal(assignment.approvedHours, null)
  assert.equal(assignments.length, 1)
})

test('submeter horas marca a afetaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o como submetida e limpa approvedHours', () => {
  const assignment = createWorkAssignment({
    date: '2030-01-16',
    workId: 1,
    personId: 3,
    hours: 6,
  })

  updateWorkAssignment(assignment.id, {
    approvedHours: 4,
    adminApprovedAt: '2030-01-16T18:00:00.000Z',
    adminApprovedBy: 'Administrador Teste',
  })

  const submittedAssignment = submitWorkAssignment(assignment.id, 'Chefe Teste')

  assert.equal(submittedAssignment.submitted, true)
  assert.equal(submittedAssignment.submittedBy, 'Chefe Teste')
  assert.equal(submittedAssignment.approvedHours, null)
  assert.equal(submittedAssignment.adminApprovedAt, null)
  assert.equal(submittedAssignment.adminApprovedBy, null)
  assert.ok(submittedAssignment.submittedAt)
})

test('aprovar horas guarda approvedHours e respeita a regra admin-only', () => {
  const assignment = createWorkAssignment({
    date: '2030-01-17',
    workId: 1,
    personId: 3,
    hours: 7,
  })

  const approvedAssignment = updateWorkAssignment(assignment.id, {
    approvedHours: 7,
    adminApprovedAt: '2030-01-17T19:00:00.000Z',
    adminApprovedBy: 'Administrador Teste',
  })

  assert.equal(canApproveHours('admin'), true)
  assert.equal(canApproveHours('chef_primeira'), false)
  assert.equal(approvedAssignment.approvedHours, 7)
  assert.equal(approvedAssignment.adminApprovedBy, 'Administrador Teste')
  assert.equal(approvedAssignment.adminApprovedAt, '2030-01-17T19:00:00.000Z')
})

test('aprovacao em lote agrega obras diferentes, aprova pendentes e ignora as ja aprovadas', async () => {
  const secondWork = await createWorkService(ADMIN_SESSION, {
    name: 'Obra Batch',
    clientId: 1,
    number: 102,
    location: 'Porto',
    status: 'planned',
    defaultHourlyCost: 12,
  })
  const firstAssignment = await createWorkAssignmentService(ADMIN_SESSION, {
    date: '2030-01-18',
    workId: 1,
    personId: 3,
    hours: 8,
  })
  const secondAssignment = await createWorkAssignmentService(ADMIN_SESSION, {
    date: '2030-01-18',
    workId: secondWork.id,
    personId: 4,
    hours: 9,
  })

  await approveWorkAssignmentService(ADMIN_SESSION, secondAssignment.id, {
    approvedHours: 9,
  })

  const result = await approveWorkAssignmentsBatchService(ADMIN_SESSION, {
    items: [
      { assignmentId: firstAssignment.id, approvedHours: 8 },
      { assignmentId: secondAssignment.id, approvedHours: 9 },
    ],
  })
  const refreshedAssignments = getAllWorkAssignments({ date: '2030-01-18' })
  const approvedFirstAssignment = refreshedAssignments.find(
    assignment => Number(assignment.id) === Number(firstAssignment.id),
  )

  assert.equal(result.approvedCount, 1)
  assert.equal(result.skippedCount, 1)
  assert.equal(result.failedCount, 0)
  assert.equal(approvedFirstAssignment?.approvedHours, 8)
})

test('aprovacao em lote respeita permissoes de admin-only', async () => {
  const assignment = createWorkAssignment({
    date: '2030-01-19',
    workId: 1,
    personId: 3,
    hours: 8,
  })

  await assert.rejects(
    approveWorkAssignmentsBatchService(CHEF_SESSION, {
      items: [{ assignmentId: assignment.id, approvedHours: 8 }],
    }),
    /Apenas administradores podem aprovar horas/,
  )
})

test('warning diario agrega horas registadas por pessoa em varias obras e respeita sabado', async () => {
  const secondWork = await createWorkService(ADMIN_SESSION, {
    name: 'Obra Warning',
    clientId: 1,
    number: 102,
    location: 'Braga',
    status: 'planned',
    defaultHourlyCost: 12,
  })
  const saturdayDate = Array.from({ length: 31 }, (_, index) => {
    const day = String(index + 1).padStart(2, '0')
    return `2030-06-${day}`
  }).find(date => new Date(`${date}T00:00:00`).getDay() === 6)
  const weekdayDate = '2030-06-03'
  const weekdayWarnings = buildDailyHoursWarningMap(
    [
      { personId: 3, workId: 1, hours: 5 },
      { personId: 3, workId: secondWork.id, hours: 3 },
    ],
    weekdayDate,
  )
  const saturdayWarnings = buildDailyHoursWarningMap(
    [
      { personId: 3, workId: 1, hours: 7 },
    ],
    saturdayDate,
  )

  assert.ok(saturdayDate)
  assert.equal(weekdayWarnings.get('3')?.expectedHours, 10)
  assert.equal(weekdayWarnings.get('3')?.recordedHours, 8)
  assert.equal(weekdayWarnings.get('3')?.message, 'Faltam 2 h')
  assert.equal(saturdayWarnings.size, 0)
})

test('criacao de horas pelo administrador regista criador e ultimo modificador', async () => {
  const assignment = await createWorkAssignmentService(ADMIN_SESSION, {
    date: '2030-01-20',
    workId: 1,
    personId: 3,
    hours: 8,
  })

  assert.equal(assignment.hoursCreatedByName, 'Administrador Teste')
  assert.equal(assignment.hoursUpdatedByName, 'Administrador Teste')
  assert.ok(assignment.hoursCreatedAt)
  assert.ok(assignment.hoursUpdatedAt)
})

test('submissao do chefe preserva a origem das horas e separa aprovacao do administrador', async () => {
  const assignment = createWorkAssignment({
    date: '2030-01-21',
    workId: 1,
    personId: 3,
    hours: 6,
  })
  const submittedAssignment = await submitWorkAssignmentService(CHEF_SESSION, assignment.id)
  const approvedAssignment = await approveWorkAssignmentService(ADMIN_SESSION, assignment.id, {
    approvedHours: 6,
  })

  assert.equal(submittedAssignment.hoursCreatedByName, 'Chefe Teste')
  assert.equal(submittedAssignment.hoursUpdatedByName, 'Chefe Teste')
  assert.equal(approvedAssignment.hoursCreatedByName, 'Chefe Teste')
  assert.equal(approvedAssignment.hoursUpdatedByName, 'Chefe Teste')
  assert.equal(approvedAssignment.adminApprovedBy, 'Administrador Teste')
})

test('remover obra limpa afetacoes antigas e permite remover o cliente a seguir', async () => {
  createWorkAssignment({
    date: '2030-01-18',
    workId: 1,
    personId: 3,
    hours: 8,
    notes: 'Afetacao historica',
  })

  const adminSession = {
    role: 'admin',
    accountType: 'operational',
  }

  assert.equal(getAllWorks().length, 1)
  assert.equal(getAllWorkAssignments({ workId: 1 }).length, 1)
  assert.equal(getAllWorkPlans().length, 1)

  const deleteWorkResult = await deleteWorkService(adminSession, 1)

  assert.equal(deleteWorkResult.message, 'Obra removida com sucesso')
  assert.equal(getAllWorks().length, 0)
  assert.equal(getAllWorkAssignments({ workId: 1 }).length, 0)
  assert.equal(getAllWorkPlans().length, 0)

  const deleteClientResult = await deleteClientService(adminSession, 1)

  assert.equal(deleteClientResult.message, 'Cliente removido com sucesso')
  assert.equal(getAllClients().length, 0)
})

test('Plano diÃƒÆ’Ã‚Â¡rio usa a toolbar final, confirmaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes antes de substituir e quick-add contextual', () => {
  assert.match(dailyPlanPageSource, /Novo plano/)
  assert.match(dailyPlanPageSource, /Copiar anterior/)
  assert.match(dailyPlanPageSource, /Editar publica.*o/)
  assert.match(dailyPlanPageSource, /requestCreateWorkPlanConfirmation\(false\)/)
  assert.match(dailyPlanPageSource, /requestCreateWorkPlanConfirmation\(true\)/)
  assert.match(dailyPlanPageSource, /Criar novo plano\?/)
  assert.match(dailyPlanPageSource, /Copiar planeamento anterior\?/)
  assert.match(dailyPlanPageSource, /className="vp-planning-work-quick-add"/)
  assert.match(globalCssSource, /\.vp-planning-work-card:hover \.vp-planning-work-quick-add/)
})

test('Plano diÃƒÆ’Ã‚Â¡rio sÃƒÆ’Ã‚Â³ publica atravÃƒÆ’Ã‚Â©s da aÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o manual Publicar', () => {
  assert.equal((dailyPlanPageSource.match(/publishPlanningWorkspace\(/g) || []).length, 1)
  assert.match(dailyPlanPageSource, /async function handlePublishPlanning\(\)/)
})

test('modal de editar pessoa usa Cliente -> Obra e remove informaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o tÃƒÆ’Ã‚Â©cnica', () => {
  assert.match(dailyPlanPageSource, /name="clientId"/)
  assert.match(dailyPlanPageSource, /filteredActiveWorks\.map/)
  assert.doesNotMatch(dailyPlanPageSource, /ID da afetaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o:/)
  assert.doesNotMatch(dailyPlanPageSource, /PreÃƒÆ’Ã‚Â§o automÃƒÆ’Ã‚Â¡tico pela hierarquia:/)
  assert.match(dailyPlanPageSource, /Editar pessoa/)
  assert.match(dailyPlanPageSource, /Resumo/)
})

test('Registo diÃƒÆ’Ã‚Â¡rio do admin mostra apenas obras com afetaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes na data selecionada', () => {
  assert.match(dailyHoursPageSource, /const adminAssignedWorks = useMemo\(\(\) =>/)
  assert.match(dailyHoursPageSource, /dailyEntries[\s\S]*entry => String\(entry\.workId \|\| ''\)\.trim\(\)/)
  assert.match(dailyHoursPageSource, /const visibleWorks = isChef \? activeWorks : adminAssignedWorks/)
  assert.match(dailyHoursPageSource, /visibleWorks\.map\(work => \(/)
  assert.match(dailyHoursPageSource, /N[^\n]*obras atribu[^\n]*data selecionada\./)
})
test('Registo diÃƒÆ’Ã‚Â¡rio do admin usa batch approval, confirmaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o global e origem das horas', () => {
  assert.match(dailyHoursPageSource, /approveWorkAssignmentsBatch\(/)
  assert.match(dailyHoursPageSource, /Aprovar todas as obras/)
  assert.match(dailyHoursPageSource, /Aprovar todas as horas\?/)
  assert.match(
    dailyHoursPageSource,
    /Ser[^\n]*o aprovadas todas as horas eleg[^\n]*das obras apresentadas para o dia selecionado\./,
  )
  assert.match(
    dailyHoursPageSource,
    /Existem diferen[^\n]* relativamente [^\n]* horas esperadas\. Confirme que foram verificadas\./,
  )
  assert.match(dailyHoursPageSource, /Submetido pelo chefe/)
  assert.match(dailyHoursPageSource, /Introduzido pelo administrador/)
  assert.match(dailyHoursPageSource, /Esperado:/)
  assert.doesNotMatch(dailyHoursPageSource, /const approvePromises = selectedWorkEntries\.map/)
})

test('People page reuses the global sidebar, responsive master/detail and the real documents panel', () => {
  assert.match(peoplePageSource, /<AdminSidebar activePath="\/people" mobileNavigation/)
  assert.match(peoplePageSource, /sidebarStyles\.dashboard/)
  assert.match(peopleWorkspaceCss, /@media \(max-width: 899px\)/)
  assert.match(peopleWorkspaceSource, /<PersonDocumentsPanel/)
  assert.match(peopleWorkspaceSource, /onDoubleClick=\{\(\) => onOpenPerson\(item\.id\)\}/)
  assert.match(peopleWorkspaceSource, /role="tablist"/)
  assert.doesNotMatch(peopleWorkspaceSource, /type="file"/)
})

test('Dashboard usa branding Bentix e adota a linguagem visual nova', () => {
  assert.match(homePageSource, /BentixLogo/)
  assert.match(homePageSource, /BENTIX/)
  assert.doesNotMatch(homePageSource, /BenPin|BENPIN/)
  assert.match(homePageSource, /className="btx-dashboard-hero"/)
  assert.match(homePageSource, /className="btx-dashboard-module-card"/)
  assert.match(homePageSource, /style=\{cardLabelStyle\}>\{module\.label\}/)
  assert.doesNotMatch(homePageSource, /Centro operacional/)
  assert.doesNotMatch(homePageSource, /heroKickerStyle/)
  assert.doesNotMatch(homePageSource, /dashboardKickerStyle/)
  assert.doesNotMatch(homePageSource, /Abrir m[oó]dulo/)
  assert.match(globalCssSource, /\.btx-dashboard-module-card:hover\s*\{/)
  assert.doesNotMatch(homePageSource, /padding="tight"/)
  assert.doesNotMatch(homePageSource, /width="dashboard"/)
})

test('Works page aplica toolbar, listas e rows responsivas do sistema adaptativo', () => {
  assert.match(worksPageSource, /className="btx-works-toolbar"/)
  assert.match(worksPageSource, /className="btx-works-hero-actions"/)
  assert.match(worksPageSource, /className="btx-works-work-row"/)
  assert.match(worksPageSource, /className="btx-works-lists-grid"/)
  assert.match(globalCssSource, /\.btx-works-work-row\s*\{/)
  assert.match(globalCssSource, /\.btx-works-toolbar\s*\{/)
})

test('exportacao de resumo de obras usa apenas o fluxo final do cliente sem modos simples ou avancados', () => {
  assert.match(worksPageSource, /ClientReportsModal/)
  assert.match(worksPageSource, />\s*Relat.*rios\s*</)
  assert.doesNotMatch(worksPageSource, /summaryExportMode/)
  assert.doesNotMatch(worksPageSource, />\s*Simples\s*</)
  assert.doesNotMatch(worksPageSource, />\s*Avancado\s*</)
  assert.doesNotMatch(worksPageSource, /Adicionar grupo/)
})

test('exportacao de resumo usa endpoint dedicado por cliente e remove o fluxo ZIP agrupado', () => {
  assert.match(worksPageSource, /handleClientSummaryExport/)
  assert.match(
    readFileSync(join(repoRoot, 'frontend', 'controllers', 'work-summary-export-controller.js'), 'utf8'),
    /\/api\/clients\/\$\{clientId\}\/summary-export/,
  )
  assert.doesNotMatch(
    readFileSync(join(repoRoot, 'frontend', 'controllers', 'work-summary-export-controller.js'), 'utf8'),
    /summary-export-grouped|application\/zip/,
  )
})

test('rota real /works usa Adicionar cliente no hero e Relatorios na secao Clientes', () => {
  assert.match(homePageSource, /href:\s*'\/works'/)
  assert.match(homePageSource, /title:\s*'Clientes\/Obras'/)
  assert.match(worksPageSource, /CompanyReportsModal/)
  assert.match(worksPageSource, /openCompanyReportsModal/)
  assert.match(
    worksPageSource,
    /\) : false \? \([\s\S]*\) : \(\s*<button type="button" onClick=\{startCreateClient\} style=\{heroPrimaryButtonStyle\}>[\s\S]*Adicionar cliente[\s\S]*\)\}/,
  )
  assert.match(
    worksPageSource,
    /<h2 style=\{\{ margin: 0 \}\}>Clientes<\/h2>[\s\S]*openCompanyReportsModal[\s\S]*Relat/,
  )
  assert.doesNotMatch(worksPageSource, /toggleGeneralAnnualSummary/)
  assert.doesNotMatch(worksPageSource, /openGeneralAnnualSummaryReport/)
})

test('detalhe de cliente expõe apenas Adicionar obra no hero e mantém Relatórios na secção de Obras ativas', () => {
  assert.match(
    worksPageSource,
    /\{dedicatedClientView \? \(\s*<button type="button" onClick=\{startCreate\} style=\{heroPrimaryButtonStyle\}>[\s\S]*Adicionar obra[\s\S]*\) : \(/,
  )
  assert.doesNotMatch(
    worksPageSource,
    /dedicatedClientView \? \([\s\S]*Adicionar cliente[\s\S]*Adicionar obra/,
  )
  assert.match(
    worksPageSource,
    /<h2 style=\{\{ margin: 0 \}\}>Obras ativas<\/h2>[\s\S]*openReportsModal/,
  )
  assert.match(worksPageSource, /Informação do cliente/)
  assert.doesNotMatch(worksPageSource, /Resumo anual de \{selectedClient\.name\}/)
})

test('detalhe da obra usa Relatórios como entrada e mantém o fluxo simples de exportação no modal', () => {
  assert.match(workDetailPageSource, /<BentixPage style=\{pageStyle\}>/)
  assert.match(workDetailPageSource, /<BentixContent width="app" gap="lg" style=\{shellStyle\}>/)
  assert.match(workDetailPageSource, /<BentixResponsiveGrid preset="stats" style=\{statGridStyle\}>/)
  assert.match(workDetailPageSource, /const contentFlowStyle = \{/)
  assert.match(
    workDetailPageSource,
    /<div style=\{heroHeaderStyle\}>\s*<h1 style=\{\{ margin: 0, fontSize: '44px', lineHeight: 1\.05 \}\}>\s*\{work\.name\}\s*<\/h1>\s*<\/div>/,
  )
  assert.match(
    workDetailPageSource,
    /<div style=\{\{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' \}\}>\s*<h2 style=\{\{ margin: 0 \}\}>Afeta.*es da obra este m.*<\/h2>\s*\{assignments.length > 0 && \(\s*<BentixButton[\s\S]*?variant="secondary"[\s\S]*?onClick=\{openExportModal\}[\s\S]*?>\s*Relat.*rios\s*<\/BentixButton>\s*\)\}\s*<\/div>/,
  )
  assert.match(workDetailPageSource, /Relat.*rios/)
  assert.match(workDetailPageSource, /Escolher m.*s/)
  assert.match(workDetailPageSource, /Exportar Excel/)
  assert.match(workDetailPageSource, /Exportar PDF/)
  assert.doesNotMatch(
    workDetailPageSource,
    /<div style=\{\{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' \}\}>\s*<h2 style=\{\{ margin: 0 \}\}>Afeta.*es da obra este m.*<\/h2>\s*\{assignments.length > 0 && \(\s*<BentixButton[\s\S]*?onClick=\{openExportModal\}[\s\S]*?>\s*Exportar\s*<\/BentixButton>\s*\)\}\s*<\/div>/,
  )
  assert.doesNotMatch(workDetailPageSource, /maxWidth:\s*'1180px'/)
  assert.doesNotMatch(workDetailPageSource, /lockViewport/)
  assert.doesNotMatch(workDetailPageSource, /ViewportScrollArea/)
  assert.doesNotMatch(workDetailPageSource, /ClientReportsModal|CompanyReportsModal/)
})

test('pagina global de clientes expoe apenas acoes da empresa e centraliza relatorios no modal', () => {
  assert.match(clientsPageSource, />\s*Relat.*rios\s*</)
  assert.match(clientsPageSource, />\s*Adicionar cliente\s*</)
  assert.match(clientsPageSource, /Resumo anual da empresa/)
  assert.match(clientsPageSource, /Resumo anual com estat.* todos os clientes\./)
  assert.match(clientsPageSource, /handleOpenAnnualCompanySummary/)
  assert.doesNotMatch(clientsPageSource, />\s*Adicionar obra\s*</)
})

test('modal de relatorios globais mostra apenas a acao direta de exportar PDF', () => {
  assert.match(companyReportsModalSource, /Relat.*rios/)
  assert.match(companyReportsModalSource, /Resumo anual da empresa/)
  assert.match(companyReportsModalSource, /Exportar PDF/)
  assert.match(companyReportsModalSource, /ModalCloseButton/)
  assert.match(companyReportsModalSource, /onExportAnnualSummaryPdf/)
  assert.doesNotMatch(companyReportsModalSource, /Ver resumo anual|Abrir resumo anual/)
  assert.doesNotMatch(companyReportsModalSource, /Gest.*o global da empresa/)
  assert.doesNotMatch(companyReportsModalSource, /Resumo anual com estat.* todos os clientes\./)
  assert.doesNotMatch(companyReportsModalSource, /onOpenAnnualSummary|loadingAnnualSummary|showAnnualSummary/)
})

test('modal de relatorios do cliente usa a versao simplificada com duas entradas limpas', () => {
  assert.match(clientReportsModalSource, /Relat.*rios/)
  assert.match(clientReportsModalSource, /Resumo anual/)
  assert.match(clientReportsModalSource, /Exportar PDF/)
  assert.match(clientReportsModalSource, /Resumo de horas/)
  assert.match(clientReportsModalSource, /Configurar resumo/)
  assert.doesNotMatch(clientReportsModalSource, /client\?\.name \|\| 'Cliente'/)
  assert.doesNotMatch(clientReportsModalSource, /buildAnnualSummaryDescription/)
  assert.doesNotMatch(clientReportsModalSource, /Ver resumo anual|Abrir resumo anual/)
  assert.doesNotMatch(clientReportsModalSource, /Resumo detalhado do cliente/)
  assert.doesNotMatch(clientReportsModalSource, /Resumo mensal do cliente/)
})

test('configuracao do resumo de horas do cliente volta a expor PDF e Excel no mesmo fluxo', () => {
  assert.match(clientSummaryExportModalSource, /Exportar PDF/)
  assert.match(clientSummaryExportModalSource, /Exportar Excel/)
  assert.doesNotMatch(clientSummaryExportModalSource, /Gerar XLSX/)
  assert.match(worksPageSource, /async function handleClientSummaryExport\(payload, requestedFormat = 'xlsx'\)/)
  assert.match(worksPageSource, /format:\s*requestedFormat/)
})

test('pdf do resumo anual do cliente usa cabecalho simplificado e rodape profissional', () => {
  assert.match(clientAnnualSummaryPdfTemplateSource, /RESUMO ANUAL/)
  assert.match(clientAnnualSummaryPdfTemplateSource, /Ano \$\{escapeHtml\(String\(year\)\)\}/)
  assert.match(clientAnnualSummaryPdfTemplateSource, /Emitido em \$\{escapeHtml\(issuedAt\)\}/)
  assert.match(clientAnnualSummaryPdfTemplateSource, /counter\(page\)/)
  assert.match(clientAnnualSummaryPdfTemplateSource, /formatPdfMonthTitleCase\(row\.monthLabel\)/)
  assert.match(clientAnnualSummaryPdfTemplateSource, /buildPdfReportTableLayout\(tableColumns/)
  assert.match(clientAnnualSummaryPdfTemplateSource, /table-layout: fixed/)
  assert.match(clientAnnualSummaryPdfTemplateSource, /overflow-wrap: anywhere/)
  assert.match(clientAnnualSummaryPdfTemplateSource, /break-before: page/)
  assert.match(worksPageSource, /function renderPdfReportTableSections/)
  assert.match(worksPageSource, /<colgroup>/)
  assert.doesNotMatch(clientAnnualSummaryPdfTemplateSource, /Data de emiss.*o/)
  assert.doesNotMatch(clientAnnualSummaryPdfTemplateSource, /Contacto/)
  assert.doesNotMatch(clientAnnualSummaryPdfTemplateSource, /meta-card|meta-label|meta-value/)
})

test('modais de relatorios usam fecho por icone com aria-label acessivel', () => {
  assert.match(modalCloseButtonSource, /aria-label="Fechar"/)
  assert.match(modalCloseButtonSource, /title="Fechar"/)
  assert.match(modalCloseButtonSource, /iconOnly/)
  assert.match(modalCloseButtonSource, /✕/)
  assert.match(companyReportsModalSource, /ModalCloseButton/)
  assert.match(clientReportsModalSource, /ModalCloseButton/)
  assert.doesNotMatch(companyReportsModalSource, />\s*Fechar\s*</)
  assert.doesNotMatch(clientReportsModalSource, />\s*Fechar\s*</)
})

test('pagina global /works liga o modal global diretamente ao export PDF existente', () => {
  const companyReportsModalUsage = worksPageSource.match(
    /<CompanyReportsModal[\s\S]*?onExportAnnualSummaryPdf=\{exportGeneralAnnualSummaryPdf\}[\s\S]*?\/>/,
  )?.[0]

  assert.ok(companyReportsModalUsage)
  assert.match(companyReportsModalUsage, /exportingAnnualPdf=\{exportingGeneralAnnualPdf\}/)
  assert.match(companyReportsModalUsage, /onExportAnnualSummaryPdf=\{exportGeneralAnnualSummaryPdf\}/)
  assert.doesNotMatch(companyReportsModalUsage, /showAnnualSummary=\{|loadingAnnualSummary=\{|onOpenAnnualSummary=\{/)
})
