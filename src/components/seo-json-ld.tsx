import {SITE_DESCRIPTION, SITE_NAME, SITE_URL} from '@/lib/seo';

/**
 * Search engines can understand the public product, not the private workspace.
 * No fictitious reviews, prices, awards, bank integrations or search actions.
 */
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: 'pt-BR',
      description: SITE_DESCRIPTION,
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#application`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: 'pt-BR',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      description: SITE_DESCRIPTION,
      image: `${SITE_URL}/opengraph-image`,
      featureList: [
        'Contas e lançamentos financeiros',
        'Cartões e faturas',
        'Compromissos e recorrências',
        'Orçamentos e metas financeiras',
        'Acesso pelo navegador e instalação como aplicativo web',
      ],
    },
  ],
} as const;

export function SeoJsonLd() {
  return <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
    }}
  />;
}
