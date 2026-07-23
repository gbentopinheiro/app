import { PrismaClient } from '@prisma/client'
import { createPrismaAdapter } from '../lib/prisma-adapter.js'
import {
  ACCESS_PROFILE_DEFINITIONS,
  resolveAccessProfileForUser,
} from '../lib/access-profiles.js'
import {
  ACCESS_PROFILE_PERMISSION_KEYS,
  PERMISSION_DEFINITIONS,
} from '../lib/permissions.js'

const prisma = new PrismaClient({
  adapter: createPrismaAdapter(),
})

async function ensureAccessProfiles() {
  for (const definition of ACCESS_PROFILE_DEFINITIONS) {
    await prisma.accessProfile.upsert({
      where: { key: definition.key },
      update: {
        name: definition.name,
        description: definition.description,
      },
      create: {
        key: definition.key,
        name: definition.name,
        description: definition.description,
      },
    })
  }

  return prisma.accessProfile.findMany({
    orderBy: { key: 'asc' },
  })
}

async function ensurePermissions() {
  for (const definition of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { key: definition.key },
      update: {
        name: definition.name,
        description: definition.description,
        category: definition.category,
      },
      create: {
        key: definition.key,
        name: definition.name,
        description: definition.description,
        category: definition.category,
      },
    })
  }

  return prisma.permission.findMany({
    orderBy: { key: 'asc' },
  })
}

async function syncAccessProfilePermissions(accessProfiles, permissions) {
  const accessProfileIdByKey = new Map(accessProfiles.map(profile => [profile.key, profile.id]))
  const permissionIdByKey = new Map(permissions.map(permission => [permission.key, permission.id]))
  const rows = []

  Object.entries(ACCESS_PROFILE_PERMISSION_KEYS).forEach(([accessProfileKey, permissionKeys]) => {
    const accessProfileId = accessProfileIdByKey.get(accessProfileKey)

    if (!accessProfileId) {
      return
    }

    permissionKeys.forEach(permissionKey => {
      const permissionId = permissionIdByKey.get(permissionKey)

      if (!permissionId) {
        return
      }

      rows.push({
        accessProfileId,
        permissionId,
      })
    })
  })

  await prisma.accessProfilePermission.deleteMany()

  if (rows.length > 0) {
    await prisma.accessProfilePermission.createMany({
      data: rows,
      skipDuplicates: true,
    })
  }

  return rows.length
}

async function syncUsersAccessProfiles(accessProfiles) {
  const accessProfileIdByKey = new Map(accessProfiles.map(profile => [profile.key, profile.id]))
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      accountType: true,
      accessProfileId: true,
    },
    orderBy: [{ username: 'asc' }, { id: 'asc' }],
  })

  let updatedUsers = 0

  for (const user of users) {
    const accessProfileKey = resolveAccessProfileForUser({
      role: user.role,
      accountType: user.accountType,
    })
    const accessProfileId = accessProfileIdByKey.get(accessProfileKey)

    if (!accessProfileId || Number(user.accessProfileId) === Number(accessProfileId)) {
      continue
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        accessProfileId,
      },
    })

    updatedUsers += 1
  }

  return {
    totalUsers: users.length,
    updatedUsers,
  }
}

async function main() {
  await prisma.$connect()

  const accessProfiles = await ensureAccessProfiles()
  const permissions = await ensurePermissions()
  const accessProfilePermissionsCount = await syncAccessProfilePermissions(accessProfiles, permissions)
  const userSyncSummary = await syncUsersAccessProfiles(accessProfiles)

  console.log('Infraestrutura de access profiles e permissions atualizada.')
  console.log(JSON.stringify({
    accessProfiles: accessProfiles.length,
    permissions: permissions.length,
    accessProfilePermissions: accessProfilePermissionsCount,
    users: userSyncSummary,
  }, null, 2))
}

main()
  .catch(error => {
    console.error('Erro ao semear access profiles e permissions:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
