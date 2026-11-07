# Prumo — Regras automáticas de categorização (PR dependente de #42)

## Função
O usuário controla até 50 regras por workspace, cada uma contendo termo de descrição, tipo (receita/despesa), espaço (pessoal/trabalho/ambos), categoria e status ativo. As regras são executadas por ordem: **a primeira regra ativa correspondente vence**.

As descrições são normalizadas para comparação insensível a maiúsculas e acentos, mas não há classificação por IA nem envio a terceiros.

### Aplicação
- Novas importações de CSV de contas e cartões recebem categorias sugeridas na prévia.
- Antes de confirmar, os valores e categorias sugeridas ficam visíveis. Se as regras mudarem após o preview, o commit é recusado e exige revisão.
- Ao criar manualmente um novo lançamento, a descrição, tipo e espaço podem sugerir uma categoria. A seleção manual tem prioridade e não é sobrescrita.
- Lançamentos existentes e lotes já importados **não são alterados automaticamente**.
- Renomear categoria personalizável atualiza também a categoria referenciada pelas regras.
- Excluir categoria com regras ativas ou pausadas é impedido até mover/remover as regras.
- Os controles de ativação, pausa, reordenação e exclusão de regras estão em Configurações.

## Migração obrigatória
O código requer a tabela `CategoryRule` em Prisma. A migration aditiva está em:
`prisma/migrations/20261106235500_category_rules/migration.sql`

**NÃO MERGEAR A PR DE REGRAS ANTES DE APLICAR A MIGRAÇÃO EM PRODUCTION.**

Sequência:
1. Aprovar, fazer merge e testar PR #42.
2. Criar snapshot de produção no Neon e confirmar as migrações anteriores.
3. Aplicar somente a nova migração com o comando seguro `prisma migrate deploy` no ambiente autenticado e conferir seu registro em `_prisma_migrations`. Não usar `migrate dev` em produção.
4. Confirmar que a tabela, índices, FK de workspace e checks de prioridade/escopo existem.
5. Retargetar PR de regras para `main`, rever diff, integrar e testar com usuário autenticado.
6. Validar online, offline, duas abas e dois dispositivos.
7. Se a migração falhar, não realizar merge; restaurar/diagnosticar via snapshot e logs, sem modificar dados financeiros.

O SQL foi validado em branch temporária Neon e **descartado sem aplicar em produção**.

## QA
- Criar regra: descrição contém 'Netflix', despesa, ambos os espaços, categoria Assinaturas.
- Registrar novo lançamento Netflix e conferir sugestão; escolher outra categoria manualmente e continuar digitando, comprovando que o sistema não substitui a escolha.
- CSV de banco com despesas Netflix e receita Salário: prévia e classificação por tipo, sem alterar histórico.
- CSV de cartão: conferir categoria com base no espaço do cartão.
- Regras específicas Pessoal/Trabalho: conferir que uma não se aplica ao outro.
- Duas regras contendo o mesmo texto: alterar prioridade e confirmar que a primeira vence.
- Desativar regra: próximas sugestões deixam de aparecer sem alterar registros antigos.
- Importar lote usando regra, desativar regra e confirmar que o lote importado continua na categoria original.
- Alterar regras durante prévia aberta: a confirmação deve exigir nova revisão e não salvar parcialmente.
- Renomear categoria personalizada usada por regra e verificar ajuste no destino da regra; excluir categoria em uso deve ser bloqueado.
- Testar em 320px, com teclado, zoom 200%, tema claro/escuro e offline.
- Sem logs de descrições bancárias ou dados financeiros em serviços de analytics.

## Build
`npm run build` valida Prisma, testes unitários e typecheck. A PR não deve ser publicada antes de todos os gates estarem verdes e do QA com contas fictícias.
