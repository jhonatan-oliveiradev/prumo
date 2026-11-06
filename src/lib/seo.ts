/**
 * One canonical origin for public search and social cards.
 * The apex redirects to www; ephemeral Vercel URLs must never be canonical.
 */
export const SITE_URL = 'https://www.prumo-finance.online';

export const SITE_NAME = 'Prumo';
export const SITE_TITLE = 'Prumo | Controle financeiro pessoal e de gastos';
export const SITE_DESCRIPTION =
  'Organize contas, cartões, despesas, vencimentos e metas em um só lugar. Acompanhe seu dinheiro pelo navegador ou instale o Prumo no dispositivo.';

export const SOCIAL_TITLE = 'Prumo — Seu dinheiro, no eixo.';
export const SOCIAL_DESCRIPTION =
  'Veja o que entra, saiba o que sobra. Organize contas, gastos, cartões e metas com mais clareza.';

/**
 * Previews, branch URLs, and local environments are never search-indexable.
 * Do not derive canonical URLs from VERCEL_URL or request Host headers.
 */
export const IS_PRODUCTION = process.env.VERCEL_ENV === 'production';

/** The exact artwork supplied by the product owner, stored in public/. */
export const SOCIAL_IMAGE_PATH = '/opengraph-image.png';
export const SOCIAL_IMAGE_WIDTH = 1672;
export const SOCIAL_IMAGE_HEIGHT = 941;
export const SOCIAL_IMAGE_ALT =
  'Prumo: organize suas finanças com clareza. Contas, cartões, metas e relatórios em uma única plataforma.';

/**
 * Preview share tests must resolve the image from the actual preview deployment,
 * not the old production page. This never changes the page's canonical URL.
 */
const previewHost = process.env.VERCEL_URL;
export const SOCIAL_IMAGE_URL = !IS_PRODUCTION && previewHost
  ? `https://${previewHost}${SOCIAL_IMAGE_PATH}`
  : `${SITE_URL}${SOCIAL_IMAGE_PATH}`;


export const PRIVATE_ROBOTS = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {index: false, follow: false, noimageindex: true},
} as const;
