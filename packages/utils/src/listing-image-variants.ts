export type ListingImageVariant = 'full' | 'card' | 'thumb' | 'tiny';

export interface ListingImageVariantUrls {
  url: string;
  cardUrl?: string;
  thumbUrl?: string;
  tinyUrl?: string;
}

const VARIANT_SUFFIX: Record<Exclude<ListingImageVariant, 'full'>, string> = {
  card: '-card.webp',
  thumb: '-thumb.webp',
  tiny: '-tiny.webp',
};

/** Strip `.webp` and any `-card|-thumb|-tiny` variant suffix to get the image stem. */
export function stripListingWebpVariantStem(pathPart: string): string {
  if (!pathPart.endsWith('.webp')) return pathPart;
  const withoutExt = pathPart.slice(0, -5);
  if (withoutExt.endsWith('-card')) return withoutExt.slice(0, -5);
  if (withoutExt.endsWith('-thumb')) return withoutExt.slice(0, -6);
  if (withoutExt.endsWith('-tiny')) return withoutExt.slice(0, -5);
  return withoutExt;
}

/** Build full/card/thumb/tiny URLs from any listing image URL (base or variant). */
export function buildListingImageVariantUrls(resolvedUrl: string): ListingImageVariantUrls {
  const parts = resolvedUrl.split('?');
  const pathPart = parts[0] ?? resolvedUrl;
  const query = parts[1];
  if (!pathPart.endsWith('.webp')) {
    return { url: resolvedUrl };
  }

  const suffix = query ? `?${query}` : '';
  const stem = stripListingWebpVariantStem(pathPart);
  return {
    url: `${stem}.webp${suffix}`,
    cardUrl: `${stem}-card.webp${suffix}`,
    thumbUrl: `${stem}-thumb.webp${suffix}`,
    tinyUrl: `${stem}-tiny.webp${suffix}`,
  };
}

/** Resolve a listing image URL to a specific variant path (idempotent when already correct). */
export function resolveListingImageVariantPath(
  url: string,
  variant: ListingImageVariant,
): string {
  const [rawPathPart, query = ''] = url.split('?');
  const pathPart = rawPathPart ?? url;

  if (variant === 'full') {
    if (!pathPart.endsWith('.webp')) return url;
    const stem = stripListingWebpVariantStem(pathPart);
    return `${stem}.webp${query ? `?${query}` : ''}`;
  }

  if (!pathPart.endsWith('.webp')) return url;

  const targetSuffix = VARIANT_SUFFIX[variant];
  if (pathPart.endsWith(targetSuffix)) {
    return url;
  }

  const stem = stripListingWebpVariantStem(pathPart);
  return `${stem}${targetSuffix}${query ? `?${query}` : ''}`;
}
