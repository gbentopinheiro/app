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
- configuracao da lingua dos resumos enviados ao cliente

### Works

- CRUD de obras
- exportacao rapida por obra na pagina individual
- exportacao combinada por cliente em um unico `.xlsx`

#### Exportacao de resumo de obras

Permissao obrigatoria:

- `works.annual_summary.export`

Entradas disponiveis:

- pagina individual da obra: export rapido, mantendo o fluxo atual baseado apenas no mes selecionado
- pagina dedicada do cliente: selecao de 1 ou mais obras do proprio cliente, meses inicial/final e nome do resumo

Endpoint:

- `POST /api/clients/{id}/summary-export`

Payload:

```json
{
  "workIds": [10, 11],
  "startMonth": "2026-01",
  "endMonth": "2026-03",
  "summaryName": "Trabalhos Janeiro-Marco"
}
```

Resposta:

- um unico ficheiro `.xlsx`
- nunca um `.zip`

Regras:

- todos os `workIds` devem pertencer ao cliente do path
- ids duplicados sao normalizados no servidor
- `startMonth` e `endMonth` sao obrigatorios e usam o formato `YYYY-MM`
- o servidor converte o periodo para o primeiro dia do mes inicial e o ultimo dia do mes final
- `summaryName` e obrigatorio e controla o titulo interno e o nome final do ficheiro
- quando varias obras sao selecionadas, o resumo combina horas por `pessoa + data`
- o workbook final nao expoe a obra de origem de cada hora

Validacoes server-side:

- utilizador autenticado
- permissao de exportacao
- cliente existente
- obras existentes
- obras pertencem ao cliente do path
- obras acessiveis para a sessao autenticada
- periodo valido
- nome do resumo valido

Limites:

- maximo 100 obras por pedido
- periodo maximo de 366 dias

Idioma do resumo:

- cada cliente tem `summaryLanguage`
- valores suportados: `pt`, `fr`, `en`, `es`
- fallback para clientes antigos ou valor invalido: `pt`
- esta definicao afeta apenas os resumos enviados ao cliente

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
