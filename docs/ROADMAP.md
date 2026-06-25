# Bentix Roadmap

## Estado Atual

| Area | Estado |
| --- | --- |
| Developer Console | 100% |
| MySQL Migration | 100% |
| REST Service Layer | 100% |
| Swagger / OpenAPI | 100% |
| Swagger UI | 100% |

## Pendente

- Documentacao mais ampla de operacao e runbooks
- Backup / Restore
- Hosting / Cloud
- Monitorizacao
- Testes finais
- Teste em obra
- Backend separado

## Leitura Atual

Existe agora uma base minima de documentacao tecnica, mas a documentacao global do produto e da operacao ainda nao esta fechada. Por isso, "Documentacao" continua pendente como frente maior.

Ja existe tambem uma base documentada para os quatro ambientes alvo (`DEV`, `TEST`, `ACCEPTANCE`, `PROD`) e para a promocao `DEV -> TEST -> ACCEPTANCE -> PROD`, mas ainda falta automatizar pipelines, secrets e verificacoes por ambiente.

## Proximos Passos Recomendados

1. Fechar Backup / Restore com procedimento testado de ponta a ponta.
2. Consolidar hosting, observabilidade, secrets e variaveis de ambiente para um deploy repetivel nos quatro ambientes.
3. Fazer testes finais em ambiente real e validar o comportamento em obra.
4. So depois iniciar a separacao do backend, reaproveitando a Service Layer e o OpenAPI ja estabilizados.

## Recomendacao

A proxima fase recomendada e **Backup / Restore** antes de separar o backend. O motivo e simples:

- protege a migracao para MySQL
- reduz risco operacional
- facilita rollback e recuperacao
- cria uma base mais segura para a separacao futura do backend
