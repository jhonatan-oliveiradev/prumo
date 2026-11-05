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

## Evolução: layout fluido e compromissos

O conteúdo ocupa a largura restante após a sidebar, sem teto de 1900px; no celular ocupa 100% da largura. Compromissos reúne pendências do mês escolhido e todas as pendências vencidas, respeitando o filtro pessoal/trabalho. Pago/Recebido altera o estado do lançamento existente, sem criar cópia, e permite desfazer. A data agendada é mantida: a versão atual ainda não separa competência e data efetiva de pagamento. Os dados locais existentes continuam compatíveis.

Verificação desta evolução: quatro testes financeiros, TypeScript e build. A conferência visual no navegador segue pendente por incompatibilidade do serviço de preview com Next.js.

## Contas e sincronização — v0.2

Better Auth com e-mail/senha (12 caracteres ou mais) e sessão HttpOnly. Prisma 6/PostgreSQL com o schema conceitual do Prumo adaptado: `AppUser`, `WorkspaceMember`, domínio financeiro normalizado, centavos em `BigInt`, e tabelas de autenticação separadas. `Workspace.revision` garante controle otimista de concorrência; o usuário e o workspace são determinados pela sessão, nunca pelo corpo da requisição.

`GET/PUT /api/v1/workspace` exige login. PUT exige origem exata, JSON válido de até 1 MB, IDs sem duplicação e referências de conta válidas. Todas as entidades de uma gravação são alteradas na mesma transação; a revisão e a auditoria avançam juntas. Ajustes de reservas geram movimentos de meta sem apagar seu histórico. IDs externos são preservados por `clientId`, isolados por workspace no banco.

O modo local continua usando a chave anterior. Depois de entrar, o cache é separado por usuário. A importação do modo local exige confirmação e preserva o original. Alterações são salvas primeiro no dispositivo e enviadas em seguida; tentativas pendentes são repetidas ao reconectar. Ao voltar à janela, o aplicativo atualiza dados se não houver alterações locais. Em conflito, nenhuma versão é sobrescrita automaticamente: exporte backup e escolha a versão da nuvem nas configurações. Para combinar duas versões, exporte-as e reconcilie manualmente nesta versão.

Configuração: copie `.env.example`, preencha `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ bytes aleatórios) e `BETTER_AUTH_URL` com a origem exata. Rode `npm ci`, `npm run db:migrate`, `npm run build`. Configure as mesmas variáveis na Vercel, com banco e segredo separados para Preview e Production. Migrations são uma etapa explícita, não executadas em todo build. O driver Neon usa WebSocket TLS para ambientes serverless. Endpoints de sessão e dados nunca são armazenados pelo service worker.

Limites desta etapa: recuperação/verificação de e-mail e login social ainda não disponíveis; a interface informa a ausência de recuperação de senha. Há um workspace pessoal por conta; compartilhamento e integrações NX Home não são expostos. O schema inclui transferências, recorrências, importações e idempotência para evolução futura, mas não há endpoints para esses recursos. Orçamentos atuais continuam sendo limites recorrentes por categoria (intervalo persistido 1970–9999), não orçamentos por competência. A API aceita um snapshot versionado e persiste entidades normalizadas; APIs de operações granulares virão depois. Offline após recarregar sem acesso ao servidor pode abrir o modo local; rascunhos de conta permanecem isolados e são recuperados ao entrar novamente.


## Parcelamento e projeção

Novas despesas podem ser divididas em até 60 parcelas mensais a partir do valor total informado. Centavos restantes são distribuídos nas primeiras parcelas, preservando o total exato. Vencimentos no fim do mês são limitados ao último dia disponível sem perder a referência original (31/jan → 28/fev → 31/mar). A situação escolhida aplica-se só à primeira parcela; as demais são pendentes.

Cada parcela pode ser editada e paga separadamente. No editor, é possível excluir esta e as próximas parcelas pendentes da compra, preservando parcelas pagas, com desfazer. A exclusão simples da linha continua afetando apenas aquela parcela.

Em Compromissos, a projeção parte do mês atual e considera os próximos seis meses, independentemente do filtro mensal do extrato. O cenário conservador usa saldo atual menos reservas e despesas pendentes, incluindo vencidos uma única vez no primeiro mês. Receitas pendentes só entram no cenário alternativo opt-in. Não são presumidos salários recorrentes, despesas não cadastradas ou rendimentos. Os valores em parcelas já integram A pagar.

A metadata de parcelamento é opcional em `FinanceData` v1, mantendo compatibilidade de backups. A migration `20261105003000_installments` adiciona três colunas nullable e uma validação de coerência em Transaction. Nenhuma conta ou lançamento existente é alterado. Compartilhamento, cartões e geração automática de recorrências continuam fora desta entrega.

## Recorrências e conselheiro Gemini

Recorrências semanais, mensais e anuais geram lançamentos pendentes até seis meses à frente ao salvar uma regra e ao abrir o aplicativo. IDs determinísticos e checkpoint persistido impedem duplicidades e recriação de ocorrências excluídas. Pausar remove somente ocorrências futuras pendentes; editar afeta as próximas; pagamentos confirmados e vencidos são preservados. Retomar não cobra retroativamente o período pausado. A geração depende de abrir o app; não há cron nem pagamento automático.

O Conselheiro é somente leitura e usa Gemini via REST no servidor. Configure `GEMINI_API_KEY` como variável criptografada na Vercel (Production; Preview somente se quiser testar nesse ambiente) e faça novo deploy. `GEMINI_MODEL` é opcional, padrão `gemini-2.5-flash`; disponibilidade/cota dependem da conta Google. Nunca use prefixo NEXT_PUBLIC para a chave nem a inclua no código. Sem chave, a interface informa a configuração pendente.

Cada análise exige sessão autenticada, sincronização concluída e consentimento explícito. O backend lê o workspace autorizado e prepara indicadores gerais sem identificação, nomes, descrições, extratos, categorias sensíveis ou valores exatos. O usuário escolhe uma de quatro perguntas predefinidas; não há envio de texto livre. O backend verifica se os indicadores são os mesmos apresentados na interface e aplica o filtro pessoal/trabalho. Respostas não modificam dados nem executam ações. Há limite atômico de 10 solicitações por conta/dia (fuso São Paulo), limite de saída e timeout; tentativas que falham também contam. Não existe fallback para outro modelo/provedor pago. As cotas do Google também se aplicam.

A interface informa que entradas/respostas do plano gratuito podem ser usadas pelo Google para melhorar produtos e permite inspecionar os indicadores enviados. A análise é aproximada e não substitui decisões pessoais. Nenhuma solicitação real ao Google foi executada durante a implementação; testes do transporte usam respostas simuladas.

Referências: https://ai.google.dev/gemini-api/terms e https://ai.google.dev/api/generate-content.
