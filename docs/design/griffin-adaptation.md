# Prumo — adaptação da referência Griffin

Referência fornecida: https://www.griffin.com/?ref=saaspo.com

## Varredura realizada

Inspeção direta no navegador da hero, faixa gráfica, navegação durante a rolagem, menu expandido de produtos, sequência de infraestrutura em camadas, acordeão de soluções, alteração de solução e ilustração, catálogo de produtos, seção de casos, seção para desenvolvedores e conteúdo do encerramento/rodapé. A referência contém fotografia, dados bancários e provas sociais próprias; esses assets e alegações não foram transferidos ao Prumo. O comportamento móvel da referência não foi verificado em um dispositivo móvel nesta sessão.

## Diagnóstico e direção

A landing anterior contava a história principalmente por cards e uma demonstração em tabs. Isso tornava a navegação previsível, mas não construía a narrativa espacial que motivou a nova referência.

Duas direções consideradas:

- Evoluir o painel de demonstração anterior: menor custo, porém mantém a mesma hierarquia da entrega rejeitada.
- Narrativa editorial com divisórias, camadas e cenários sincronizados: exige mais cuidado na rolagem e no mobile, mas explica como o orçamento se constrói. Direção escolhida.

## O que foi traduzido

| Observado na referência | Aplicação no Prumo |
| --- | --- |
| Hero aberta, alinhada à esquerda, poucas ações | Mensagem sobre perspectiva financeira; começar e explorar |
| Navegação compacta durante a rolagem | Navegação flutuante com menu de recursos e âncoras reais |
| Faixa gráfica em movimento | Campo 2D original de traços alinhando-se a um eixo |
| Grade de marcas | Grade de capacidades reais, sem inventar clientes |
| Infraestrutura em camadas | Registre, planeje e decida; ilustração conceitual própria em CSS |
| Acordeão com ilustração sincronizada | Dia a dia, recorrências, metas e orientação, com exemplo correspondente |
| Alternância UI/API | Panorama/detalhes, adequada ao usuário financeiro, sem prometer API pública |
| Catálogo de produtos | Diretório dos recursos existentes |
| Conteúdo para desenvolvedores | Privacidade e controle na análise por IA |
| Grande CTA e rodapé organizado | Instalação PWA e abertura do espaço |

Mantidos: Inter, canvas #030504 e família verde do Prumo. Não são usadas fontes, fotos, logotipos, código, depoimentos ou afirmações regulatórias da Griffin. A imagem editorial gerada anteriormente continua disponível no repositório; esta composição prioriza ilustração procedural.

## Movimento e operação

- CSS para menus, placas e troca de exemplo; IntersectionObserver para estado das camadas.
- Sem prender ou substituir a rolagem nativa. Painel lateral sticky apenas em telas largas; conteúdo linear nas estreitas.
- Campo Canvas2D limitado a cerca de 30 fps e DPR 1,5. Pausa fora da viewport, na aba oculta e com movimento reduzido. Listeners, observers e RAF são removidos ao desmontar.
- Conteúdo real fica no HTML; o canvas é decorativo e oculto à árvore de acessibilidade.
- Acordeão e seletores usam botões; menu usa Popover Radix. Valores demonstrativos são identificados; não há chamada à IA, cadastro ou escrita de dados nesta landing.

## Verificação e limites

37 testes existentes, TypeScript, build e diff check. Nenhuma alteração no aplicativo /app ou nos modelos financeiros. É necessário revisar o render do Prumo no preview, teclado, 320px, desktop, movimento reduzido e consumo do canvas. A inspeção da referência e o build não validam o resultado visual do Prumo.
