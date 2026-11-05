# Timeline viva — Prumo

A sequência anterior trocava classes em três placas CSS. A nova sequência usa 61 projeções do mesmo modelo geométrico, com visibilidade recalculada em cada posição. No desktop com movimento habilitado, uma seção de 310vh mantém a composição fixa enquanto a rolagem controla a separação, o preenchimento do eixo e a etapa ativa. Retornar no scroll reconstrói a montagem, sem acumular transformações.

A ilustração trata registros, planejamento e escolhas como placas conceituais. Linhas, barras e alvo distinguem as partes. Não é um desenho de equipamento ou uma representação de valores do usuário.

## Scroll

- Mantém wheel, touch e teclado nativos; não há Lenis ou scroll hijacking.
- Âncoras usam scroll suave e offset de 92px para o menu fixo, aplicado uma vez, sem somar scroll-padding e scroll-margin.
- Controles de etapa posicionam a página no intervalo correspondente; Reunir, Separar e slider permitem explorar sem mover a página.
- A próxima rolagem retoma a sequência do ponto relativo da página.
- Em telas menores que 900px, com movimento reduzido ou sem JS, a leitura é linear. O slider continua permitindo exploração quando a geometria carrega.
- A regra de scroll é aplicada apenas na landing e removida ao sair para /app.

## Assets e fonte

Modelo, configuração, evidência e ferramentas em `tools/teardown`. Licença MIT do autor original preservada. `build-timeline.cjs` gera SVGs montado/separado e a sequência JSON. Os arquivos de ferramentas não entram no bundle cliente.

A geometria completa é carregada perto da seção. O JSON tem cerca de 1 MB sem compressão (~276 KB em gzip no estado atual). A imagem montada é renderizada inicialmente; se a rede falhar, permanece estática e os controles geométricos ficam desabilitados. A explicação continua legível.

## Verificação

Provas das posições montada, separada e espaçamento extra, com cheque de oclusão. As duas extremidades foram rasterizadas e inspecionadas. Testes cobrem progresso, offset, retorno pelo mesmo caminho, limites e inventário/segurança dos SVGs gerados.

Ainda é necessário conferir o render integrado, foco e rolagem real em desktop/mobile no preview. O build e a inspeção dos desenhos não comprovam a experiência completa no navegador.
