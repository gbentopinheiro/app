# Bentix Database

## Fonte Principal

O alvo atual da Bentix e MySQL com Prisma.

- `BENTIX_DATA_SOURCE=mysql`
- `DATABASE_URL=mysql://...`
- adapter MariaDB/MySQL em `lib/prisma-adapter.js`
- cliente Prisma em `lib/prisma.js`

## Tabelas Principais

Seguem as tabelas centrais definidas em `schema.prisma`:

- acesso e seguranca: `AccessProfile`, `Permission`, `AccessProfilePermission`, `User`, `LoginEvent`, `LoginAttempt`, `AuditTrailEvent`, `FeatureFlag`
- organizacao: `Company`, `Client`, `Person`
- operacao: `Work`, `WorkWorkingDay`, `WorkRoleHourlyCost`, `WorkPersonHourlyCost`, `WorkPlan`, `WorkAssignment`, `DailyWorkNote`
- suporte: `Material`, `PersonDocumentReminder`, `CalendarEvent`, `CalendarNotificationState`, `DeveloperOverrideEvent`

## Validacao

Comandos relevantes:

- `npm run db:import:mysql`
- `npm run db:baseline:mysql`
- `npm run db:validate:mysql`

### `npm run db:validate:mysql`

Este comando compara as contagens atuais em MySQL com a baseline guardada em:

- `data/exports/mysql-validation-baseline.json`

Hoje a validacao e baseada em contagens por entidade, nao em diff linha-a-linha.

## Baseline

A baseline de validacao:

- pode ser criada automaticamente se nao existir
- pode ser atualizada explicitamente com `npm run db:baseline:mysql`
- serve como referencia para validar importacoes e estado esperado da base

## Importacao JSON -> MySQL

O processo de migracao usa:

- `npm run db:import:mysql`
- snapshot em `data/exports/mysql-migration-snapshot.json`

Esse snapshot consolida os dados legacy e depois repovoa as tabelas MySQL alvo.

## Entidades Migradas

As entidades operacionais principais ja tem caminho MySQL-backed:

- companies
- clients
- people
- works
- work plans
- work assignments
- daily work notes
- users
- access identities
- access profiles
- permissions
- developer override events
- materials
- person document reminders
- calendar events
- calendar notification states
- feature flags
- login events
- login attempts
- audit trail

## Entidades Legacy ou Hibridas

Ainda existem pontos legacy/hibridos no repositorio:

- `admins` com fallback para `data/admins.json`
- `developers` com fallback para `data/developers.json`
- ferramentas tecnicas como `data-management` ainda leem ficheiros por desenho atual
- `process` continua compatibilidade legacy baseada em workbook

Isto significa que a base operacional principal esta em MySQL, mas o repositorio ainda contem superfices de compatibilidade.

## Politica de Fallback JSON

Regra pratica:

- modo `mysql`: preferir sempre helpers MySQL-backed
- modo `json`: modulos legacy continuam suportados
- compatibilidade / admin / export: alguns fluxos ainda podem tocar ficheiros por desenho atual

O objetivo para futuro backend separado deve ser reduzir progressivamente as dependencias de ficheiro fora do que for assumidamente legacy.
