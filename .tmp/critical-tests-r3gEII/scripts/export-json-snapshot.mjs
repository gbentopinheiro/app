import { buildMysqlMigrationSnapshot, writeMysqlMigrationSnapshot } from './mysql-migration-utils.mjs'

const snapshot = await buildMysqlMigrationSnapshot()
const snapshotPath = await writeMysqlMigrationSnapshot(snapshot)

console.log(`Snapshot JSON -> MySQL criado em ${snapshotPath}`)
console.log(JSON.stringify(snapshot.targetCounts, null, 2))
