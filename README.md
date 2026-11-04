# prumo.

O seu dinheiro, no eixo. Aplicativo financeiro pessoal instalável, versão 0.1.

## Executar

Node.js 22.9 ou superior. `npm ci`, `npm run dev`. Para produção: `npm run build` e `npm start`. Deploy na Vercel com preset Next.js, sem variáveis de ambiente nesta versão.

## Entregue

- Interface responsiva baseada no Figma oficial, Inter, tokens claro/escuro e logotipo original exportado.
- Contas com saldo inicial; receitas/despesas pagas ou pendentes; edição, exclusão e desfazer.
- Filtro mensal, busca, separação pessoal/trabalho, orçamento por categoria, metas, relatório e gráfico semestral.
- Valores inteiros em centavos. Receitas pendentes não entram no saldo. Reservas são saldos já existentes, não novas movimentações.
- PWA com manifest, ícones e service worker para uso offline após a primeira visita e carregamento dos recursos.
- Persistência local, exportação/restauração JSON com validação.

## Limites importantes

Esta versão é local, sem login, PostgreSQL ou sincronização. Não existe API financeira pública. Dados não são criptografados no navegador; use dispositivo e perfil privados e faça backups. Contas aceitam saldo inicial não negativo nesta versão. Transferências, cartões, parcelas, recorrências, importação CSV/OFX e contas conjuntas ainda não foram implementados.

O filtro de espaço aplica-se aos lançamentos; contas e metas são compartilhadas. Saldo em contas representa o saldo atual acumulado; o seletor de mês filtra as métricas de fluxo, não um balanço histórico. Livre = saldo atual − despesas pendentes do mês escolhido − reservas. Não inclui obrigações fora desse mês.

## Arquitetura e integração futura

Next.js App Router + React + TypeScript + Tailwind 4 + Radix Dialog + Lucide. Página de entrada no servidor; interações locais no cliente. Regras financeiras puras em `src/lib/finance.ts`; contrato serializável versionado (`FinanceData.version = 1`) separado da UI, facilitando migração para um repositório persistido.

Próxima etapa: Prisma/PostgreSQL, autenticação, autorização por proprietário, migração explícita do backup local, serviços e repositórios; depois API `/api/v1` com escopos, credenciais revogáveis por integração, idempotência e auditoria. NX Home deve consumir essa API autenticada, nunca acessar diretamente o banco ou o localStorage. Nenhum endpoint desprotegido foi antecipado.

## Verificação

`npm test`, `npm run typecheck`, `npm run build`.

## Referências

[Figma](https://www.figma.com/design/WuyVWVVH2lZtJeU5E3AXVX/Prumo?node-id=7-2) · [Documentação de marca](https://app.notion.com/p/40e67893a02981a8b210fa3d35d65c92)
