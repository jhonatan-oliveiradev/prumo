# Refinamento da composição e do movimento

Referências analisadas em 05/11/2026:
- Griffin: https://cap.so/s/hr5f38xhep6yjah
- Prumo antes desta entrega: https://cap.so/s/jqg38pz471rwa2p

A gravação da Griffin mostra uma timeline editorial vertical e uma ilustração técnica com preenchimentos quase pretos, traços finos e separação progressiva. Na seção seguinte, os painéis permanecem sobre a mesma composição enquanto a fotografia dá lugar a uma malha, por um movimento lateral. A identidade, a tipografia Inter e o conteúdo do Prumo foram mantidos.

## Alterações

- Timeline com histórias que percorrem um eixo vertical continuamente. O destaque acompanha a história mais próxima do centro da sequência; os controles levam ao centro de cada etapa. Ilustração ampliada, preenchimentos escuros e contornos mais discretos, sem regenerar os assets.
- Imagem/Malha controlam efetivamente o fundo, com transição lateral e sem deslocar os painéis. A fotografia continua vinculada ao exemplo selecionado. A opção de alternar panorama/detalhes foi preservada no próprio painel.
- Entradas coordenadas de títulos, textos, listas, links, arte e rodapé ao longo da página, usando IntersectionObserver e animações finitas. Conteúdo inicial/restaurado permanece legível na hidratação; foco revela imediatamente um item pendente; movimento reduzido cancela animações e revela tudo. Sem JavaScript, o conteúdo permanece visível.
- Header de 64px, navegação compacta e offsets de âncora/timeline em 68px.
- Rodapé com espaçamento e hierarquia revistos e assinatura “powered by NX Studio.”.

## Verificação

45 testes, typecheck, build de produção e diff check aprovados. Chromium local com SwiftShader: inspeção visual em 1440×1000, 1024×768, 768×900, 390×900 e 320×900. Conferidos rolagem reversa e deslocamento contínuo das camadas, seleção das etapas, controles por teclado, alternância Imagem/Malha, detalhes, ausência de overflow horizontal, leitura linear sem JS/movimento reduzido, troca da preferência em execução e reload com cache quente. Rodada adicional em 1280×700 e 1280×768 confirmou que o conteúdo ativo da timeline cabe na área visível. Console sem erros.

Limites: não houve teste em Safari, aparelhos físicos ou GPU física. O movimento foi conferido no navegador local; não se presume equivalência completa com esses ambientes nem validação do preview protegido da Vercel.
