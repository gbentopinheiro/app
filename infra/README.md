# Bentix Infrastructure

## Visao Geral

Esta pasta prepara a infraestrutura versionada da Bentix para a promocao:

`DEV -> TEST -> ACCEPTANCE -> PROD`

Regras operacionais:

- `DEV` e local
- `TEST`, `ACCEPTANCE` e `PROD` vivem no VPS
- `PROD` nunca e usado para desenvolvimento
- secrets reais nunca entram no repositorio
- cada ambiente usa apenas o seu proprio `.env`
- secrets reais ficam no `.env` do VPS e no Bitwarden
- secrets reais nunca ficam no Dockerfile
- secrets reais nunca ficam no Git

Fluxo atual para `TEST`:

`DEV -> GitHub Actions -> SSH -> VPS TEST`

O GitHub Actions valida a app e, se tudo passar, liga por SSH ao VPS para reconstruir o ambiente `TEST` no proprio servidor.

Por agora, `GHCR` fica fora deste fluxo.

## Arquitetura por Ambiente

- `DEV`: desenvolvimento local com MySQL local e REST API local
- `TEST`: ambiente online tecnico para validar deploy e erros tecnicos
- `ACCEPTANCE`: ambiente online para validacao pelo utilizador antes de producao
- `PROD`: ambiente real com dados reais

Cada ambiente no VPS fica preparado com:

- app Next.js/Bentix
- base de dados MariaDB
- volumes persistentes por ambiente
- portas isoladas por ambiente
- rede Docker externa comum: `bentix-net`

## Estrutura

```text
infra/
  docker/
    app/
      Dockerfile
  environments/
    test/
      docker-compose.yml
      .env.example
    acceptance/
      docker-compose.yml
      .env.example
    production/
      docker-compose.yml
      .env.example
  nginx/
    test.conf.example
    acceptance.conf.example
    production.conf.example
  scripts/
    deploy.sh
    backup-db.sh
    restore-db.sh
  README.md
```

## Portas por Ambiente

- `TEST`: app `3100`, db `3307`
- `ACCEPTANCE`: app `3200`, db `3308`
- `PROD`: app `3300`, db `3309`

## Rede Docker

Criar uma vez no VPS:

```bash
docker network create bentix-net
```

## Deploy TEST via GitHub Actions

O workflow atual para `TEST`:

- corre em `push` para a branch `dev`
- executa `npm ci`
- executa `npm run test:critical`
- executa `npm run build`
- liga por SSH ao VPS
- atualiza o checkout em `/opt/bentix/app`
- recria o ambiente `infra/environments/test`

Secrets necessarios no GitHub:

- `TEST_SSH_HOST`
- `TEST_SSH_USER`
- `TEST_SSH_PRIVATE_KEY`
- `TEST_SSH_PORT`

Comandos executados no VPS pelo workflow:

```bash
cd /opt/bentix/app
git fetch origin
git reset --hard origin/dev
cd infra/environments/test
docker compose down
docker compose up -d --build
```

## Subir TEST Manualmente

```bash
cd infra/environments/test
cp .env.example .env
docker compose up -d --build
```

## Subir ACCEPTANCE

```bash
cd infra/environments/acceptance
cp .env.example .env
docker compose up -d --build
```

## Subir PROD

```bash
cd infra/environments/production
cp .env.example .env
docker compose up -d --build
```

## Variaveis Importantes

- `DATABASE_URL`
- `BENTIX_DATA_SOURCE`
- `NEXT_PUBLIC_API_BASE_URL`
- `NODE_ENV`
- `AUTH_SECRET`
- `LOGIN_PUBLIC_KEY_PEM`
- `LOGIN_PRIVATE_KEY_PEM`

Mapeamento operacional:

- `SESSION_SECRET` corresponde ao `AUTH_SECRET` usado hoje no codigo
- `PAYLOAD_KEY` corresponde ao par `LOGIN_PUBLIC_KEY_PEM` e `LOGIN_PRIVATE_KEY_PEM`

## Dockerfile

O Dockerfile:

- usa Node LTS
- instala dependencias com `npm ci`
- gera Prisma Client
- faz `next build`
- arranca com `npm start`
- nao copia `.env` para dentro da imagem
- depende de variaveis de ambiente em runtime

## Nginx

Os ficheiros em `infra/nginx/*.conf.example` sao exemplos de reverse proxy para cada ambiente.

Adapta antes de usar:

- `server_name`
- certificados TLS
- politicas de logs

## Scripts

Os scripts em `infra/scripts` sao placeholders seguros:

- validam argumentos
- mostram os comandos esperados
- nao executam acoes perigosas automaticamente

Exemplos:

```bash
./infra/scripts/deploy.sh test
./infra/scripts/backup-db.sh acceptance
./infra/scripts/restore-db.sh production /backups/bentix-production.sql
```

## Notas Finais

- esta infraestrutura ainda nao cria deploy automatico para `ACCEPTANCE` ou `PROD`
- o ambiente `TEST` usa build local no VPS atraves de SSH
- antes de usar em `PROD`, validar `TEST` e depois `ACCEPTANCE`
- manter backups separados por ambiente
