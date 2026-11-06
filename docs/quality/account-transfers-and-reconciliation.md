# Prumo — Transferências e conciliação financeira

## Entregas

### Transferências (#38)
- Criar uma transferência entre contas diferentes (origem, destino, data, valor, observação).
- Guardar um único registro zero-sum; **nunca** criar receita ou despesa artificial.
- Atualizar saldos das contas, preservando o saldo patrimonial total.
- Histórico com exclusão confirmada e desfazer pelo fluxo atual de alterações.
- Sincronizar em uma transação atômica com controle de revisão do workspace.
- Reutilizar a tabela `Transfer` já existente; **não necessita de migração adicional**.

### Conciliação (#39)
- Informar o saldo observado no extrato; o sistema calcula a diferença entre saldo atual do Prumo e valor informado.
- Exigir data e justificativa; registrar saldo anterior, saldo conferido e delta assinado em centavos.
- Corrigir o saldo apenas da conta selecionada sem distorcer receitas, despesas, orçamentos ou histórico de transferências.
- Manter trilha imutável; ajustes posteriores corrigem diferenças novas. Não há edição ou exclusão de registros de conciliação.
- Respeitar snapshots legados sem `reconciliations` e impedir que clientes antigos substituam ou apaguem históricos novos.
- UI acessível, responsiva e com revisão/confirmação do efeito financeiro.

## Migração necessária para #39

A migração `prisma/migrations/20261106170000_account_balance_reconciliation/migration.sql` é **aditiva** e cria apenas a tabela `AccountBalanceReconciliation`, índices, chaves estrangeiras e proteção de soma dos saldos.

**Não fazer merge da #39 antes de aplicar a migração ao banco de Production.** O endpoint que carrega o workspace consulta essa tabela e responderá com erro enquanto ela não existir.

Procedimento seguro, após revisão:
1. Mergear e validar a PR #38 (transferências, sem migration).
2. Fazer backup/snapshot do banco de Production no Neon.
3. Com a branch da PR #39 no ambiente de execução autorizado, usar `prisma migrate deploy` com `DATABASE_URL` apontando para o banco correto. **Não** executar `prisma migrate dev` em Production.
4. Conferir que a migração consta como aplicada em `_prisma_migrations` e que o schema foi gerado adequadamente.
5. Somente então mergear a PR #39 e validar em `https://www.prumo-finance.online/app/contas`.
6. Não alterar bancos de Preview com credenciais de Production, nem salvar conexão/senhas no repositório.

## QA manual obrigatório

- Cadastrar duas contas em modo local, movimentar R$ 250,00 entre elas e conferir soma zero.
- Verificar que entrada/saída mensal, orçamento e categorias não foram alterados.
- Tentar transferir para mesma conta, valor zero, data inválida e data futura.
- Excluir transferência, cancelar confirmação e desfazer; validar saldos e dados exportados.
- Fazer login com dados fictícios e sincronizar uma transferência em dois dispositivos; observar conflitos de revisão.
- Conciliar um saldo de R$ 1.000,00 para R$ 950,00 e conferir delta de -R$ 50,00, histórico e efeito somente na conta.
- Conciliar saldo negativo e saldo zero quando aplicável, sem registros de receitas/despesas.
- Recusar uma conciliação sem diferença, sem justificativa ou com data futura.
- Realizar duas conciliações em sequência e conferir trilha histórica.
- Tentar restaurar backup antigo após conciliar. A operação não deve apagar o histórico de ajustes, e deve mostrar erro claro se não for compatível.
- Verificar UI em 320px, tema claro/escuro, teclado, F5 e modo offline.
- Validar que builds usam `npm test`, `tsc --noEmit` e `next build`.

## O que ainda não é conciliação bancária automática

Não existe integração Open Finance, OFX nativo, correspondência automática entre linhas do banco e lançamentos, nem controle de saldos contábeis por competência histórica. O fluxo proposto é **conciliação manual de saldo observado**, com correção auditável. A importação CSV continua sendo etapa anterior recomendada para evitar ajustes indevidos.
