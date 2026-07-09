import { DEFAULT_OG_IMAGE_PATH } from '@/lib/seo/og-default';

/** Legacy URL — redirect to the static OG asset (scrapers and old shares). */
export async function GET(request: Request) {
  const target = new URL(DEFAULT_OG_IMAGE_PATH, request.url);
  return Response.redirect(target, 308);
}
