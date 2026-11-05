# Paisagens Figma e timeline contínua

## Fontes e correspondência

Arquivo: [Prumo no Figma](https://www.figma.com/design/WuyVWVVH2lZtJeU5E3AXVX/Prumo), página Images `1:6`. Imagens originais 2752×1536, baixadas a partir dos assets do contexto Figma e otimizadas para WebP 1920×1072. Não há URLs temporárias no produto.

| Exemplo | Imagem fornecida | Nó | Asset local |
| --- | --- | --- | --- |
| Dia a dia | Emerald canyon cliff faces | 37:10 | /images/prumo-canyon.webp |
| Todo mês | Misty mountain ridge with forest | 39:3 | /images/prumo-ridge.webp |
| Conquistas | Mountain lake surrounded by trees | 39:2 | /images/prumo-lake.webp |
| Orientação | Winding river in green valley | 39:4 | /images/prumo-river.webp |

A floresta já publicada permanece disponível no repositório. As novas fotografias ocupam a mesma área dos exemplos, com enquadramento cover central, escurecimento discreto e painéis existentes. A troca não desloca layout: a foto recebida permanece em opacidade zero até carregar e entra em crossfade. Movimento reduzido mantém troca imediata; sem JavaScript a primeira foto continua visível.

## Timeline

Referência do esquema: nó `37:11`; reconstrução vetorial com Teardown, não uma fotografia animada. Quatro etapas: Registre, Organize, Planeje e Decida. As placas representam funções existentes; não alegam serviços bancários ou integrações do esquema original.

A geometria agora contém quatro placas completas, em cerca de 60 KB, com câmera e âncoras compartilhadas. Transformações contínuas substituem o JSON de poses e a troca de paths. O acompanhamento usa convergência exponencial de 85 ms, consistente em 30/60/120 Hz. RAF roda só enquanto a seção está visível e precisa convergir; listeners, observadores e frames são limpos ao desmontar.

A rolagem é nativa. Desktop a partir de 900×800 usa stage sticky; telas menores/mais baixas e movimento reduzido usam leitura linear. Não há scroll interno na coluna de texto. Os controles continuam disponíveis sem download assíncrono de geometria. A troca das histórias usa opacidade/deslocamento curto e mantém foco e inatividade semântica corretos.

Reprodução e evidência geométrica em `tools/teardown/evidence.md`.

## Verificação

- 45 testes passaram, incluindo projeções/âncoras finitas, inventário de quatro placas, resposta de movimento independente de refresh rate e integridade dos WebP.
- Typecheck, build de produção e diff check passaram.
- Chromium headless/SwiftShader: rolagem de ida/volta, pequenas variações de 1 px, etapas, Reunir/Separar por teclado, quatro imagens reais carregadas e ausência de requisição do JSON antigo.
- Inspeção visual desktop 1440×1000 e layouts 1024×768, 768×900, 390×900 e 320×900; sem overflow horizontal. Verificados movimento reduzido e conteúdo do servidor sem JavaScript.
- Prova geométrica: três vistas (montado, separado e espaçamento 150%); visibilidade mínima reportada de 90% da linework no espaçamento padrão. PNGs do modelo e da integração inspecionados.
- Limites: sem conferência em Safari, GPU física ou dispositivos móveis reais. Nenhuma proteção da Vercel foi alterada.
