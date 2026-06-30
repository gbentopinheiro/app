import assert from 'node:assert/strict'
import { constants, createCipheriv, publicEncrypt, randomBytes } from 'node:crypto'
import { beforeEach, test } from 'node:test'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { hashPassword } from '../lib/passwords.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..')
const dataDir = join(repoRoot, 'data')

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
const { createClientData } = await import('../lib/clients.js')
const { canApproveHours, createSessionToken, getDefaultPathForRole, readSessionToken } = await import('../lib/auth.js')
const { getAllClients } = await import('../lib/clients.js')
const { decryptProtectedPayload, getLoginTransportPublicKey } = await import('../lib/login-transport.js')
const { verifyPassword } = await import('../lib/passwords.js')
const { normalizePersonPricingInput } = await import('../lib/person-pricing.js')
const { getEntityRoleLabel, getRoleDisplayLabel } = await import('../lib/roles.js')
const { buildOperationalWorkStatuses } = await import('../lib/work-operation-status.js')
const { getNextWorkNumber } = await import('../lib/work-numbering.js')
const { deleteClientService } = await import('../server/services/clients-service.js')
const { createPersonService, updatePersonService } = await import('../server/services/people-service.js')
const { deleteWorkService } = await import('../server/services/works-service.js')
const {
  createWorkAssignment,
  getAllWorkAssignments,
  submitWorkAssignment,
  updateWorkAssignment,
} = await import('../lib/work-assignments.js')
const { getAllWorkPlans, getWorkPlanByDate } = await import('../lib/work-plans.js')
const { createWorkAssignmentService } = await import('../server/services/work-assignments-service.js')
const { createWorkPlanService } = await import('../server/services/work-plans-service.js')
const { getAllWorks } = await import('../lib/works.js')
const { createWorkData } = await import('../lib/works.js')

const PLANNING_CUTOFF_BYPASS_ENV_KEYS = [
  'PLANNING_CUTOFF_BYPASS_CLIENT_IDS',
  'PLANNING_CUTOFF_BYPASS_UNTIL',
  'PLANNING_CUTOFF_BYPASS_WORK_PLAN_CREATE_UNTIL',
]
const ADMIN_SESSION = {
  role: 'admin',
  accountType: 'admin',
  accessProfile: 'admin',
}
const LOCKED_DAILY_PLAN_DATE = '2000-01-01'
const FUTURE_BYPASS_UNTIL = '2999-12-31T23:59:59+00:00'
const EXPIRED_BYPASS_UNTIL = '2000-01-01T00:00:00+00:00'

beforeEach(() => {
  seedFixtureData()
})

async function withPlanningCutoffBypassEnv(overrides, callback) {
  const snapshot = Object.fromEntries(
    PLANNING_CUTOFF_BYPASS_ENV_KEYS.map(key => [key, process.env[key]]),
  )

  try {
    PLANNING_CUTOFF_BYPASS_ENV_KEYS.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(overrides, key)) {
        const value = overrides[key]

        if (value === undefined) {
          delete process.env[key]
          return
        }

        process.env[key] = String(value)
        return
      }

      delete process.env[key]
    })

    return await callback()
  } finally {
    PLANNING_CUTOFF_BYPASS_ENV_KEYS.forEach(key => {
      if (snapshot[key] === undefined) {
        delete process.env[key]
        return
      }

      process.env[key] = snapshot[key]
    })
  }
}

async function createWorkForClient(clientName, workName) {
  const client = await createClientData({
    companyId: 1,
    name: clientName,
  })

  const work = await createWorkData({
    companyId: 1,
    name: workName,
    clientId: client.id,
    location: '',
    status: 'planned',
    defaultHourlyCost: 12,
  })

  return { client, work }
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

test('cliente normal continua bloqueado mesmo com bypass ativo para outro cliente', async () => {
  const { client: bypassClient } = await createWorkForClient('Cliente bypass', 'Obra bypass')

  await withPlanningCutoffBypassEnv(
    {
      PLANNING_CUTOFF_BYPASS_CLIENT_IDS: String(bypassClient.id),
      PLANNING_CUTOFF_BYPASS_UNTIL: FUTURE_BYPASS_UNTIL,
    },
    async () => {
      await assert.rejects(
        createWorkAssignmentService(ADMIN_SESSION, {
          workId: 1,
          personId: 3,
          date: LOCKED_DAILY_PLAN_DATE,
          hours: 8,
        }),
        error => {
          assert.equal(error?.status, 403)
          assert.match(String(error?.message || ''), /Depois das 08:00/)
          return true
        },
      )
    },
  )
})

test('cliente na lista passa antes do prazo configurado', async () => {
  const { client, work } = await createWorkForClient('Cliente liberado', 'Obra liberada')

  await withPlanningCutoffBypassEnv(
    {
      PLANNING_CUTOFF_BYPASS_CLIENT_IDS: String(client.id),
      PLANNING_CUTOFF_BYPASS_UNTIL: FUTURE_BYPASS_UNTIL,
    },
    async () => {
      const assignment = await createWorkAssignmentService(ADMIN_SESSION, {
        workId: work.id,
        personId: 3,
        date: LOCKED_DAILY_PLAN_DATE,
        hours: 8,
      })

      assert.equal(assignment.workId, work.id)
      assert.equal(assignment.personId, 3)
    },
  )
})

test('cliente na lista volta a bloquear depois do prazo', async () => {
  const { client, work } = await createWorkForClient('Cliente expirado', 'Obra expirada')

  await withPlanningCutoffBypassEnv(
    {
      PLANNING_CUTOFF_BYPASS_CLIENT_IDS: String(client.id),
      PLANNING_CUTOFF_BYPASS_UNTIL: EXPIRED_BYPASS_UNTIL,
    },
    async () => {
      await assert.rejects(
        createWorkAssignmentService(ADMIN_SESSION, {
          workId: work.id,
          personId: 3,
          date: LOCKED_DAILY_PLAN_DATE,
          hours: 8,
        }),
        error => {
          assert.equal(error?.status, 403)
          assert.match(String(error?.message || ''), /Depois das 08:00/)
          return true
        },
      )
    },
  )
})

test('variavel vazia mantem comportamento atual', async () => {
  const { work } = await createWorkForClient('Cliente sem lista', 'Obra sem lista')

  await withPlanningCutoffBypassEnv(
    {
      PLANNING_CUTOFF_BYPASS_CLIENT_IDS: '',
      PLANNING_CUTOFF_BYPASS_UNTIL: FUTURE_BYPASS_UNTIL,
    },
    async () => {
      await assert.rejects(
        createWorkAssignmentService(ADMIN_SESSION, {
          workId: work.id,
          personId: 3,
          date: LOCKED_DAILY_PLAN_DATE,
          hours: 8,
        }),
        error => {
          assert.equal(error?.status, 403)
          assert.match(String(error?.message || ''), /Depois das 08:00/)
          return true
        },
      )
    },
  )
})

test('criar novo plano diario continua bloqueado por defeito depois das 08:00', async () => {
  await withPlanningCutoffBypassEnv({}, async () => {
    await assert.rejects(
      createWorkPlanService(ADMIN_SESSION, {
        date: LOCKED_DAILY_PLAN_DATE,
      }),
      error => {
        assert.equal(error?.status, 403)
        assert.match(String(error?.message || ''), /Depois das 08:00/)
        return true
      },
    )
  })
})

test('criar novo plano diario passa antes do prazo configurado', async () => {
  await withPlanningCutoffBypassEnv(
    {
      PLANNING_CUTOFF_BYPASS_WORK_PLAN_CREATE_UNTIL: FUTURE_BYPASS_UNTIL,
    },
    async () => {
      const workPlan = await createWorkPlanService(ADMIN_SESSION, {
        date: LOCKED_DAILY_PLAN_DATE,
      })

      assert.equal(workPlan.date, LOCKED_DAILY_PLAN_DATE)
      assert.equal(workPlan.companyId, 1)
      assert.equal(getWorkPlanByDate(LOCKED_DAILY_PLAN_DATE, 1)?.id, workPlan.id)
    },
  )
})

test('criar novo plano diario volta a bloquear depois do prazo', async () => {
  await withPlanningCutoffBypassEnv(
    {
      PLANNING_CUTOFF_BYPASS_WORK_PLAN_CREATE_UNTIL: EXPIRED_BYPASS_UNTIL,
    },
    async () => {
      await assert.rejects(
        createWorkPlanService(ADMIN_SESSION, {
          date: LOCKED_DAILY_PLAN_DATE,
        }),
        error => {
          assert.equal(error?.status, 403)
          assert.match(String(error?.message || ''), /Depois das 08:00/)
          return true
        },
      )
    },
  )
})

test('variavel vazia para criar plano diario mantem o bloqueio atual', async () => {
  await withPlanningCutoffBypassEnv(
    {
      PLANNING_CUTOFF_BYPASS_WORK_PLAN_CREATE_UNTIL: '',
    },
    async () => {
      await assert.rejects(
        createWorkPlanService(ADMIN_SESSION, {
          date: LOCKED_DAILY_PLAN_DATE,
        }),
        error => {
          assert.equal(error?.status, 403)
          assert.match(String(error?.message || ''), /Depois das 08:00/)
          return true
        },
      )
    },
  )
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
