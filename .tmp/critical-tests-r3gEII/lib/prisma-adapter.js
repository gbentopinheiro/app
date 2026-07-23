import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

export function createPrismaAdapter() {
  const databaseUrl = String(process.env.DATABASE_URL || '').trim()

  if (!databaseUrl) {
    throw new Error('DATABASE_URL nao esta definida.')
  }

  return new PrismaMariaDb(databaseUrl)
}
