import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { hashPasswordIfNeeded } from '../lib/passwords.js'

const files = ['admins.json', 'developers.json', 'access-identities.json', 'chefs.json', 'chefsID.json']

for (const file of files) {
  const filePath = join(process.cwd(), 'data', file)

  try {
    const records = JSON.parse(readFileSync(filePath, 'utf8'))
    const migratedRecords = Array.isArray(records)
      ? records.map(record => ({
          ...record,
          password: record.password
            ? hashPasswordIfNeeded(record.password, { enforcePolicy: false })
            : record.password,
        }))
      : records

    writeFileSync(filePath, JSON.stringify(migratedRecords, null, 2), 'utf8')
    console.log(`Credenciais protegidas: ${file}`)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}
