import type { PrismaClient } from '../../generated/prisma';

const PILOT_TITLE_PREFIX = /^\[Pilot\]\s+/;
const PILOT_TITLE_SUFFIX = /\s+#\d+$/;

/** Strip pilot seed markers from a listing title, or null when unchanged. */
export function cleanPilotListingTitle(title: string): string | null {
  if (!PILOT_TITLE_PREFIX.test(title)) return null;
  const cleaned = title.replace(PILOT_TITLE_PREFIX, '').replace(PILOT_TITLE_SUFFIX, '').trim();
  return cleaned.length > 0 && cleaned !== title ? cleaned : null;
}

export interface RevalidateListingCacheOptions {
  webAppUrl?: string;
  revalidateSecret?: string;
}

export async function revalidateListingCache(
  listingId: string,
  options: RevalidateListingCacheOptions = {},
): Promise<boolean> {
  const webAppUrl = (options.webAppUrl ?? process.env.WEB_APP_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  const secret = options.revalidateSecret ?? process.env.REVALIDATE_SECRET;
  if (!secret) return false;

  try {
    const response = await fetch(`${webAppUrl}/api/revalidate/listing/${listingId}`, {
      method: 'POST',
      headers: { 'x-revalidate-secret': secret },
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export interface CleanPilotListingTitlesOptions extends RevalidateListingCacheOptions {
  revalidateCache?: boolean;
}

export interface CleanPilotListingTitlesResult {
  scanned: number;
  updated: number;
  revalidated: number;
}

/** Remove `[Pilot]` prefix and `#N` suffix from legacy pilot seed listings. */
export async function cleanPilotListingTitles(
  prisma: PrismaClient,
  options: CleanPilotListingTitlesOptions = {},
): Promise<CleanPilotListingTitlesResult> {
  const listings = await prisma.listing.findMany({
    where: { title: { startsWith: '[Pilot]' } },
    select: { id: true, title: true },
    orderBy: { id: 'asc' },
  });

  let updated = 0;
  let revalidated = 0;
  const shouldRevalidate = options.revalidateCache !== false;

  for (const listing of listings) {
    const cleanedTitle = cleanPilotListingTitle(listing.title);
    if (!cleanedTitle) continue;

    await prisma.listing.update({
      where: { id: listing.id },
      data: { title: cleanedTitle },
    });
    updated += 1;

    if (shouldRevalidate) {
      const ok = await revalidateListingCache(listing.id, options);
      if (ok) revalidated += 1;
    }
  }

  return { scanned: listings.length, updated, revalidated };
}
