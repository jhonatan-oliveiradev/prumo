# Estratégia de SEO e identidade social — Prumo

## Fonte de verdade

- Origem canônica: https://www.prumo-finance.online
- O domínio raiz redireciona para www (conferido na Vercel).
- Idioma: pt-BR. Não há versões traduzidas; não criar hreflang artificial.
- Título, descrições e configuração do ambiente: src/lib/seo.ts.
- OG image: public/opengraph-image.png, arte estática fornecida pelo proprietário (1672 × 941 px, 1,84 MB), usada tanto pelo Open Graph quanto por Twitter/X. O gerador anterior foi removido para evitar tags concorrentes.
- Open Graph e Twitter/X: src/app/layout.tsx.

## Política de indexação

| Rota | Política | Sitemap |
| --- | --- | --- |
| Landing na Production | index, follow | Sim |
| /app e filhos | noindex, nofollow | Não |
| /login e /cadastro | noindex, nofollow | Não |
| 404 | noindex, nofollow | Não |
| Preview / desenvolvimento | noindex, nofollow | Sitemap vazio |
| /api/* | bloqueio de rastreamento | Não |

IMPORTANTE: páginas marcadas como noindex não devem ser bloqueadas por robots.txt, pois o Google precisa rastrear o HTML para encontrar a instrução. Por isso apenas APIs são bloqueadas no robots; login, app e previews fornecem tags noindex próprias. O controle de busca não substitui a autenticação das APIs.

## Dados estruturados

O componente src/components/seo-json-ld.tsx publica WebSite e WebApplication (FinanceApplication), somente na landing, sem reviews, rankings, preços, garantias, parceiros ou integrações bancárias não verificadas.

## Validação após merge

1. Abrir / no domínio canônico; conferir title, description, canonical, OG title/description/image/alt, Twitter card e robots index/follow.
2. Abrir /opengraph-image.png; confirmar PNG 1672×941 e legibilidade em miniatura. /opengraph-image (URL antiga) redireciona para a imagem estática.
3. Abrir /robots.txt e /sitemap.xml; Production lista somente landing, Preview tem sitemap vazio e noindex.
4. Abrir /app, /login e /cadastro; conferir noindex,nofollow sem enviar informações pessoais a testadores externos.
5. Testar a URL do Preview nos validadores sociais: o og:image deve apontar para o próprio Preview (não para produção) e o HTML deve continuar noindex. Após merge, testar o domínio canônico no Facebook Sharing Debugger e LinkedIn Post Inspector. Se a imagem anterior ainda aparecer, pedir nova coleta da URL para limpar o cache.
6. Rodar Lighthouse mobile/desktop para SEO e Core Web Vitals; revisar a hero com shader e eventuais problemas de LCP.

## Pós-publicação: proprietário do domínio

- Verificar www.prumo-finance.online no Google Search Console e no Bing Webmaster Tools.
- Enviar https://www.prumo-finance.online/sitemap.xml.
- Inspecionar a URL canônica, solicitar indexação e acompanhar cobertura, impressões e Core Web Vitals.
- Só incluir novas páginas públicas no sitemap quando existirem; não adicionar landing pages fictícias.

SEO técnico melhora a base, mas não garante indexação ou posição nos resultados.

## Roteiro rápido de validação social

1. Abrir o Preview do PR no navegador e confirmar que `/opengraph-image.png` entrega a imagem nova.
2. No https://www.opengraph.xyz/ ou https://metatags.io/, colar **a URL da landing do Preview**, não a URL da imagem. Conferir uma única tag `og:image`, `twitter:image` e as dimensões 1672 × 941. O robô pode não conseguir abrir previews protegidos; isso não indica erro nas tags.
3. Após o merge, usar **https://www.prumo-finance.online/** no https://developers.facebook.com/tools/debug/ e https://www.linkedin.com/post-inspector/ para pedir uma nova coleta.
4. A URL `https://www.prumo-finance.online/opengraph-image.png` é o asset direto definitivo; a antiga `/opengraph-image` retorna redirecionamento.
5. O card da arte original é mais horizontal que vertical, mas tem proporção diferente de 1200×630; algumas redes podem recortar bordas. Nenhuma composição original foi alterada nesta PR.

A imagem usada na landing e no compartilhamento tem autorização do proprietário. Não reutilizar dados de contas reais em próximos materiais.
