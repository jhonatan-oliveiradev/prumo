# Prumo — Critérios de liberação do workspace financeiro

Este roteiro é para validar releases da aplicação, não da landing. Use dados de teste, não informações financeiras reais.

## Portões automáticos

- `npm run build` gera Prisma, executa `npm run check` e só então compila Next.js.
- `npm run check` executa todos os testes em `src/lib/*.test.ts` e TypeScript (`tsc --noEmit`).
- A Vercel só deve promover alterações com build **READY**, associado ao SHA da PR.
- As GitHub Actions existentes são complementares; esta etapa não depende da cota de Actions.
- Nenhum teste pode escrever em banco Production; builds não executam migrations automaticamente.

## Teste manual obrigatório (ambiente Preview com dados fictícios)

| Fluxo | Cenários mínimos | Aceite |
| --- | --- | --- |
| Primeiro uso | abrir /app sem dados, criar conta com saldo 0, registrar despesa, descartar tutorial, F5 | fluxo permanece coerente e nunca cadastra valores fictícios |
| URLs / histórico | abrir /app/transacoes direto, clicar menu, Voltar/Avançar, recarregar /app/cartoes | tela correta é selecionada sem perder dados |
| Registro | gasto R$ 1.234,56, receita, parcela, conta sem saldo, validação de erro | valores íntegros e feedback sem fechar formulário em falha |
| Filtros | espaço Pessoal/Trabalho, categoria, tipo, status, busca; limpar filtros | lançamentos no escopo esperado; saldos não misturam subconjunto |
| Relatórios | selecionar categoria de despesas | navega para transações pagas da categoria exata e mês selecionado |
| Vencimentos | despesa ontem, hoje, +7 dias, +8 dias, fatura vencida, pagamento | banner e saldo livre refletem somente obrigações não pagas |
| Exclusões | cancelar/confirmar exclusão, desfazer, tentar após erro de armazenamento | nenhuma exclusão silenciosa e recuperação disponível |
| Importar CSV | cabeçalho comum, colunas desconhecidas, valores negativos, linhas inválidas, duplicadas | prévia preservada; importação explícita, idempotente |
| Sincronização | online/offline, duas abas/dispositivos, mudanças paralelas, conflito | versões não sobrescritas sem decisão; detalhes resumidos e backup disponível |
| Segurança | GET/PUT dados sem sessão, cross-origin PUT, sessão expirada | rejeição segura; não expor workspace em HTML/caches públicos |
| Acessibilidade | Tab, Shift+Tab, Enter, Escape; 200% zoom, 320px, redução de movimento | controles alcançáveis, estados compreensíveis, sem scroll lateral bloqueante |

## Matriz de dispositivos
- Chrome/Edge desktop, 1280–1920px e zoom 200%.
- Vivaldi desktop, inclusive navegação com teclado.
- Safari iOS (PWA instalada quando possível).
- Chrome Android, largura 320–430px.
- Testar modo claro e escuro, sem conexão e com conexão instável.

## Critérios de bloqueio

Não aprovar merge se:
- surgir perda ou alteração de valores financeiros sem confirmação;
- a UI afirmar que salvou quando o dispositivo não persistiu;
- uma rota privada expuser dados sem sessão ou em metadados;
- transações, cartões e reservas apresentarem somas incompatíveis;
- ocorrer regressão em sincronização com múltiplos dispositivos;
- build / testes / typecheck não estiverem verdes.

## Sequência de entregas

1. PR #31 — Integridade financeira e conflitos.
2. PR #32 — Rotas, navegação e onboarding.
3. PR #33 — Experiência diária, BRL e vencimentos.
4. PR #34 — Busca por categoria, drill-down e CSV.
5. PR #35 — Gates automáticos e esta matriz de QA.

Estas PRs estão empilhadas e precisam ser integradas **em ordem**. Se houver ajustes após merge, conferir o diff relativo de cada PR antes de continuar.

## Ainda fora deste pacote

- Transferências entre contas com trilha contábil completa e reconciliação por competência.
- Categorias e subcategorias customizadas, com migração e compatibilidade de backups.
- Importação com mapeamento manual de colunas e prévia de deduplicação entre bancos.
- Recuperação de senha / gestão de sessões e autenticação social real.
- Testes E2E automatizados, monitoramento de erro/latência e release notes no aplicativo.

Esses pontos exigem desenho de dados, políticas de migração ou infraestrutura específica; não devem ser liberados apenas com alterações de interface.
