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
const dailyHoursPageSource = readFileSync(join(repoRoot, 'app', 'daily-hours', 'page.js'), 'utf8')
const viewportLayoutSource = readFileSync(join(repoRoot, 'app', 'components', 'ViewportLayout.js'), 'utf8')
const globalCssSource = readFileSync(join(repoRoot, 'app', 'globals.css'), 'utf8')
const homePageSource = readFileSync(join(repoRoot, 'app', 'page.js'), 'utf8')
const peoplePageSource = readFileSync(join(repoRoot, 'app', 'people', 'page.js'), 'utf8')
const clientsPageSource = readFileSync(join(repoRoot, 'app', 'clients', 'page.js'), 'utf8')
const worksPageSource = readFileSync(join(repoRoot, 'app', 'works', 'page.js'), 'utf8')
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
  filterPlanningMessageAssignmentsForWork,
} = await import('../lib/planning-message.js')
const { getEntityRoleLabel, getRoleDisplayLabel } = await import('../lib/roles.js')
const { getTomorrowPlanningDateValue } = await import('../lib/planning-date.js')
const { buildLoginRedirectPath, getSafeRedirectPath } = await import('../lib/safe-redirect.js')
const { buildOperationalWorkStatuses } = await import('../lib/work-operation-status.js')
const { getNextWorkNumber } = await import('../lib/work-numbering.js')
const {
  getWorkExtraAccessSelectionsByPersonData,
  replaceWorkExtraAccessSelectionsData,
} = await import('../lib/work-extra-access-grants.js')
const { deleteClientService } = await import('../server/services/clients-service.js')
const { createPersonService, updatePersonService } = await import('../server/services/people-service.js')
const { createWorkService, deleteWorkService } = await import('../server/services/works-service.js')
const {
  createWorkAssignment,
  getAllWorkAssignments,
  submitWorkAssignment,
  updateWorkAssignment,
} = await import('../lib/work-assignments.js')
const { getAllWorkPlans, getWorkPlanByDate } = await import('../lib/work-plans.js')
const {
  approveWorkAssignmentService,
  getWorkAssignmentsListService,
  submitWorkAssignmentService,
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

test('Plano diário arranca com amanhã como data predefinida em hora local', () => {
  assert.equal(getTomorrowPlanningDateValue(new Date(2026, 6, 5, 10, 30, 0)), '2026-07-06')
  assert.match(dailyPlanPageSource, /useState\(\(\) => getTomorrowPlanningDateValue\(\)\)/)
})

test('Plano diário usa scroll único da página e não mantém área interna com scroll próprio', () => {
  assert.doesNotMatch(dailyPlanPageSource, /lockViewport/)
  assert.doesNotMatch(dailyPlanPageSource, /ViewportScrollArea/)
})

test('workspace do Plano diário usa grelha em fluxo normal e rodapé de ação sem sobreposição', () => {
  assert.match(dailyPlanPageSource, /className="vp-planning-work-grid"/)
  assert.match(globalCssSource, /\.vp-planning-work-grid\s*\{[\s\S]*grid-auto-flow:\s*row/)
  assert.match(globalCssSource, /\.vp-planning-work-grid\s*\{[\s\S]*grid-auto-rows:\s*auto/)
  assert.match(globalCssSource, /\.vp-planning-secondary-action-bar\s*\{[\s\S]*justify-content:\s*flex-end/)
  assert.doesNotMatch(globalCssSource, /\.vp-planning-secondary-action-bar\s*\{[\s\S]*margin-top:\s*auto/)
})

test('Plano diário usa o modal final de acessos às obras e remove o workflow temporário dos chefes', () => {
  assert.match(dailyPlanPageSource, /Acessos às obras/)
  assert.match(dailyPlanPageSource, /Acesso automático por afetação/)
  assert.match(dailyPlanPageSource, /Ainda não existem chefes afetos a este planeamento\./)
  assert.match(dailyPlanPageSource, /eligibleChefAccessPeople/)
  assert.match(dailyPlanPageSource, /String\(work\.name \|\| 'Obra sem nome'\)/)
  assert.doesNotMatch(
    dailyPlanPageSource,
    /Selecione em quais obras cada chefe deve ter acesso extra\./,
  )
  assert.doesNotMatch(dailyPlanPageSource, /Chefes afetos a várias obras/)
  assert.doesNotMatch(dailyPlanPageSource, /Tipo de afetação do chefe/)
  assert.doesNotMatch(dailyPlanPageSource, /Dar estrela a este chefe/)
})

test('Adaptive Layout System expõe primitivas reutilizáveis e classes globais partilhadas', () => {
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

test('páginas de maior risco usam scroll principal da página sem ViewportScrollArea nem lockViewport', () => {
  for (const source of [
    homePageSource,
    peoplePageSource,
    clientsPageSource,
    worksPageSource,
    materialsPageSource,
    loginPageSource,
  ]) {
    assert.doesNotMatch(source, /lockViewport/)
    assert.doesNotMatch(source, /ViewportScrollArea/)
  }
})

test('páginas principais migradas usam primitivas adaptativas sem listas principais com altura fixa', () => {
  assert.match(homePageSource, /<BentixPage padding="tight"/)
  assert.match(homePageSource, /<BentixContent width="dashboard"/)
  assert.match(homePageSource, /<BentixResponsiveGrid preset="dashboard-main"/)
  assert.match(homePageSource, /className="btx-dashboard-responsavel-calendar"/)
  assert.match(peoplePageSource, /<BentixContent width="app"/)
  assert.match(peoplePageSource, /<BentixSection style=\{panelStyle\}>/)
  assert.match(peoplePageSource, /<BentixResponsiveGrid[\s\S]*preset=\{canManagePeople \? 'split' : 'cards'\}/)
  assert.match(peoplePageSource, /className="btx-people-toolbar"/)
  assert.match(globalCssSource, /\.btx-people-toolbar\s*\{/)
  assert.match(
    peoplePageSource,
    /const peopleListStyle = \{\s*display: 'grid',\s*gap: '12px',\s*\}/,
  )
  assert.match(clientsPageSource, /<BentixResponsiveGrid as="section" preset="split"/)
  assert.match(clientsPageSource, /<BentixSection as="div"/)
  assert.match(worksPageSource, /<BentixOverflowX/)
  assert.match(materialsPageSource, /<BentixResponsiveGrid as="section" preset="split"/)
  assert.match(loginPageSource, /<BentixPage padding="none"/)
})

test('drag do Plano diário ativa auto-scroll da página perto das margens do viewport', () => {
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

test('/login web normal continua publico e sem redirectTo forçado', () => {
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

test('mensagem gerada usa apenas as afetações reais do planeamento', () => {
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

test('mensagem gerada exclui afetações persistidas como só acesso', () => {
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

test('afetações normais mantêm assignmentPurpose work apenas por compatibilidade interna', async () => {
  const targetDate = '2030-02-14'
  const { workspace } = await initializePlanningWorkspaceDraftService(ADMIN_SESSION, {
    date: targetDate,
  })

  const draftAssignment = await createPlanningDraftAssignmentService(ADMIN_SESSION, {
    workspaceId: workspace.id,
    workId: 1,
    personId: 3,
    notes: 'Afetação normal',
  })

  await publishPlanningWorkspaceService(ADMIN_SESSION, workspace.id)

  const publishedAssignment = getAllWorkAssignments({ date: targetDate }).find(
    assignment => assignment.personId === 3 && assignment.planningVisible !== false,
  )

  assert.equal(draftAssignment.assignmentPurpose, 'work')
  assert.equal(publishedAssignment?.assignmentPurpose, 'work')
})

test('chefe atribuído mantém acesso automático, aparece no planeamento e entra na mensagem', async () => {
  const createdWork = await createWorkService(ADMIN_SESSION, {
    name: 'Obra Chefe Atribuído',
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

test('remover acesso extra remove apenas o acesso e não altera as afetações publicadas', async () => {
  const createdWork = await createWorkService(ADMIN_SESSION, {
    name: 'Obra Remover Acesso',
    clientId: 1,
    number: 104,
    location: 'Setúbal',
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

test('criar afetação cria o work plan pela empresa da obra', () => {
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

test('submeter horas marca a afetação como submetida e limpa approvedHours', () => {
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

test('Plano diário usa a toolbar final, confirmações antes de substituir e quick-add contextual', () => {
  assert.match(dailyPlanPageSource, /Novo plano/)
  assert.match(dailyPlanPageSource, /Copiar anterior/)
  assert.match(dailyPlanPageSource, /Editar publica[cç][aã]o/)
  assert.match(dailyPlanPageSource, /requestCreateWorkPlanConfirmation\(false\)/)
  assert.match(dailyPlanPageSource, /requestCreateWorkPlanConfirmation\(true\)/)
  assert.match(dailyPlanPageSource, /Criar novo plano\?/)
  assert.match(dailyPlanPageSource, /Copiar planeamento anterior\?/)
  assert.match(dailyPlanPageSource, /className="vp-planning-work-quick-add"/)
  assert.match(globalCssSource, /\.vp-planning-work-card:hover \.vp-planning-work-quick-add/)
})

test('Plano diário só publica através da ação manual Publicar', () => {
  assert.equal((dailyPlanPageSource.match(/publishPlanningWorkspace\(/g) || []).length, 1)
  assert.match(dailyPlanPageSource, /async function handlePublishPlanning\(\)/)
})

test('modal de editar pessoa usa Cliente -> Obra e remove informação técnica', () => {
  assert.match(dailyPlanPageSource, /name="clientId"/)
  assert.match(dailyPlanPageSource, /filteredActiveWorks\.map/)
  assert.doesNotMatch(dailyPlanPageSource, /ID da afetação:/)
  assert.doesNotMatch(dailyPlanPageSource, /Preço automático pela hierarquia:/)
  assert.match(dailyPlanPageSource, /Editar pessoa/)
  assert.match(dailyPlanPageSource, /Resumo/)
})

test('Registo diário do admin mostra apenas obras com afetações na data selecionada', () => {
  assert.match(dailyHoursPageSource, /const adminAssignedWorks = useMemo\(\(\) =>/)
  assert.match(dailyHoursPageSource, /dailyEntries[\s\S]*entry => String\(entry\.workId \|\| ''\)\.trim\(\)/)
  assert.match(dailyHoursPageSource, /const visibleWorks = isChef \? activeWorks : adminAssignedWorks/)
  assert.match(dailyHoursPageSource, /visibleWorks\.map\(work => \(/)
  assert.match(dailyHoursPageSource, /Não existem obras atribuídas para a data selecionada\./)
})
test('People page aplica a split grid adaptativa e headers internos responsivos', () => {
  assert.match(peoplePageSource, /className=\{canManagePeople \? 'btx-people-main-grid' : ''\}/)
  assert.match(peoplePageSource, /className="btx-people-detail-header"/)
  assert.match(peoplePageSource, /className="btx-people-list-row-head"/)
  assert.match(globalCssSource, /\.btx-people-detail-actions\s*\{/)
  assert.match(globalCssSource, /\.btx-people-list-row-head\s*\{/)
})
