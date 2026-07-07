const DEV_ASSET_CACHE_VERSION = '3';

export type ListingImageVariant = 'full' | 'card' | 'thumb' | 'tiny';

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

/** Ordered URLs to try when a variant fails to load (e.g. missing processed crop). */
export function listingImageFallbackChain(
  image: ListingImageLike,
  variant: ListingImageVariant,
): string[] {
  const chain: string[] = [];
  const push = (value: string) => {
    if (!chain.includes(value)) chain.push(value);
  };

  if (variant === 'thumb') {
    push(listingImageSrcForVariant(image, 'thumb'));
    push(listingImageSrcForVariant(image, 'card'));
    push(listingImageSrcForVariant(image, 'full'));
  } else if (variant === 'card') {
    push(listingImageSrcForVariant(image, 'card'));
    push(listingImageSrcForVariant(image, 'full'));
  } else {
    push(listingImageSrcForVariant(image, 'full'));
  }

  push(resolveListingImageSrc(image.url));
  return chain;
}

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
  if (variant === 'full') {
    return resolveListingImageSrc(url, VARIANT_WIDTHS.full);
  }

  const [pathPart, query = ''] = url.split('?');
  if (pathPart.endsWith('.webp')) {
    const base = pathPart.slice(0, -5);
    const suffixMap: Record<Exclude<ListingImageVariant, 'full'>, string> = {
      card: '-card.webp',
      thumb: '-thumb.webp',
      tiny: '-tiny.webp',
    };
    const suffix = suffixMap[variant];
    return resolveListingImageSrc(
      `${base}${suffix}${query ? `?${query}` : ''}`,
      VARIANT_WIDTHS[variant],
    );
  }

  return resolveListingImageSrc(url, VARIANT_WIDTHS[variant]);
}
