# Hero, shader e enriquecimento da timeline

Referência: vídeo https://cap.so/s/21ybjx1xjds1abw e prints enviados em 05/11/2026. Container da hero e cabeçalho centralizado em 1280px, mantendo texto à esquerda e faixa visual em largura total. A grade de capacidades usa o mesmo alinhamento.

A faixa anterior Canvas2D foi substituída por shader WebGL1 próprio. Usa atlas local de R, $, / e + em Inter, campo de ruído e ondas para modular densidade e luminosidade. Não usa assets ou código da Griffin. WebGL opera com preferência low-power, limite aproximado de 30fps e DPR 1,25 (1 no touch); pausa fora de vista, em aba oculta e com movimento reduzido. Sem WebGL, em falha de compilação ou perda de contexto, aparece fallback estático. Os recursos são liberados ao desmontar.

A timeline foi ampliada e recebeu chamadas vinculadas a âncoras projetadas pelo mesmo modelo/câmera dos 61 estados. As chamadas mudam com a etapa: contas/categorias e movimentos; vencimentos e recorrências; metas/limites e orientação. No mobile, as etiquetas legíveis no caption substituem as chamadas pequenas dentro do SVG.

O vídeo foi aberto no navegador; foi possível reproduzir a hero/faixa e explorar o player. Os prints enviados são a referência mais nítida para a escala e a distribuição das chamadas da timeline. O efeito novo é uma adaptação original, sem alegação de fidelidade pixel a pixel.

Verificação necessária em navegador: compilação WebGL em drivers reais, contexto perdido/restaurado, fallback, ponteiro, scroll, 320px/desktop e movimento reduzido. Testes/TypeScript/build não substituem essa verificação. O carregamento da timeline e seu modelo geométrico anterior foram preservados.


Nota de evolução: a timeline de 61 estados descrita acima foi substituída pela projeção contínua de quatro placas. Consulte `figma-landscapes-and-timeline.md` e `tools/teardown/evidence.md` para a implementação atual.
