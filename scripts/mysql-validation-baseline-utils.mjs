import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectRoot = join(__dirname, '..')
const dataDir = join(projectRoot, 'data')
const exportsDir = join(dataDir, 'exports')

export const validationBaselineFilePath = join(exportsDir, 'mysql-validation-baseline.json')

export async function getMysqlCountSnapshot(prisma) {
  return {
    accessProfiles: await prisma.accessProfile.count(),
    permissions: await prisma.permission.count(),
    accessProfilePermissions: await prisma.accessProfilePermission.count(),
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
    developerOverrideEvents: await prisma.developerOverrideEvent.count(),
    loginEvents: await prisma.loginEvent.count(),
    loginAttempts: await prisma.loginAttempt.count(),
    auditTrailEvents: await prisma.auditTrailEvent.count(),
    materials: await prisma.material.count(),
    personDocumentReminders: await prisma.personDocumentReminder.count(),
    calendarEvents: await prisma.calendarEvent.count(),
    calendarNotificationStates: await prisma.calendarNotificationState.count(),
    featureFlags: await prisma.featureFlag.count(),
  }
}

export function buildMysqlValidationBaselineFromCounts(targetCounts) {
  return {
    generatedAt: new Date().toISOString(),
    source: 'mysql-runtime-baseline',
    targetCounts,
  }
}

export async function writeMysqlValidationBaseline(baseline) {
  await mkdir(exportsDir, { recursive: true })
  await writeFile(validationBaselineFilePath, JSON.stringify(baseline, null, 2), 'utf8')
  return validationBaselineFilePath
}

export async function readMysqlValidationBaseline() {
  const rawValue = await readFile(validationBaselineFilePath, 'utf8')
  return JSON.parse(rawValue)
}
