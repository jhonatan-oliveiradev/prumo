import type {MetadataRoute} from 'next';
import {IS_PRODUCTION, SITE_URL} from '@/lib/seo';

/** Only the public landing exists as an indexable URL at this stage. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!IS_PRODUCTION) return [];
  return [{url: SITE_URL, changeFrequency: 'weekly', priority: 1}];
}
