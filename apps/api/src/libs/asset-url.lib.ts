const PRODUCTION_ASSET_HOSTS = new Set([
  'assets.community.marketplace',
  'assets.community.market',
  'assets.sellnearby.ie',
]);

function isR2PublicHost(hostname: string): boolean {
  return hostname.endsWith('.r2.dev') || PRODUCTION_ASSET_HOSTS.has(hostname);
}

export function isR2Configured(): boolean {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint =
    process.env.R2_ENDPOINT ??
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
  return Boolean(accountId && accessKeyId && secretAccessKey && endpoint);
}

export function getR2PublicBaseUrl(): string {
  return (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
}

export function buildR2PublicUrl(key: string): string {
  const base = getR2PublicBaseUrl();
  const normalizedKey = key.replace(/^\//, '');
  if (!base) {
    return normalizedKey;
  }
  return `${base}/${normalizedKey}`;
}

/** Maps an uploaded object key to the processed full-size WebP variant key. */
export function toProcessedWebpKey(key: string): string {
  if (/\.webp$/i.test(key)) {
    return key;
  }
  const lastSlash = key.lastIndexOf('/');
  const dir = lastSlash >= 0 ? key.slice(0, lastSlash + 1) : '';
  const file = lastSlash >= 0 ? key.slice(lastSlash + 1) : key;
  const dot = file.lastIndexOf('.');
  const stem = dot > 0 ? file.slice(0, dot) : file;
  return `${dir}${stem}.webp`;
}

function devAssetBaseUrl(): string {
  const port = process.env.PORT ?? '4000';
  return (process.env.API_PUBLIC_URL ?? `http://localhost:${port}`).replace(/\/$/, '');
}

/** Bump when dev asset delivery changes so browsers drop stale cached responses. */
const DEV_ASSET_CACHE_VERSION = '2';

export function buildDevUploadUrl(key: string): string {
  const base = `${devAssetBaseUrl()}/api/dev-upload?key=${encodeURIComponent(key)}`;
  if (process.env.NODE_ENV === 'development') {
    return `${base}&_v=${DEV_ASSET_CACHE_VERSION}`;
  }
  return base;
}

function isDevUploadPublicUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'http://localhost');
    return parsed.pathname.includes('/api/dev-upload');
  } catch {
    return false;
  }
}

export function extractStorageKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url, 'http://localhost');
    const keyParam = parsed.searchParams.get('key');
    if (keyParam) return keyParam;

    if (isR2PublicHost(parsed.hostname)) {
      const path = parsed.pathname.replace(/^\//, '');
      return path || null;
    }

    if (parsed.pathname.includes('/api/dev-upload')) {
      return parsed.searchParams.get('key');
    }
  } catch {
    if (url.startsWith('listing-images/') || url.startsWith('user-avatars/')) {
      return url;
    }
  }
  return null;
}

/**
 * Normalizes stored asset URLs for the active storage backend.
 * - R2 enabled: legacy dev-upload / wrong-host URLs → current R2_PUBLIC_URL
 * - R2 disabled: R2 / storage-key URLs → same-origin dev-upload proxy
 */
export function resolveAssetPublicUrl(storedUrl: string): string {
  if (!storedUrl) {
    return storedUrl;
  }

  const key = extractStorageKeyFromUrl(storedUrl);
  if (!key) {
    return storedUrl;
  }

  if (isR2Configured()) {
    const publicBase = getR2PublicBaseUrl();
    if (!publicBase) {
      return storedUrl;
    }

    if (isDevUploadPublicUrl(storedUrl) || !storedUrl.includes('://')) {
      return buildR2PublicUrl(toProcessedWebpKey(key));
    }

    try {
      const parsed = new URL(storedUrl);
      if (isR2PublicHost(parsed.hostname)) {
        const configuredHost = new URL(publicBase).hostname;
        if (parsed.hostname !== configuredHost) {
          return buildR2PublicUrl(key);
        }
      }
    } catch {
      return storedUrl;
    }

    return storedUrl;
  }

  return buildDevUploadUrl(key);
}
