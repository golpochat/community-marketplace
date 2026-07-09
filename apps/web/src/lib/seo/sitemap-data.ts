import type { ApiResponse, Category, ListingSummary, PaginatedResult } from '@community-marketplace/types';
import type { MetadataRoute } from 'next';

import { normalizePaginated } from '@/lib/normalize-api-response';
import { buildListingPath } from '@/lib/listing-slug';
import { getAppUrl } from '@/lib/site-url';

import { STATIC_SITEMAP_PATHS } from './constants';
import { GUIDE_ARTICLES, buildGuidePath } from './content/guides';
import { IRISH_COUNTIES, buildLocalCountyPath } from './content/counties';
import { LISTING_LOCATIONS, buildListingLocationPath } from './content/locations';

const SITEMAP_LISTING_PAGE_SIZE = 100;
const SITEMAP_MAX_LISTING_PAGES = 500;

function getInternalApiBase(): string {
  const internal = process.env.INTERNAL_API_URL;
  if (internal) {
    return internal.endsWith('/api') ? internal : `${internal.replace(/\/$/, '')}/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${getInternalApiBase()}${path}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fetchAllActiveListings(): Promise<ListingSummary[]> {
  const listings: ListingSummary[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (listings.length < total && page <= SITEMAP_MAX_LISTING_PAGES) {
    const json = await fetchJson<ApiResponse<PaginatedResult<ListingSummary> | ListingSummary[]>>(
      `/listings?page=${page}&limit=${SITEMAP_LISTING_PAGE_SIZE}`,
    );
    if (!json) break;

    const batch = normalizePaginated<ListingSummary>(json, {
      page,
      limit: SITEMAP_LISTING_PAGE_SIZE,
    });

    if (batch.data.length === 0) break;

    listings.push(...batch.data);
    total = batch.meta.total;
    page += 1;
  }

  return listings;
}

async function fetchCategories(): Promise<Category[]> {
  const json = await fetchJson<ApiResponse<Category[]>>('/listings/categories');
  return json?.data ?? [];
}

function toSitemapEntry(
  path: string,
  lastModified?: Date,
  changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority?: number,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${getAppUrl()}${path}`,
    lastModified,
    changeFrequency,
    priority,
  };
}

export async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_SITEMAP_PATHS.map((path) =>
    toSitemapEntry(
      path,
      now,
      path === '/' ? 'daily' : 'weekly',
      path === '/' ? 1 : path === '/listings' ? 0.9 : 0.6,
    ),
  );

  const [listings, categories] = await Promise.all([fetchAllActiveListings(), fetchCategories()]);

  for (const location of LISTING_LOCATIONS) {
    entries.push(
      toSitemapEntry(
        buildListingLocationPath(location.slug),
        now,
        'weekly',
        0.75,
      ),
    );
  }

  for (const guide of GUIDE_ARTICLES) {
    entries.push(
      toSitemapEntry(
        buildGuidePath(guide.slug),
        new Date(guide.publishedAt),
        'monthly',
        0.65,
      ),
    );
  }

  for (const county of IRISH_COUNTIES) {
    entries.push(
      toSitemapEntry(
        buildLocalCountyPath(county.slug),
        now,
        'monthly',
        0.6,
      ),
    );
  }

  for (const category of categories) {
    entries.push(
      toSitemapEntry(
        `/categories/${category.slug}`,
        category.updatedAt ? new Date(category.updatedAt) : now,
        'weekly',
        0.7,
      ),
    );
  }

  for (const listing of listings) {
    entries.push(
      toSitemapEntry(
        buildListingPath(listing),
        listing.updatedAt ? new Date(listing.updatedAt) : new Date(listing.createdAt),
        'daily',
        0.8,
      ),
    );
  }

  return entries;
}
