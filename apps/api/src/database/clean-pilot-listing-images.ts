import type { PrismaClient } from '../../generated/prisma';

import { revalidateListingCache, type RevalidateListingCacheOptions } from './clean-pilot-listing-titles';

/** Curated Unsplash photo path segments (after `photo-`) for common pilot titles. */
const PILOT_IMAGE_BY_KEYWORD: Array<{ match: RegExp; photoPath: string }> = [
  // Stick vacuum / home appliance
  { match: /dyson|vacuum/i, photoPath: '1558317874-97d188866b7a' },
  { match: /yoga mat/i, photoPath: '1544367567-0f2fcb009e0b' },
  { match: /road bike|bicycle/i, photoPath: '1485965120184-e220f721d03e' },
  { match: /plant pot/i, photoPath: '1485955900001-4c5a4c7c0f0e' },
  { match: /airpods/i, photoPath: '1606220945770-b5b6c2c55bf1' },
  { match: /galaxy|samsung|iphone|phone/i, photoPath: '1511707171634-5f897ff02aa9' },
  { match: /coffee table|oak table/i, photoPath: '1533090161767-e6ffed986c88' },
  { match: /hijab/i, photoPath: '1583394838336-acd977736f90' },
  { match: /abaya/i, photoPath: '1490481651871-ab68de25d43d' },
];

/** Known mismatched Unsplash photos from legacy pilot seed. */
const KNOWN_BAD_PHOTO_PATHS = new Set([
  '1549317661-bd32c8ce0db2', // car (Fiat)
  '1505740420928-5e560c06d30e', // headphones used on vacuum
  '1492144534655-ae79c964c9d7', // sports car
]);

function extractUnsplashPhotoPath(url: string): string | null {
  const match = url.match(/images\.unsplash\.com\/photo-([a-zA-Z0-9-]+)/);
  return match?.[1] ?? null;
}

function buildUnsplashUrl(photoPath: string, listingId: string): string {
  return `https://images.unsplash.com/photo-${photoPath}?auto=format&fit=crop&w=900&h=900&q=80&crop=entropy&cs=tinysrgb&sig=${listingId}`;
}

function resolveReplacementPhotoPath(title: string): string | null {
  for (const entry of PILOT_IMAGE_BY_KEYWORD) {
    if (entry.match.test(title)) return entry.photoPath;
  }
  return null;
}

export interface CleanPilotListingImagesOptions extends RevalidateListingCacheOptions {
  revalidateCache?: boolean;
  dryRun?: boolean;
}

export interface CleanPilotListingImagesResult {
  scanned: number;
  updatedImages: number;
  skipped: number;
  revalidated: number;
}

/**
 * Replace known-bad Unsplash photos on listings with keyword-matched stock images.
 */
export async function cleanPilotListingImages(
  prisma: PrismaClient,
  options: CleanPilotListingImagesOptions = {},
): Promise<CleanPilotListingImagesResult> {
  const images = await prisma.listingImage.findMany({
    where: { url: { contains: 'images.unsplash.com' } },
    select: {
      id: true,
      url: true,
      listingId: true,
      listing: { select: { title: true } },
    },
  });

  let updatedImages = 0;
  let skipped = 0;
  const touchedListings = new Set<string>();

  for (const image of images) {
    const photoPath = extractUnsplashPhotoPath(image.url);
    if (!photoPath || !KNOWN_BAD_PHOTO_PATHS.has(photoPath)) {
      skipped += 1;
      continue;
    }

    const replacement = resolveReplacementPhotoPath(image.listing.title);
    if (!replacement || replacement === photoPath) {
      skipped += 1;
      continue;
    }

    const nextUrl = buildUnsplashUrl(replacement, image.listingId);
    if (!options.dryRun) {
      await prisma.listingImage.update({
        where: { id: image.id },
        data: { url: nextUrl },
      });
    }
    updatedImages += 1;
    touchedListings.add(image.listingId);
  }

  let revalidated = 0;
  const shouldRevalidate = options.revalidateCache !== false && !options.dryRun;
  if (shouldRevalidate) {
    for (const listingId of touchedListings) {
      const ok = await revalidateListingCache(listingId, options);
      if (ok) revalidated += 1;
    }
  }

  return {
    scanned: images.length,
    updatedImages,
    skipped,
    revalidated,
  };
}
