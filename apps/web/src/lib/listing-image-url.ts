import type { ListingImageVariant } from '@community-marketplace/utils';
import {
  buildListingImageVariantUrls,
  resolveListingImageVariantPath,
} from '@community-marketplace/utils';

export type { ListingImageVariant };

const DEV_ASSET_CACHE_VERSION = '3';

const PRODUCTION_ASSET_HOSTS = new Set([
  'assets.community.marketplace',
  'assets.community.market',
  'assets.sellnearby.ie',
]);

function isR2PublicHost(hostname: string): boolean {
  return hostname.endsWith('.r2.dev') || PRODUCTION_ASSET_HOSTS.has(hostname);
}

const VARIANT_WIDTHS: Record<ListingImageVariant, number> = {
  full: 1600,
  card: 800,
  thumb: 400,
  tiny: 200,
};

export type ListingImageLike = {
  url: string;
  cardUrl?: string;
  thumbUrl?: string;
  tinyUrl?: string;
};

function isR2PublicAssetUrl(url: string): boolean {
  try {
    return isR2PublicHost(new URL(url).hostname);
  } catch {
    return false;
  }
}

function devUploadSrcFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url, 'http://localhost');
    if (!parsed.pathname.includes('/api/dev-upload')) {
      return null;
    }
    const key = parsed.searchParams.get('key');
    if (!key) {
      return null;
    }
    const params = new URLSearchParams({ key, _v: DEV_ASSET_CACHE_VERSION });
    return `/api/dev-upload?${params.toString()}`;
  } catch {
    return null;
  }
}

function isProcessedWebp(url: string): boolean {
  return (
    /\.webp($|\?)/i.test(url) ||
    url.includes('-card.webp') ||
    url.includes('-thumb.webp') ||
    url.includes('-tiny.webp')
  );
}

/** Ensures listing image URLs load in the browser (same-origin proxy in dev). */
export function resolveListingImageSrc(url: string, width = 800): string {
  const proxied = devUploadSrcFromUrl(url);
  if (proxied) {
    return proxied;
  }

  if (isProcessedWebp(url) || isR2PublicAssetUrl(url)) {
    return url;
  }

  if (!url.includes('/api/dev-upload')) {
    if (url.includes('format=webp') || url.includes('width=')) {
      return url;
    }
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}format=webp&width=${width}&quality=82`;
  }
  if (url.includes('_v=')) {
    return url;
  }
  return `${url}${url.includes('?') ? '&' : '?'}_v=${DEV_ASSET_CACHE_VERSION}`;
}

export function listingImageVariantUrl(
  url: string | undefined,
  variant: ListingImageVariant = 'full',
): string | undefined {
  if (!url) return undefined;
  const variantPath = resolveListingImageVariantPath(url, variant);
  return resolveListingImageSrc(variantPath, VARIANT_WIDTHS[variant]);
}

export function listingImageSrcForVariant(
  image: ListingImageLike,
  variant: ListingImageVariant,
): string {
  const direct =
    variant === 'card'
      ? image.cardUrl
      : variant === 'thumb'
        ? image.thumbUrl
        : variant === 'tiny'
          ? image.tinyUrl
          : undefined;
  const url = direct ?? listingImageVariantUrl(image.url, variant) ?? image.url;
  return resolveListingImageSrc(url, VARIANT_WIDTHS[variant]);
}

function pushUnique(chain: string[], value: string | undefined) {
  if (value && !chain.includes(value)) chain.push(value);
}

/** Fallback URLs for full ListingImage objects (detail pages, seller forms). */
export function listingImageFallbackChain(
  image: ListingImageLike,
  variant: ListingImageVariant,
): string[] {
  const chain: string[] = [];

  if (variant === 'tiny') {
    pushUnique(chain, listingImageSrcForVariant(image, 'tiny'));
    pushUnique(chain, listingImageSrcForVariant(image, 'thumb'));
    pushUnique(chain, listingImageSrcForVariant(image, 'card'));
    pushUnique(chain, listingImageSrcForVariant(image, 'full'));
  } else if (variant === 'thumb') {
    pushUnique(chain, listingImageSrcForVariant(image, 'thumb'));
    pushUnique(chain, listingImageSrcForVariant(image, 'card'));
    pushUnique(chain, listingImageSrcForVariant(image, 'full'));
  } else if (variant === 'card') {
    pushUnique(chain, listingImageSrcForVariant(image, 'card'));
    pushUnique(chain, listingImageSrcForVariant(image, 'full'));
  } else {
    pushUnique(chain, listingImageSrcForVariant(image, 'full'));
  }

  pushUnique(chain, resolveListingImageSrc(image.url));
  return chain;
}

/** Fallback URLs for ListingSummary.imageUrl (browse cards, similar listings, chat). */
export function listingSummaryImageFallbackChain(
  imageUrl: string | undefined,
  variant: ListingImageVariant,
): string[] {
  if (!imageUrl) return [];

  const variants = buildListingImageVariantUrls(imageUrl);
  const asImage: ListingImageLike = {
    url: variants.url,
    cardUrl: variants.cardUrl,
    thumbUrl: variants.thumbUrl,
    tinyUrl: variants.tinyUrl,
  };

  return listingImageFallbackChain(asImage, variant);
}
