import type { Metadata } from 'next';

import { getAppUrl } from '@/lib/site-url';

import { buildListingPath } from '@/lib/listing-slug';
import { DEFAULT_OPEN_GRAPH, DEFAULT_TWITTER } from '@/lib/seo/og-default';

/** Build absolute canonical URL for Open Graph and explicit canonical tags. */
export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getAppUrl()}${normalized}`;
}

/** Relative path canonical — resolved via metadataBase in root layout. */
export function canonicalMetadata(path: string): Pick<Metadata, 'alternates'> {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return { alternates: { canonical: normalized } };
}

export function publicPageMetadata(options: {
  title: string;
  description?: string;
  path: string;
}): Metadata {
  return {
    title: options.title,
    ...(options.description ? { description: options.description } : {}),
    ...canonicalMetadata(options.path),
    openGraph: {
      ...DEFAULT_OPEN_GRAPH,
      title: options.title,
      ...(options.description ? { description: options.description } : {}),
      url: options.path,
    },
    twitter: {
      ...DEFAULT_TWITTER,
      title: options.title,
      ...(options.description ? { description: options.description } : {}),
    },
  };
}

/**
 * Browse pages: canonical includes meaningful filters but drops default sort and page=1.
 * Pagination pages keep page param so each page is self-canonical.
 */
export function buildBrowseCanonicalPath(
  params: Record<string, string | string[] | undefined>,
): string {
  const canonical = new URLSearchParams();

  const set = (key: string) => {
    const value = params[key];
    if (typeof value === 'string' && value.length > 0) canonical.set(key, value);
  };

  set('q');
  set('categoryId');
  set('condition');
  set('minPrice');
  set('maxPrice');
  set('area');
  set('make');
  set('model');
  set('brand');
  if (params.deliveryAvailable === 'true') canonical.set('deliveryAvailable', 'true');
  if (params.deliveryCollection === 'true') canonical.set('deliveryCollection', 'true');
  if (params.sellerVerified === 'true') canonical.set('sellerVerified', 'true');
  if (params.freeOnly === 'true') canonical.set('freeOnly', 'true');
  if (params.lat) canonical.set('lat', String(params.lat));
  if (params.lng) canonical.set('lng', String(params.lng));
  if (params.latitude) canonical.set('lat', String(params.latitude));
  if (params.longitude) canonical.set('lng', String(params.longitude));
  if (params.radiusKm) canonical.set('radiusKm', String(params.radiusKm));
  if (params.local === 'true') canonical.set('local', 'true');

  const sort = params.sort;
  if (typeof sort === 'string' && sort !== 'newest') canonical.set('sort', sort);

  const page = params.page;
  if (typeof page === 'string' && page !== '1') canonical.set('page', page);

  const query = canonical.toString();
  return query ? `/listings?${query}` : '/listings';
}

export function buildCategoryCanonicalPath(slug: string): string {
  return `/categories/${encodeURIComponent(slug)}`;
}

export function buildStoreCanonicalPath(slug: string): string {
  return `/store/${encodeURIComponent(slug)}`;
}

export function buildListingCanonicalPath(listing: { id: string; title: string }): string {
  return buildListingPath(listing);
}
