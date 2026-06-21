import { Prisma, PrismaClient } from '@prisma/client'
import { createPrismaAdapter } from './prisma-adapter.js'

const globalForPrisma = globalThis
const prismaModelDelegateNames = Object.values(Prisma?.ModelName || {}).map(modelName => (
  `${String(modelName).charAt(0).toLowerCase()}${String(modelName).slice(1)}`
))

function hasDatabaseUrl() {
  return Boolean(String(process.env.DATABASE_URL || '').trim())
}

function createUnavailablePrismaClient() {
  return new Proxy(
    {},
    {
      get() {
        throw new Error('DATABASE_URL nao esta definida.')
      },
    },
  )
}

function createPrismaClient() {
  if (!hasDatabaseUrl()) {
    return createUnavailablePrismaClient()
  }

  return new PrismaClient({
    adapter: createPrismaAdapter(),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

function isCompatiblePrismaClient(client) {
  if (!client || typeof client !== 'object') {
    return false
  }

  return prismaModelDelegateNames.every(delegateName => delegateName in client)
}

function resolvePrismaClient() {
  if (!hasDatabaseUrl()) {
    return createUnavailablePrismaClient()
  }

  const cachedPrisma = globalForPrisma.prisma

  if (isCompatiblePrismaClient(cachedPrisma)) {
    return cachedPrisma
  }

  if (cachedPrisma && typeof cachedPrisma.$disconnect === 'function') {
    cachedPrisma.$disconnect().catch(() => {})
  }

  const nextPrisma = createPrismaClient()

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = nextPrisma
  }

  return nextPrisma
}

function readPrismaProperty(propertyKey) {
  const client = resolvePrismaClient()
  const value = Reflect.get(client, propertyKey, client)

  if (typeof value === 'function') {
    return value.bind(client)
  }

  return value
}

export const prisma = new Proxy(
  {},
  {
    get(_target, propertyKey) {
      return readPrismaProperty(propertyKey)
    },
    has(_target, propertyKey) {
      const client = resolvePrismaClient()
      return propertyKey in client
    },
    ownKeys() {
      return Reflect.ownKeys(resolvePrismaClient())
    },
    getOwnPropertyDescriptor(_target, propertyKey) {
      const client = resolvePrismaClient()
      const descriptor = Reflect.getOwnPropertyDescriptor(client, propertyKey)

      if (!descriptor) {
        return undefined
      }

      return {
        ...descriptor,
        configurable: true,
      }
    },
  },
)

if (process.env.NODE_ENV !== 'production' && hasDatabaseUrl()) {
  globalForPrisma.prisma = resolvePrismaClient()
}
