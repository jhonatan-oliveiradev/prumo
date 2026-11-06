# Assets do login cinematográfico do Prumo

Esses arquivos estão versionados no repositório e são usados nas páginas `/login` e `/cadastro`:

| Arquivo | Formato | Tamanho |
| --- | --- | --- |
| `prumo-login.webm` | VP9, sem áudio | 930 KB |
| `prumo-login.mp4` | H.264, sem áudio | 1,03 MB |
| `prumo-login-poster.webp` | Poster WebP | 72 KB |

Os assets foram gerados a partir do vídeo enviado para o projeto. O WebM é a primeira fonte, seguido do MP4. A posterização do vídeo em caracteres ASCII é feita por `src/components/auth-video-ascii.tsx`, sem dependências novas.

**Fallbacks:** enquanto o vídeo carrega, quando o autoplay é bloqueado ou não há codec compatível, o canvas amostra a imagem de poster. Se ela falhar, o componente tenta `/images/prumo-forest.webp`. Com movimento reduzido, a interface permanece estática e usa o poster.

**Performance:** somente um pequeno grid de pixels é lido a cada atualização; o loop para quando a aba fica oculta ou quando o painel sai da viewport. Os eventos de ponteiro não capturam cliques ou bloqueiam o formulário.
