# Vídeo de acesso do Prumo

O painel de acesso (`/login` e `/cadastro`) usa três assets binários otimizados, provenientes do vídeo entregue pelo usuário.

| Arquivo | Formato | Tamanho aproximado |
| --- | --- | --- |
| `prumo-login.mp4` | H.264 sem áudio (fallback principal) | 1,0 MB |
| `prumo-login.webm` | VP9 sem áudio | 0,9 MB |
| `prumo-login-poster.webp` | WebP (poster e redução de movimento) | 71 KB |

Os arquivos devem ficar **nesta pasta** (`public/videos`) antes do merge. O pacote entregue na conversa é `prumo-login-assets-optimized.zip` e contém essa estrutura pronta para copiar.

Sem os três assets, o painel usa a fotografia já existente (`public/images/prumo-forest.webp`) como fallback. A implementação do canvas ASCII e da coreografia não depende de novas bibliotecas.

Padrões: autoPlay + muted + loop + playsInline, canvas em baixa resolução a ~11 FPS no desktop, interação somente com cursor fino, pausa quando a aba fica oculta e `prefers-reduced-motion` respeitado.
