# Bentix Architecture

## Visao Geral

A Bentix corre hoje como uma aplicacao Next.js monolitica, com frontend, API HTTP e acesso a dados no mesmo repositorio.

O desenho atual ja prepara a separacao futura do backend:

- `app/**`: frontend Next.js, paginas server/client e componentes React
- `app/api/**/route.js`: wrappers HTTP finos
- `server/controllers/**`: adaptacao HTTP, sessao, permissao, parsing e resposta
- `server/services/**`: regras reutilizaveis da API
- `lib/**`: dominio existente, compatibilidade legacy e helpers transversais
- `lib/db/**`: acesso a MySQL por entidade
- `lib/prisma.js` + `lib/prisma-adapter.js`: bootstrap do Prisma
- `schema.prisma`: contrato atual da base de dados
- `server/docs/openapi-phase1.js`: especificacao OpenAPI 3.1 servida pela app

## Camadas

### Frontend Next.js

O frontend vive em `app/**` e usa fetch para chamar `/api/*` na mesma origem. A pagina de documentacao interna fica em `/developer/api-docs` e consome `/api/docs/openapi.json`.

### `app/api` como wrappers

As rotas em `app/api/**/route.js` devem manter-se finas:

- recebem o request Next.js
- chamam um controller
- convertem o resultado em `Response` ou `NextResponse`

O objetivo e que a logica HTTP nao fique espalhada nas rotas.

### `server/controllers`

Os controllers tratam da fronteira HTTP:

- sessao e cookies
- permissao
- leitura de body, query e params
- mapeamento de erros para `status codes`
- headers especiais como PDF, CSV ou downloads JSON

### `server/services`

Os services concentram a logica reutilizavel da API:

- validacoes
- workflow
- coordinacao entre helpers de dominio
- composicao de payloads de resposta

Sempre que possivel, o controller deve apenas orquestrar o service.

### `lib/db`

`lib/db/**` e a camada de acesso a MySQL por entidade. Aqui vivem os helpers que falam diretamente com Prisma e devolvem payloads prontos para a aplicacao.

### Prisma e MySQL

O Prisma e usado como cliente de base de dados. A ligacao e criada em `lib/prisma.js` com adapter MariaDB/MySQL e usa `DATABASE_URL`.

Em deploy alvo, `BENTIX_DATA_SOURCE=mysql` deve estar ativo e MySQL passa a ser a fonte principal da operacao.

### Swagger / OpenAPI

A documentacao OpenAPI 3.1 e mantida em `server/docs/openapi-phase1.js` e servida por:

- `/api/docs/openapi.json`
- `/developer/api-docs`

## Fluxo HTTP Atual

Exemplo tipico:

```text
Browser / UI
   |
   v
app/api/.../route.js
   |
   v
server/controllers/...
   |
   v
server/services/...
   |
   v
lib/...  ->  lib/db/...
              |
              v
           Prisma
              |
              v
            MySQL
```

## Diagrama ASCII

```text
+--------------------+
| Next.js Frontend   |
| app/**             |
+---------+----------+
          |
          v
+--------------------+
| HTTP Wrappers      |
| app/api/**         |
+---------+----------+
          |
          v
+--------------------+
| Controllers        |
| server/controllers |
+---------+----------+
          |
          v
+--------------------+
| Services           |
| server/services    |
+---------+----------+
          |
          v
+--------------------+        +------------------+
| Domain / Data      | -----> | lib/db/**        |
| lib/**             |        | Prisma-backed    |
+---------+----------+        +--------+---------+
          |                            |
          | legacy / fallback          v
          +----------------------->  MySQL
```

## JSON Fallback

O repositorio ainda contem modulos legacy baseados em ficheiro. A regra atual e:

- em `BENTIX_DATA_SOURCE=mysql`, a superficie operacional principal deve ler/escrever via helpers MySQL-backed
- os fallbacks JSON ficam apenas para modo legacy, compatibilidade ou alguns fluxos tecnicos ainda em transicao
- existem tambem alguns fluxos explicitamente legacy/admin que continuam a tocar ficheiros por desenho atual, sem alterar o contrato externo

Exemplos de compatibilidade ainda presentes:

- contas tecnicas `admins` e `developers` com fallback legado
- ferramentas tecnicas de export/statistics baseadas em ficheiros
- endpoint legacy `/api/process` e respetivo workbook

## Nota Para a Separacao do Backend

A separacao futura deve reaproveitar primeiro:

- `server/services`
- `server/controllers`
- `lib/db`

O alvo natural e trocar `app/api/**` por um servidor dedicado, mantendo os mesmos contratos HTTP.
