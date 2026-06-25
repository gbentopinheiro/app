# Bentix API

## Fontes de Documentacao

- OpenAPI JSON: `/api/docs/openapi.json`
- Swagger UI interna: `/developer/api-docs`
- Especificacao: OpenAPI `3.1.0`

O ficheiro OpenAPI serve como fonte principal. Este documento apenas resume a superficie da API.

## Autenticacao

A autenticacao atual e baseada em sessao por cookie:

- login via `/api/auth/login`
- logout via `/api/auth/logout`
- cookie de sessao HTTP-only
- leitura da sessao atual via `/api/auth/session`

Alguns pedidos sensiveis usam payload protegido com chave publica obtida em `/api/auth/payload-key`.

## Grupos Principais

### Auth

- sessao atual
- login
- logout
- chave publica para payload protegido
- alteracao da propria password

### People

- CRUD de pessoas
- documentos por pessoa
- historico de atividade por pessoa

### Clients

- CRUD de clientes

### Works

- CRUD de obras

### Work Plans

- listar, criar, editar, apagar
- clone do dia anterior
- regras de bloqueio e workflow atual

### Work Assignments

- listar, detalhe, criar, editar, apagar
- submit
- approve
- defaults e filtros por obra/data

### Materials

- CRUD de materiais

### Calendar

- listar e gerir eventos de calendario

### Developer

- utilizadores tecnicos
- access profiles
- permissions
- feature flags
- overrides tecnicos
- audit trail
- dashboard export
- data integrity
- data management
- system diagnostics
- test data

## Endpoints Legacy ou Deprecated

Legacy / compatibilidade:

- `/api/chefs`
- `/api/chefs/{id}`
- `/api/process`

Deprecated:

- `POST /api/developer/users/{id}/reset-password`

Notas:

- `/api/process` continua endpoint legacy e em `BENTIX_DATA_SOURCE=mysql` o `POST` devolve `409`
- o endpoint deprecated acima devolve `410` e encaminha para `/api/developer/users/reset-password`

## Swagger UI

A pagina interna `/developer/api-docs`:

- esta protegida na area developer
- consome `/api/docs/openapi.json`
- nao altera a API nem a UI operacional

## Contrato

O contrato externo deve continuar a ser preservado:

- mesmos paths
- mesmos `status codes`
- mesmas mensagens relevantes
- mesmos formatos de export, incluindo PDF, CSV e JSON onde aplicavel
