# Evidência — camadas conceituais do Prumo

Uso: timeline da landing web, NTS. Quatro placas de interface são uma metáfora de organização financeira; não representam hardware ou infraestrutura bancária. Saída SVG 960×891, viewBox `50 0 320 297`. Inter e paleta Prumo.

Referência fornecida por Jhonatan: Figma `WuyVWVVH2lZtJeU5E3AXVX`, página Images `1:6`, nó `37:11` (Isometric technical diagram). A imagem foi inspecionada em 1600 px e seus bytes originais foram consultados. A referência informa silhueta, projeção, densidade de interface, separação vertical e fundo pontilhado. Seus rótulos de API/infraestrutura não descrevem o Prumo e não foram reproduzidos.

| Grupo | Evidência | Aplicação |
| --- | --- | --- |
| Registros | Conceito sem forma física; contas e transações existentes | Base de registros com sidebar abstrata e seis linhas |
| Organização | Conceito sem forma física; compromissos e recorrências existentes | Calendário esquemático, sete colunas e quatro faixas |
| Planejamento | Conceito sem forma física; orçamentos, metas e relatórios existentes | Curva, alvo e dez barras |
| Escolhas | Conceito sem forma física; visão geral e orientação autorizada existentes | Placa superior com layout de dashboard e três resumos |
| Empilhamento | Construção ilustrativa orientada pela referência | Quatro placas 112×76; espessuras 4/4/4/5, intervalo .4; translação vertical a partir da montagem |
| Acabamento | Referência visual do usuário e identidade Prumo | Axonometria, linhas finas e faces verdes escuras; sem texturas ou internals inventados |

Câmera única: azimute -132°, elevação 29°, roll 0. Geometria, deslocamentos e âncoras vêm do mesmo modelo. Cada placa é projetada isoladamente com suas superfícies completas e oclusão própria recalculada. As quatro placas são paralelas, não se intersectam e conservam sua ordem de profundidade: as faces opacas e a pintura de baixo para cima ocultam corretamente a placa anterior em qualquer separação contínua. Não se movem fragmentos recortados por outras placas.

O gerador calibra cada projeção isolada no enquadramento global. A separação e a correção de centro usam vetores projetados, inclusive para as chamadas. O navegador altera apenas quatro transformações; não há JSON de 61 poses nem recomposição de paths por frame. Foram removidos a sequência antiga de aproximadamente 1,1 MB e o arquivo redundante de âncoras.

## Reprodução

- `node tools/teardown/build-timeline.cjs`
- `node tools/teardown/scripts/proof.cjs tools/teardown/drawing.json /tmp/prumo-proof --no-png`
- Rasterizar os SVGs montado, separado e em espaçamento de 150% com Sharp para inspeção.

O teste de oclusão no espaçamento padrão mostra pelo menos 90% da linework da peça mais encoberta. Estados montado e separado usam o mesmo inventário e a mesma câmera; mudanças de viewport nunca alteram a geometria.

## Escopo

A integração oferece leitura da timeline e controles Reunir/Separar/slider; em telas estreitas ou baixas e com movimento reduzido, o texto segue uma leitura linear. Não adiciona um editor técnico ou controles de fabricação ao produto financeiro. Fonte e SVGs de referência ficam no repositório; bibliotecas de modelagem não entram no bundle do navegador. Licença MIT preservada em tools/teardown.
