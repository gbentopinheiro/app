# Bentix Deployment

## Requisitos

- Node.js compativel com Next.js 16
- MySQL ou MariaDB acessivel
- `DATABASE_URL` valida
- `BENTIX_DATA_SOURCE=mysql`

Para a arquitetura atual, MySQL deve ser tratado como obrigatorio.

## Regra de Promocao

Fluxo recomendado:

`LOCAL -> DEV -> PROD`

Objetivo de cada ambiente:

- `LOCAL`: desenvolvimento em `localhost`
- `DEV`: validacao tecnica online em `dev.bentixapp.com` e `api-dev.bentixapp.com`
- `PROD`: operacao real em `bentixapp.com` e `api.bentixapp.com`

Nota importante:

- `NODE_ENV=test` continua reservado para execucao automatica de testes.

## Ambientes

| Ambiente | Uso | Base de dados | REST API | `NODE_ENV` |
| --- | --- | --- | --- | --- |
| LOCAL | Trabalho local | MySQL local, por exemplo `bentix_local` | Local, via `/api/...` | `development` |
| DEV | Validacao tecnica online | DB isolada, por exemplo `bentix_dev` | `https://api-dev.bentixapp.com` | `production` |
| PROD | Operacao real | DB isolada, por exemplo `bentix_prod` | `https://api.bentixapp.com` | `production` |

## Variaveis de Ambiente

Variaveis base:

- `DATABASE_URL`
- `BENTIX_DATA_SOURCE`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_API_BASE_URL`
- `NODE_ENV`
- `AUTH_SECRET`
- `LOGIN_PUBLIC_KEY_PEM`
- `LOGIN_PRIVATE_KEY_PEM`

Mapeamento operacional:

- `SESSION_SECRET` corresponde hoje a `AUTH_SECRET`
- `PAYLOAD_KEY` corresponde hoje ao par `LOGIN_PUBLIC_KEY_PEM` + `LOGIN_PRIVATE_KEY_PEM`

Matriz resumida:

| Ambiente | `DATABASE_URL` | `BENTIX_DATA_SOURCE` | `NEXT_PUBLIC_APP_ENV` | `NEXT_PUBLIC_API_BASE_URL` | `NODE_ENV` |
| --- | --- | --- | --- | --- | --- |
| LOCAL | MySQL local, por exemplo `bentix_local` | `mysql` | `local` | vazio | `development` |
| DEV | DB `bentix_dev` ou equivalente | `mysql` | `dev` | vazio ou override explicito | `production` |
| PROD | DB `bentix_prod` ou equivalente | `mysql` | `prod` | vazio ou override explicito | `production` |

Regras praticas:

- `NEXT_PUBLIC_APP_ENV` aceita apenas `local`, `dev` ou `prod`
- sem override, o frontend usa o perfil versionado em `config/app.<ambiente>.js`
- `NEXT_PUBLIC_API_BASE_URL`, quando definido, sobrepoe a URL do perfil
- o valor publico e lido em build time
- em `LOCAL`, deixar `NEXT_PUBLIC_API_BASE_URL=""` para manter requests relativas
- em `DEV`, o perfil publico aponta por defeito para `https://api-dev.bentixapp.com`
- em `PROD`, o perfil publico aponta por defeito para `https://api.bentixapp.com`

## Build e Start

Fluxo minimo:

```bash
npm install
npm run db:generate
npm run build
npm run start
```

Para uma base MySQL/MariaDB nova, preparar os dados antes do arranque funcional:

```bash
npm run db:setup:mysql
```

Se a base ja tiver dados e a reimportacao for intencional, repetir com confirmacao explicita:

```bash
npm run db:setup:mysql -- --confirm-existing-data
```

Validacoes recomendadas antes de promover:

```bash
npm run db:setup:mysql
npm run db:validate:mysql
npm run test:critical
npm run build
```

## Swagger / OpenAPI

Em deploy, a documentacao fica disponivel em:

- `/api/docs/openapi.json`
- `/developer/api-docs`

## Notas de Runtime

- a app continua a ser um monolito Next.js
- o acesso a MySQL passa por Prisma
- o frontend ja suporta uma REST API externa via `frontend/api/api-client.js`
- rotas legacy de ficheiro continuam no repositorio, por isso storage local nao deve ser tratado como fonte principal de producao

## Notas Para Futura Separacao do Backend

Pontos a reaproveitar:

- `server/controllers`
- `server/services`
- `lib/db`
- contratos OpenAPI e HTTP ja estabilizados
- `frontend/api/api-client.js`
- `frontend/controllers/*`

O passo natural continua a ser extrair `app/api/**` para um backend dedicado sem rebentar contratos.

## Notas Para Cloud / Hosting

- usar MySQL gerido ou instancia persistente
- guardar variaveis de ambiente num secret manager
- manter secrets diferentes por ambiente
- automatizar a promocao `LOCAL -> DEV -> PROD`
- validar politicas de ficheiros locais, porque alguns fluxos legacy ainda assumem filesystem
- manter logs, backups e health checks fora da app antes de separar o backend
