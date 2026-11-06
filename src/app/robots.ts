import type {MetadataRoute} from 'next';
import {IS_PRODUCTION, SITE_URL} from '@/lib/seo';

/**
 * Google must be able to read HTML meta noindex on login, app and previews.
 * Only API endpoints are crawl-blocked; page-level directives control indexing.
 */
export default function robots(): MetadataRoute.Robots {
  const rules = {
    userAgent: '*',
    allow: '/',
    disallow: '/api/',
  };

  if (!IS_PRODUCTION) return {rules};

  return {
    rules,
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
