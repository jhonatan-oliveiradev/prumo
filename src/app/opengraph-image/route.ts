import {SOCIAL_IMAGE_PATH} from '@/lib/seo';

/** Preserve previously shared /opengraph-image links after retiring the generated card. */
export function GET(request: Request) {
  const url = new URL(SOCIAL_IMAGE_PATH, request.url);
  return Response.redirect(url, 308);
}
