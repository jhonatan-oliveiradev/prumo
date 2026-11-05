# Prumo — interface e lançamento

O Prumo é uma ferramenta web para entender o orçamento sem ruído. A identidade aparece no verde contido, no símbolo de alinhamento e na linguagem acolhedora; controles ficam familiares e discretos. Os princípios Apple são traduzidos para componentes acessíveis da web, sem alegar interface nativa.

## Decisões de interface

- Canvas dark `#030504`; sidebar `#070a08`; superfície `#0d110e`; camada elevada `#151a16`.
- Texto `#ecf0ed`; secundário `#9ca8a0`; ação `#28513b` com texto branco. Cores financeiras existentes preservam significado e possuem rótulos/ícones.
- Contraste medido: texto principal/superfície 16,54:1; secundário/superfície 7,72:1; branco/ação 9,01:1. Esses pares atendem AA para texto normal; não equivalem a uma auditoria completa.
- Raio: controles 8px, cards 14px, diálogos 16px. Esses valores são decisões do produto, não medidas exigidas pela Apple.
- Select Radix com teclado, typeahead, Escape, indicador de seleção e popup que respeita a viewport.
- Calendário DayPicker pt-BR em Popover; entrada digitável dd/mm/aaaa, validação de datas e limites mínimos; serialização ISO para FormData.
- Skeletons adaptados dos componentes Figma `23:29`, `23:33`, `23:42`. A marca aparece no carregamento real, sem tempo mínimo obrigatório.
- `/` apresenta o produto; `/app` mantém a aplicação e o armazenamento no mesmo domínio. Manifest id preservado, start_url atualizado. Cache de navegação separado por rota.
- Não há download de executável ou distribuição em lojas. O botão instala a PWA quando suportado e oferece instruções quando não há prompt disponível.

## Referências consultadas

- https://github.com/dickwu/apple-design-skill — princípios, acessibilidade, layout, tipografia, cores, dark mode, pickers, modalidade, carregamento e lançamento. `loading.md › Best practices`: “Show something as soon as possible.” `launching.md › Best practices`: “Launch instantly.”
- https://aiuxplayground.com/skills/teardown — útil para ilustrações técnicas, vistas explodidas e camadas conceituais; não é uma skill de revisão de UX. Não foi adicionada uma vista explodida sem necessidade de comunicação.
- https://www.figma.com/design/WuyVWVVH2lZtJeU5E3AXVX/Prumo?node-id=23-50 — referência visual dos placeholders.

## Plano de assets

| Asset | Produção | Estado |
| --- | --- | --- |
| Imagem editorial do prumo de metal | Geração de imagem nesta sessão | Integrada em `public/images/prumo-balance.webp` |
| Prévia desktop da interface | React/CSS, textos e valores demonstrativos | Integrada; não representa dados do visitante |
| Splash e skeletons | SVG existente e CSS | Integrados |
| Loop do prumo alinhando-se, 6–8 s | Ferramenta de vídeo a partir da imagem aprovada | Opcional; não gerado |
| Showcase de navegação, 15–25 s | Gravação real da interface + edição | Próximo asset recomendado após validação visual |
| Prumo 3D editável | Blender/Spline ou gerador GLB com revisão de geometria | Opcional, só se for necessário controlar a câmera |
| Exploded view do fluxo financeiro | SVG conceitual / teardown | Opcional; apenas se explicar melhor o produto |

### Prompt da imagem integrada

Prumo físico de metal escovado escuro, suspenso verticalmente por fio verde sálvia sobre linha de alinhamento. Fundo quase preto esverdeado #030504. Fotografia editorial 3D discreta, objeto no terço esquerdo, espaço negativo à direita; luz de recorte sálvia e luz superior suave; sem texto, logotipo, moedas, gráficos ou neon. Gerada pelo recurso integrado de imagem; convertida para WebP 1536px.

### Briefing para vídeo opcional

Use a imagem aprovada como frame inicial. Câmera fixa, 6–8 segundos. Oscilação pequena e amortecida do prumo até o alinhamento vertical; luz sálvia sutil sobre metal, composição e materiais constantes. Sem texto, gráficos ou objetos adicionais. Exportar MP4 H.264 e WebM, 1440px, sem áudio; poster WebP e versão estática para movimento reduzido. Não ativar autoplay pesado antes de medir desempenho.

## Verificação

Testes de datas cobrem entrada brasileira, ano bissexto, datas impossíveis e limite mínimo. Build e testes gerais devem passar. Validação no navegador deve incluir: seleção por teclado e FormData, calendário dentro do diálogo, erros/fechamento/foco, 320px e desktop, light/dark, zoom 200%, instalação e cache offline distintos de `/` e `/app`. Não inferir essa validação a partir de um build bem-sucedido.
