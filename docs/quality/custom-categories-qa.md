# Prumo — Categorias personalizadas

## Alteração
Categorias padrão permanecem sempre disponíveis. Categorias adicionais são controladas por `customCategories?: string[]` nos snapshots locais e na sincronização.

- Criar categoria com nome único, de 2–40 caracteres (máximo de 30 adicionais).
- Renomear uma categoria customizada atualiza atomicamente os lançamentos, orçamentos, compras de cartões e recorrências associados.
- Remoção de categoria apenas quando não há referências financeiras associadas.
- A tabela Prisma `Category` existente armazena nomes personalizados nos dois tipos (receitas/despesas). Quando uma categoria deixa de ser usada, é arquivada em vez de apagada.
- Um cliente antigo que omita `customCategories` não arquiva automaticamente as categorias criadas por clientes atuais.
- Backups legados continuam válidos (propriedade opcional).

## Checklist de QA
1. Configurações: cadastrar categoria Educação e visualizar imediatamente em transações, cartões, recorrências, orçamento e filtro de categoria.
2. Rejeitar duplicatas com acentos/case distintos, nomes menores que dois caracteres e nomes iguais aos padrões.
3. Renomear categoria usada e verificar que histórico e valores dos relatórios, orçamento e faturas permanecem iguais.
4. Tentativa de remover categoria usada deve ser bloqueada com explicação clara.
5. Remover categoria sem referências e conferir que não aparece mais nas seleções.
6. Sincronizar em dois dispositivos, atualizar página e conferir catálogo persistido.
7. Exportar backup JSON, recarregar o app e restaurar; categorias antigas devem continuar compatíveis.
8. Inspecionar erros do navegador e testar telas de 320px, zoom 200%, teclado e modo escuro.
9. Repetir com dados fictícios após login em ambiente com Better Auth configurado.

## Publicação
- Esta PR não inclui migrações, credenciais nem mutações diretas no banco de produção.
- Exigir `npm test`, `npm run typecheck` e `next build` verdes.
- Integrar PR manualmente após QA.
