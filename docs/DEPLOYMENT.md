# Bentix Deployment

## Requisitos

- Node.js compativel com Next.js 16
- MySQL ou MariaDB acessivel
- `DATABASE_URL` valida
- `BENTIX_DATA_SOURCE=mysql`

Para o alvo atual, MySQL deve ser tratado como obrigatorio.

## Regra de Promocao

Fluxo recomendado de promocao:

`DEV -> TEST -> ACCEPTANCE -> PROD`

Objetivo de cada passo:

- `DEV`: desenvolvimento local com MySQL local e REST API local
- `TEST`: validacao tecnica online de deploys, erros tecnicos e regressao basica
- `ACCEPTANCE`: validacao funcional pelo utilizador antes da publicacao real
- `PROD`: ambiente real com dados reais, nunca usado para desenvolvimento

## Ambientes

| Ambiente | Uso | Base de dados | REST API | `NODE_ENV` |
| --- | --- | --- | --- | --- |
| DEV | Trabalho local | MySQL local, por exemplo `bentix_dev` | Local, via wrappers `/api/...` | `development` |
| TEST | Validacao tecnica online | DB isolada, por exemplo `bentix_test` | Externa, por exemplo `https://api-test.bentix.pt` | `production` |
| ACCEPTANCE | Validacao pelo utilizador | DB isolada, por exemplo `bentix_acceptance` | Externa, por exemplo `https://api-acceptance.bentix.pt` | `production` |
| PROD | Operacao real | DB isolada, por exemplo `bentix_prod` | Externa, por exemplo `https://api.bentix.pt` | `production` |

Nota importante:

- `NODE_ENV=test` deve ficar reservado para execucao automatica de testes e nao para um ambiente online permanente chamado TEST.

## Variaveis de Ambiente

Variaveis base por ambiente:

- `DATABASE_URL`
- `BENTIX_DATA_SOURCE`
- `NEXT_PUBLIC_API_BASE_URL`
- `NODE_ENV`
- `SESSION_SECRET`
- `PAYLOAD_KEY`
- `AUTH_SECRET`
- `LOGIN_PUBLIC_KEY_PEM`
- `LOGIN_PRIVATE_KEY_PEM`

Mapeamento operacional pedido pela equipa:

- `SESSION_SECRET` corresponde hoje a `AUTH_SECRET`
- `PAYLOAD_KEY` corresponde hoje ao par `LOGIN_PUBLIC_KEY_PEM` + `LOGIN_PRIVATE_KEY_PEM`

Matriz resumida por ambiente:

| Ambiente | `DATABASE_URL` | `BENTIX_DATA_SOURCE` | `NEXT_PUBLIC_API_BASE_URL` | `SESSION_SECRET` | `PAYLOAD_KEY` | `NODE_ENV` |
| --- | --- | --- | --- | --- | --- | --- |
| DEV | MySQL local, por exemplo `bentix_dev` | `mysql` | vazio | obrigatoria | obrigatoria | `development` |
| TEST | DB `bentix_test` ou equivalente | `mysql` | `https://api-test.bentix.pt` | obrigatoria | obrigatoria | `production` |
| ACCEPTANCE | DB `bentix_acceptance` ou equivalente | `mysql` | `https://api-acceptance.bentix.pt` | obrigatoria | obrigatoria | `production` |
| PROD | DB `bentix_prod` ou equivalente | `mysql` | `https://api.bentix.pt` | obrigatoria | obrigatoria | `production` |

Regras praticas:

- em `DEV`, deixar `NEXT_PUBLIC_API_BASE_URL=""` para manter frontend e REST API locais
- em `TEST`, `ACCEPTANCE` e `PROD`, apontar `NEXT_PUBLIC_API_BASE_URL` para a base externa da API quando frontend e backend estiverem separados
- `BENTIX_DATA_SOURCE` deve ficar em `mysql` nos quatro ambientes alvo
- em `production`, `LOGIN_PUBLIC_KEY_PEM` e `LOGIN_PRIVATE_KEY_PEM` devem estar definidas

## Build e Start

Fluxo minimo:

```bash
npm install
npm run db:generate
npm run build
npm run start
```

Validacoes recomendadas antes de promover:

```bash
npm run db:validate:mysql
npm run test:critical
npm run build
```

## Swagger / OpenAPI

Em deploy, a documentacao fica disponivel em:

- `/api/docs/openapi.json`
- `/developer/api-docs`

## Notas de Runtime

- a app e um monolito Next.js; frontend e API correm juntos
- o acesso a MySQL passa por Prisma
- a Frontend Controller Layer ja suporta `NEXT_PUBLIC_API_BASE_URL` para apontar para uma REST API externa sem rebentar contratos
- rotas legacy de ficheiro continuam a existir no repositorio, pelo que storage local nao deve ser tratado como fonte principal de producao

## Notas Para Futura Separacao do Backend

Pontos a reaproveitar:

- `server/controllers`
- `server/services`
- `lib/db`
- contratos OpenAPI e contratos HTTP ja estabilizados
- `frontend/api/api-client.js`
- `frontend/controllers/*`

O passo natural e extrair a camada HTTP de `app/api/**` para um backend dedicado, sem rebentar os contratos atuais.

## Notas Para Cloud / Hosting

- usar MySQL gerido ou instancia persistente
- guardar variaveis de ambiente num secret manager
- manter secrets diferentes por ambiente
- automatizar a promocao `DEV -> TEST -> ACCEPTANCE -> PROD`
- validar politicas de ficheiros locais, porque alguns fluxos legacy ainda assumem filesystem
- manter logs, backups e health checks fora da app antes de separar o backend
