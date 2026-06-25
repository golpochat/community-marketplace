const DEV_ASSET_CACHE_VERSION = '2';

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

/** Ensures listing image URLs load in the browser (same-origin proxy in dev). */
export function resolveListingImageSrc(url: string): string {
  const proxied = devUploadSrcFromUrl(url);
  if (proxied) {
    return proxied;
  }

  if (!url.includes('/api/dev-upload')) {
    return url;
  }
  if (url.includes('_v=')) {
    return url;
  }
  return `${url}${url.includes('?') ? '&' : '?'}_v=${DEV_ASSET_CACHE_VERSION}`;
}
