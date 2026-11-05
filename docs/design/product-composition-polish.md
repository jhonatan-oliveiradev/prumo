# Composição de produto e fidelidade à referência

Base: main após merge da PR #17. Referências: capturas anexadas pelo usuário em 05/11/2026 e gravação Griffin https://cap.so/s/hr5f38xhep6yjah.

## Diferenças corrigidas

- O header tinha 64px de altura, mas herdava também 30px de `margin-bottom` do `header` global. A faixa efetiva ocupava 94px. Agora mede 56px sem margem inferior (54px no mobile), com navegação compacta e offsets em 60px.
- Os modos visuais “Imagem/Malha” expunham uma decisão de implementação. Voltaram a “Panorama/Detalhes”; um único estado controla simultaneamente o conteúdo do card e o fundo. A opção interna redundante foi removida.
- A fotografia se estendia até a borda direita da janela. A seção inteira agora compartilha um limite central de 1280px; em uma janela de 2048px, a coluna visual mede aproximadamente 640px, com margem externa preservada.
- Os painéis ocupam a mesma célula de grid para reservar o maior exemplo sem saltos. O painel secundário fica no fluxo, evitando cobrir linhas do principal em larguras intermediárias e pequenas.
- A timeline ganhou uma introdução centralizada, navegação vertical inferior e maior área para a ilustração. Durante a rolagem, abre as juntas próximas da camada em foco e mantém as demais reunidas, em vez de apenas separar todas por igual. Chamadas usam os nomes das camadas; controles de exploração permanecem disponíveis em um disclosure secundário. A geometria e suas projeções continuam vindo do mesmo modelo Teardown; nenhum frame ou asset foi regenerado.
- Encerramento e rodapé agora compartilham os limites centrais. O rodapé tem uma assinatura tipográfica ampla, índice de links e crédito clicável para https://enex.studio.

## Verificação

- 46 testes, typecheck, build e diff check aprovados.
- Teste de geometria percorre 251 poses da nova coreografia e verifica ordem das partes e anchors dentro do viewBox efetivo.
- Chromium local: largura limitada em 2048px; inspeção de header, fotografia, modos e rodapé em 1440, 1024, 768, 390 e 320px; sem overflow horizontal.
- Todos os quatro exemplos alternam card/fundo por teclado. Conferidos controles de reunião/separação, rolagem reversa, introdução e etapas, leitura sem JS e movimento reduzido.
- Em 1280×700 e 1280×768, as quatro histórias cabem acima do navegador de etapas. Títulos continuam legíveis após mudança de viewport. Console sem erros.

Limites: testes em Chromium com SwiftShader, sem Safari, aparelhos físicos ou GPU física. Não se presume validação de preview protegido da Vercel.
