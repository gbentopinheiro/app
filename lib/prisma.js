import { PrismaClient } from '@prisma/client'
import { createPrismaAdapter } from './prisma-adapter.js'

const globalForPrisma = globalThis

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

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production' && hasDatabaseUrl()) {
  globalForPrisma.prisma = prisma
}
