# MySQL Local Setup

## 1. Criar a base local

Se o comando `mysql` nao estiver no `PATH`, abre o MySQL Workbench e corre:

```sql
SOURCE scripts/create-mysql-database.sql;
```

Em alternativa, copia o conteudo de [scripts/create-mysql-database.sql](</c:/Users/gbent/OneDrive/Ambiente de Trabalho/VILAPLANO/app/scripts/create-mysql-database.sql:1>) e executa-o manualmente.

## 2. Criar a configuracao local

Cria um ficheiro `.env` a partir de [`.env.example`](</c:/Users/gbent/OneDrive/Ambiente de Trabalho/VILAPLANO/app/.env.example:1>) e ajusta a password:

```env
BENTIX_DATA_SOURCE="json"
DATABASE_URL="mysql://bentix_app:CHANGE_ME@localhost:3306/bentix_app"
```

Quando quiseres ativar uma area da app para usar a camada DB, muda:

```env
BENTIX_DATA_SOURCE="mysql"
```

## 3. Gerar o cliente Prisma

```powershell
npm run db:generate
```

## 4. Exportar o snapshot dos JSON atuais

```powershell
npm run db:export:json
```

Isto cria:

- [data/exports/mysql-migration-snapshot.json](</c:/Users/gbent/OneDrive/Ambiente de Trabalho/VILAPLANO/app/data/exports/mysql-migration-snapshot.json:1>)

## 5. Preparar a base MySQL de forma segura

```powershell
npm run db:setup:mysql
```

Isto executa por ordem:

- `npx prisma db push`
- `npm run db:import:mysql`
- `npm run db:validate:mysql`

Se a base ja tiver dados aplicacionais e a reimportacao for intencional:

```powershell
npm run db:setup:mysql -- --confirm-existing-data
```

## 6. Estado atual do projeto

Nesta fase:

- a app continua a usar JSON em runtime
- o schema MySQL fica preparado
- a migracao de dados fica automatizada
- a troca da fonte de dados pode ser feita faseadamente depois

## 7. Mapeamento principal

- `companies.json` -> `companies`
- `clients.json` -> `clients`
- `people.json` -> `people`
- `works.json` -> `works`, `work_working_days`, `work_role_hourly_costs`, `work_person_hourly_costs`
- `work-plans.json` -> `work_plans`
- `work-assignments.json` -> `work_assignments`
- `daily-work-notes.json` -> `daily_work_notes`
- `access-identities.json`, `admins.json`, `developers.json` -> `users`
- `login-events.json` -> `login_events`
