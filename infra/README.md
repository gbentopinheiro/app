# Bentix Infrastructure

## Visao Geral

A infraestrutura versionada fica reduzida a tres ambientes:

`LOCAL -> DEV -> PROD`

Regras operacionais:

- `LOCAL` corre em `localhost`
- `DEV` e `PROD` vivem no VPS
- `PROD` nunca e usado para desenvolvimento
- cada ambiente usa apenas o seu proprio `.env`
- secrets reais ficam fora do repositorio
- o Dockerfile nao guarda secrets

## Arquitetura Final

- `LOCAL`: frontend, API e base de dados locais
- `DEV`: frontend em `https://dev.bentixapp.com` e API em `https://api-dev.bentixapp.com`
- `PROD`: frontend em `https://bentixapp.com` e API em `https://api.bentixapp.com`

No ambiente `DEV`, a infraestrutura continua separada em tres servicos:

- `web`: frontend Next.js
- `api`: a mesma app Next.js a expor `app/api/*`
- `db`: MariaDB do ambiente

Existe ainda um servico transitório:

- `migrate`: arranca antes da app e executa `prisma db push`

Isto preserva o comportamento atual sem mexer na logica da aplicacao. O `web` continua a receber variaveis de runtime porque ainda existem server components e SSR a ler sessao e dados diretamente.

No ambiente `PROD`, o `docker-compose` continua com um servico `app` e um servico `db`, mais um servico transitório `migrate` para sincronizar schema antes do arranque. O reverse proxy pode expor `bentixapp.com` e `api.bentixapp.com` para o mesmo upstream `app` sem mudar a logica interna.

## Estrutura

```text
infra/
  docker/
    app/
      Dockerfile
  environments/
    dev/
      docker-compose.yml
      .env.example
    production/
      docker-compose.yml
      .env.example
  nginx/
    dev.conf.example
    production.conf.example
  scripts/
    deploy.sh
    backup-db.sh
    restore-db.sh
  README.md
```

## Portas

- `DEV`: web `3100`, api `3101`, db `3307`
- `PROD`: app `3300`, db `3309`

## Rede Docker

Criar uma vez no VPS:

```bash
docker network create bentix-net
```

## Deploy DEV

Subida manual:

```bash
cd infra/environments/dev
cp .env.example .env
docker compose up -d --build
```

O `docker compose up -d --build` arranca primeiro o servico `migrate`, aplica `prisma db push` na base de dados do ambiente e so depois sobe `web` e `api`.

Para popular uma base DEV nova com os dados snapshot, usar no repositorio da app:

```bash
npm run db:setup:mysql
```

Dominios esperados:

- `dev.bentixapp.com -> web:3100`
- `api-dev.bentixapp.com -> api:3101`

## Deploy PROD

Subida manual:

```bash
cd infra/environments/production
cp .env.example .env
docker compose up -d --build
```

O `docker compose up -d --build` arranca primeiro o servico `migrate`, aplica `prisma db push` na base de dados do ambiente e so depois sobe `app`.

Para popular uma base PROD nova com os dados snapshot, usar no repositorio da app:

```bash
npm run db:setup:mysql
```

Dominios esperados:

- `bentixapp.com -> app:3300`
- `api.bentixapp.com -> app:3300`

## Variaveis Importantes

- `DATABASE_URL`
- `BENTIX_DATA_SOURCE`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_API_BASE_URL`
- `NODE_ENV`
- `AUTH_SECRET`
- `LOGIN_PUBLIC_KEY_PEM`
- `LOGIN_PRIVATE_KEY_PEM`

## Bootstrap Seguro da Base

O comando recomendado para preparar uma base MySQL/MariaDB nova e:

```bash
npm run db:setup:mysql
```

Fluxo:

1. sincroniza schema com `prisma db push`
2. importa o snapshot JSON para MySQL
3. valida as contagens finais

Se forem detetados dados aplicacionais existentes, a importacao fica bloqueada por defeito. Para repetir uma reimportacao intencional:

```bash
npm run db:setup:mysql -- --confirm-existing-data
```

Tambem e suportada a variavel `BENTIX_CONFIRM_MYSQL_IMPORT=1`, mas deve ser usada apenas de forma temporaria e explicita.

Mapeamento operacional:

- `SESSION_SECRET` corresponde ao `AUTH_SECRET` usado hoje no codigo
- `PAYLOAD_KEY` corresponde ao par `LOGIN_PUBLIC_KEY_PEM` e `LOGIN_PRIVATE_KEY_PEM`

## Configuracao Publica da API

Perfis versionados:

- `config/app.local.js`
- `config/app.dev.js`
- `config/app.prod.js`
- `config/app.public.js`

Regras:

- `NEXT_PUBLIC_APP_ENV` aceita apenas `local`, `dev` ou `prod`
- `NEXT_PUBLIC_API_BASE_URL` e um override opcional
- sem override, o frontend usa a URL definida em `config/app.<ambiente>.js`
- a configuracao publica e resolvida em build time

Valores por ambiente:

- `local` -> URL relativa `/api/...`
- `dev` -> `https://api-dev.bentixapp.com`
- `prod` -> `https://api.bentixapp.com`

## Excecoes temporarias ao cutoff do plano diario

Variaveis runtime disponiveis:

- `PLANNING_CUTOFF_BYPASS_CLIENT_IDS` e `PLANNING_CUTOFF_BYPASS_UNTIL`: permitem ignorar o cutoff das 08:00 apenas para obras de clientes especificos
- `PLANNING_CUTOFF_BYPASS_WORK_PLAN_CREATE_UNTIL`: permite `Criar novo` e `Copiar anterior` depois das 08:00 ate ao instante configurado
- quando a data/hora configurada expira ou a variavel fica vazia, o comportamento normal volta automaticamente

## Dockerfile

O Dockerfile:

- usa Node LTS
- instala dependencias com `npm ci`
- gera Prisma Client
- faz `next build`
- expõe um target `migrator` para correr `prisma db push`
- arranca com `npm start`
- define uma `DATABASE_URL` dummy para `build` e `prisma generate`
- aceita `NEXT_PUBLIC_APP_ENV` e `NEXT_PUBLIC_API_BASE_URL` como `build args`
- nao copia `.env` para dentro da imagem

## Nginx

Os ficheiros em `infra/nginx/*.conf.example` sao exemplos de reverse proxy.

- `infra/nginx/dev.conf.example` separa frontend e API por dominio
- `infra/nginx/production.conf.example` expoe `bentixapp.com` e `api.bentixapp.com`

Adapta antes de usar:

- `server_name`
- TLS
- logs

## Scripts

Os scripts em `infra/scripts` continuam a ser placeholders seguros:

- validam argumentos
- mostram os comandos esperados
- nao executam acoes perigosas automaticamente

Exemplos:

```bash
./infra/scripts/deploy.sh dev
./infra/scripts/backup-db.sh dev
./infra/scripts/restore-db.sh production /backups/bentix-production.sql
```

## Notas Finais

- a arquitetura final suportada e `LOCAL`, `DEV` e `PROD`
- manter backups separados por ambiente
