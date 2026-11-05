# Evidência — camadas conceituais do Prumo

Uso: timeline da landing web. Não representa equipamento físico ou desenho de fabricação. Saída SVG 1260×891, viewBox 420×297; escala ilustrativa, NTS. Paleta e fonte do Prumo.

| Grupo | Evidência | Aplicação |
| --- | --- | --- |
| Registros | Conceito sem forma física; funcionalidade existente no Prumo | Placa com quatro linhas e coluna de valores abstratos |
| Planejamento | Conceito sem forma física; projeção e compromissos existentes | Placa com seis barras |
| Escolhas | Conceito sem forma física; metas e orientação existentes | Placa com alvo concêntrico |
| Empilhamento | Construção ilustrativa | Três placas finas, espessura 3, intervalo .3; separação em Z desde a posição montada |
| Acabamento visual | Griffin inspecionada em sessão anterior | Axonometria, linhas finas, pouca decoração; geometria e proporções próprias |

Câmera única azimute -125°, elevação 24°, roll 0. A montagem e os 61 estados de separação vêm do mesmo modelo; a timeline centraliza o enquadramento sem alterar a geometria. Frames são calculados com oclusão em cada estado, em vez de mover fragmentos previamente recortados. Os SVGs de referência conservam o envelope completo da sequência.

## Reprodução

- `node tools/teardown/build-timeline.cjs`
- `node tools/teardown/scripts/proof.cjs tools/teardown/drawing.json /tmp/prumo-proof --no-png`
- Rasterização dos SVGs com Sharp para inspeção das posições montada e separada.

Foram inspecionadas imagens PNG de ambas as extremidades. A prova de oclusão reportou visibilidade completa da peça mais escondida na posição separada. O render integrado, a suavidade no navegador e dispositivos móveis continuam dependendo de verificação no preview.

## Escopo

Integração limitada à timeline: controle de separação, estados montado/separado e SVGs de referência. Não adiciona um editor de ilustrações, download PDF ou painel de fabricação à experiência financeira. As ferramentas originais ficam em `tools/teardown` para reprodução; não são incluídas no bundle do navegador. Licença MIT preservada ao lado delas.
