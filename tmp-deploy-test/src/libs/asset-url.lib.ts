const PRODUCTION_ASSET_HOSTS = new Set([
  'assets.community.marketplace',
  'assets.community.market',
]);

export function isR2Configured(): boolean {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint =
    process.env.R2_ENDPOINT ??
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
  return Boolean(accountId && accessKeyId && secretAccessKey && endpoint);
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

export function extractStorageKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url, 'http://localhost');
    const keyParam = parsed.searchParams.get('key');
    if (keyParam) return keyParam;

    if (PRODUCTION_ASSET_HOSTS.has(parsed.hostname)) {
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

/** Rewrites stored production asset URLs to local dev-upload URLs when R2 is not configured. */
export function resolveAssetPublicUrl(storedUrl: string): string {
  if (!storedUrl || isR2Configured()) {
    return storedUrl;
  }

  const key = extractStorageKeyFromUrl(storedUrl);
  if (!key) {
    return storedUrl;
  }

  return buildDevUploadUrl(key);
}
