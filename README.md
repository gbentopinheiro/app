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

## Troubleshooting

- Certifique-se de que o arquivo Excel está no formato .xlsx.
- Verifique se as colunas estão corretas (C=2, AJ=35, AK=36, 0-indexado).
- Se o cabeçalho não estiver na primeira linha, ajuste o código na API route.
- Para a API de pessoas, use JSON válido no body das requests.