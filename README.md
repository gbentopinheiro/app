# Excel Processor com Next.js

Esta aplicação Next.js permite fazer upload de um arquivo Excel (.xlsx) e extrair os nomes da coluna C, verificando se há preços na coluna AJ (preço à hora) ou AK (preço mensal).

Também inclui uma API REST para gestão de pessoas.

## Inicialização de Dados

Quando o servidor inicia, o sistema verifica automaticamente se existe um arquivo `data/pessoas.xlsx`. Se encontrado, carrega os dados das pessoas a partir da **terceira folha (Página3)**, coluna C:

- **Página 3 (Página3)**: Dados das pessoas
- **Coluna C**: Nome da pessoa (a partir da linha 7, após os cabeçalhos)
- Os dados são carregados automaticamente no startup do servidor
- Cada nome válido cria uma entrada na lista de pessoas com preço padrão 0

## Formato do Arquivo Excel

O arquivo Excel deve ter o seguinte formato:
- **Página 3 (Página3)**: Contém os dados
- **Coluna C**: Nomes das pessoas
- **Linhas 1-6**: Cabeçalhos/reservadas (ignoradas)
- **Linha 7**: Primeiro nome
- **Linhas 8+**: Outros nomes

## Como executar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Abra o navegador em `http://localhost:3000`

4. Faça upload de um arquivo .xlsx através da interface web.

## Funcionalidades

- Interface web para upload de arquivos Excel.
- Processamento automático dos dados.
- Exibição dos resultados com nomes encontrados.
- API REST para gestão de pessoas.
- Carregamento automático de dados do Excel no startup.

## Como executar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Abra o navegador em `http://localhost:3000`

4. Faça upload de um arquivo .xlsx através da interface web.

## Funcionalidades

- Interface web para upload de arquivos Excel.
- Processamento automático dos dados.
- Exibição dos resultados com nomes e preços encontrados.
- API REST para gestão de pessoas.

## Configuracao da URL da API

A base URL publica da REST API ficou centralizada em ficheiros de configuracao por ambiente:

- `config/app.local.js`
- `config/app.dev.js`
- `config/app.prod.js`
- `config/app.public.js`

Regras de resolucao:

- `NEXT_PUBLIC_APP_ENV` aceita apenas `local`, `dev` ou `prod`
- `NEXT_PUBLIC_API_BASE_URL`, quando definido, sobrepoe a URL do perfil
- sem override, o frontend usa a URL definida em `config/app.<ambiente>.js`
- a configuracao publica e lida em build time no bundle do Next.js

Exemplos rapidos:

- local: `NEXT_PUBLIC_APP_ENV=local`
- DEV com frontend em `https://dev.bentixapp.com` e API em `https://api-dev.bentixapp.com`: `NEXT_PUBLIC_APP_ENV=dev`
- PROD com API separada: `NEXT_PUBLIC_APP_ENV=prod`

## Bootstrap MySQL / MariaDB

Para preparar uma base nova com o fluxo suportado:

```bash
npm run db:setup:mysql
```

O comando executa por ordem:

- `npx prisma db push`
- `npm run db:import:mysql`
- `npm run db:validate:mysql`

Se ja existirem dados aplicacionais, o processo para antes da importacao destrutiva e exige confirmacao explicita:

```bash
npm run db:setup:mysql -- --confirm-existing-data
```

Em alternativa, podes usar `BENTIX_CONFIRM_MYSQL_IMPORT=1` apenas nessa execucao.

## API REST para Pessoas

### Endpoints

- `GET /api/people` - Lista todas as pessoas
- `POST /api/people` - Cria uma nova pessoa
  - Body: `{ "name": "Nome Sobrenome", "price": 100.50, "isMonthlyBilling": false }`
- `GET /api/people/[id]` - Obtém uma pessoa por ID
- `PUT /api/people/[id]` - Atualiza uma pessoa
  - Body: `{ "name": "Novo Nome", "price": 200.00, "isMonthlyBilling": true }`
- `DELETE /api/people/[id]` - Remove uma pessoa

### Estrutura da Pessoa

```json
{
  "id": 1,
  "name": "João Silva",
  "price": 50.00,
  "isMonthlyBilling": false
}
```

- `isMonthlyBilling`: Boolean (true = faturação mensal, false = faturação por hora)

## Estrutura do projeto

- `app/page.js`: Página principal com formulário de upload.
- `app/api/process/route.js`: API route que processa o arquivo Excel.
- `app/api/people/route.js`: API para listar e criar pessoas.
- `app/api/people/[id]/route.js`: API para operações em pessoa específica.
- `lib/people.js`: Lógica de dados para pessoas.
- `app/layout.js`: Layout da aplicação.

## Dependências

- Next.js
- React
- xlsx

## Seguranca de autenticacao

O login e a troca de palavra-passe enviam um envelope cifrado: o browser cifra o conteudo com AES-GCM e cifra a chave temporaria com a chave publica RSA-OAEP do servidor. Isto protege o corpo dos pedidos de credenciais; HTTPS continua a ser obrigatorio para proteger todo o canal.

Em desenvolvimento, a aplicacao gera um par RSA temporario em memoria. Em producao, configure obrigatoriamente:

- `AUTH_SECRET`: segredo longo e aleatorio para assinar sessoes.
- `LOGIN_PUBLIC_KEY_PEM`: chave publica RSA em formato PEM/SPKI.
- `LOGIN_PRIVATE_KEY_PEM`: chave privada RSA em formato PEM/PKCS8.

Exemplo para gerar chaves fora do repositorio:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out login-private.pem
openssl rsa -pubout -in login-private.pem -out login-public.pem
```

O servidor redireciona pedidos HTTP para HTTPS em producao e envia `Strict-Transport-Security`. Nunca coloque a chave privada no codigo frontend nem no controlo de versoes.

As passwords novas e as passwords alteradas sao guardadas apenas como hash `bcrypt` com custo 12. A validacao de login usa `bcrypt.compare`; hashes `scrypt` anteriores continuam validos durante a migracao e sao substituidos por `bcrypt` no proximo login correto.

A regra aplicada para novas passwords e:

- minimo de 12 caracteres;
- pelo menos uma letra maiuscula;
- pelo menos um numero;
- pelo menos um caracter especial;
- maximo de 72 bytes, para respeitar o limite seguro do `bcrypt`.

O login limita tentativas falhadas por nome de utilizador:

- maximo de 5 falhas num periodo de 15 minutos;
- ao atingir o limite, o login fica bloqueado durante 15 minutos;
- a resposta de bloqueio indica o tempo restante, sem revelar se a conta existe;
- um login correto limpa as falhas anteriores.

## Troubleshooting

- Certifique-se de que o arquivo Excel está no formato .xlsx.
- Verifique se as colunas estão corretas (C=2, AJ=35, AK=36, 0-indexado).
- Se o cabeçalho não estiver na primeira linha, ajuste o código na API route.
- Para a API de pessoas, use JSON válido no body das requests.
