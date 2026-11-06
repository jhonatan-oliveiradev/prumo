# Estratégia de SEO e identidade social — Prumo

## Fonte de verdade

- Origem canônica: https://www.prumo-finance.online
- O domínio raiz redireciona para www (conferido na Vercel).
- Idioma: pt-BR. Não há versões traduzidas; não criar hreflang artificial.
- Título, descrições e configuração do ambiente: src/lib/seo.ts.
- OG image: src/app/opengraph-image.tsx, gerada pelo ImageResponse nativo em 1200 × 630, sem fontes externas nem dashboards fictícios.
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
2. Abrir /opengraph-image; confirmar PNG 1200×630 com texto legível em miniatura.
3. Abrir /robots.txt e /sitemap.xml; Production lista somente landing, Preview tem sitemap vazio e noindex.
4. Abrir /app, /login e /cadastro; conferir noindex,nofollow sem enviar informações pessoais a testadores externos.
5. Testar o compartilhamento do link canônico via WhatsApp, LinkedIn e ferramentas de visualização Open Graph.
6. Rodar Lighthouse mobile/desktop para SEO e Core Web Vitals; revisar a hero com shader e eventuais problemas de LCP.

## Pós-publicação: proprietário do domínio

- Verificar www.prumo-finance.online no Google Search Console e no Bing Webmaster Tools.
- Enviar https://www.prumo-finance.online/sitemap.xml.
- Inspecionar a URL canônica, solicitar indexação e acompanhar cobertura, impressões e Core Web Vitals.
- Só incluir novas páginas públicas no sitemap quando existirem; não adicionar landing pages fictícias.

SEO técnico melhora a base, mas não garante indexação ou posição nos resultados.
