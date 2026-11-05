# Landing: floresta e abertura ASCII

## Direção

Precisa, calma e técnica. A assinatura é a passagem do símbolo Prumo para um campo de glifos, que se resolve antes do conteúdo. Inter e a paleta original continuam presentes: #030504, #28513b, #91b59c. Nada de scroll artificial ou bibliotecas de animação adicionais.

- Entrada: carregamento real/fontes (limite de 1100 ms), saída do símbolo (240 ms), revelação ASCII de cima para baixo (1350 ms), textos e CTAs decodificados (520 ms).
- O relógio da revelação usa tempo real entre frames, independente da taxa de renderização. Deriva ambiente usa delta limitado.
- O campo recebe um callback de conclusão; não se sincroniza o texto apenas por um delay CSS. Um limite separado de 1900 ms libera o conteúdo se a GPU não responder.
- Interações: 180–240 ms; painéis: 240–420 ms, deslocamento máximo de 12 px e sobreposição curta de entrada/saída.
- A imagem da floresta é a fornecida por Jhonatan, convertida para WebP, sem substituir a cena.

## Abertura por documento

`LaunchProvider` fica no layout raiz e não persiste flags. F5 e carregamentos completos mostram o símbolo; navegação interna mantém o provider montado e não repete a abertura. O skeleton da aplicação continua em /app/loading.tsx e em FinanceApp, respondendo à hidratação dos dados. O loading.tsx duplicado da raiz foi removido: ele deixava a landing estática dentro de uma fronteira de streaming dependente de JavaScript, exibindo o skeleton de dashboard para visitantes sem JS.

O script inicial prepara as classes antes da pintura. Um watchdog de 6500 ms remove qualquer ocultação se a hidratação falhar. Sem JavaScript, o conteúdo do servidor continua visível. Não há bloqueio de scroll.

Movimento reduzido e links profundos dispensam a sequência da hero. “Pular apresentação” e mudanças de âncora também liberam o conteúdo. A navegação permanece independente do efeito.

## Renderização

`gradient-ascii.jsx` adapta o código do componente GradientASCII fornecido pelo usuário, do React Bits. A licença e atribuição estão em `docs/licenses/react-bits.txt` (MIT + Commons Clause; uso como parte desta aplicação). Sem dependências adicionais.

WebGL2, DPR até 1.25, desenho até 30fps. O campo para ao completar a intro; apenas rastros/interações reativam frames temporariamente. Visibilidade, interseção e movimento reduzido são respeitados; recursos são descartados no unmount. WebGL indisponível ou perda de contexto liberam o conteúdo sobre um fundo CSS.

O texto real determina largura e quebra de linhas; os glifos sobrepostos são decorativos e ocultos da árvore de acessibilidade. Painéis inativos usam inert e aria-hidden; o accordion mantém aria-expanded/controls e foco nos botões.

## Escopo preservado

Sem mudanças no banco, autenticação, IA, sincronização, valores financeiros ou service worker. A faixa gráfica e a timeline existentes permanecem.

## Validação desta entrega

- `npm test`: 41 testes passaram; `npm run typecheck`, `npm run build` e `git diff --check` passaram.
- Chromium headless com WebGL via SwiftShader: sequência instrumentada confirmou saída do loader, início do campo, conclusão do campo e entrada do conteúdo nessa ordem, em carga inicial e reload com cache quente. Nenhum erro de console/hidratação na landing.
- Conferência visual: desktop 1440×1000, layouts de 768, 390 e 320 px; quatro casos e modo Detalhes. Sem overflow horizontal nessas larguras. Accordion por teclado e cliques rápidos preservam um único painel ativo.
- “Pular apresentação”, links profundos, preferência de movimento alterada em tempo real e navegação interna para /app verificados; o loader não reaparece nessa navegação.
- Fallbacks verificados: movimento reduzido, ausência de WebGL e JavaScript desativado. O campo ASCII não continua desenhando quando está ocioso.
- Limites: não verificado em GPU física, iPhone/Android reais ou Safari. A verificação local não remove nem contorna a proteção dos previews Vercel.
