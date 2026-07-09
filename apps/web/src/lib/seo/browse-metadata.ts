import type { Category, ListingSearchFilters } from '@community-marketplace/types';
import type { Metadata } from 'next';

import { APP_NAME } from '@community-marketplace/config';

import { buildBrowseCanonicalPath, buildCategoryCanonicalPath, canonicalMetadata } from '@/lib/seo/canonical';
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER } from '@/lib/seo/og-default';

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === 'string' ? value : undefined;
}

export function buildBrowseMetadata(
  params: Record<string, string | string[] | undefined>,
  categories: Category[] = [],
): Metadata {
  const q = readParam(params, 'q');
  const categoryId = readParam(params, 'categoryId');
  const area = readParam(params, 'area');
  const category = categoryId ? categories.find((item) => item.id === categoryId) : undefined;
  const page = readParam(params, 'page');
  const pageSuffix = page && page !== '1' ? ` – Page ${page}` : '';

  let title = 'Browse listings';
  let description =
    'Discover items from trusted local sellers across Ireland on SellNearby — no commission, community-first marketplace.';

  if (category && q) {
    title = `${category.name}: "${q}"`;
    description = `Search ${category.name.toLowerCase()} listings matching "${q}" from verified local sellers in Ireland.`;
  } else if (category) {
    title = `${category.name} for sale`;
    description =
      category.description?.trim() ||
      `Browse ${category.name.toLowerCase()} for sale from local sellers in your community on ${APP_NAME}.`;
  } else if (q) {
    title = `Search: ${q}`;
    description = `Find "${q}" from trusted sellers near you on ${APP_NAME}.`;
  } else if (area) {
    title = `Listings in ${area}`;
    description = `Browse local listings in ${area} from community sellers on ${APP_NAME}.`;
  }

  return {
    title: `${title}${pageSuffix}`,
    description,
    ...canonicalMetadata(buildBrowseCanonicalPath(params)),
    openGraph: {
      title: `${title}${pageSuffix}`,
      description,
      url: buildBrowseCanonicalPath(params),
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      ...DEFAULT_TWITTER,
      title: `${title}${pageSuffix}`,
      description,
    },
  };
}

export function buildCategoryMetadata(category: Category): Metadata {
  const description =
    category.description?.trim() ||
    `Browse ${category.name.toLowerCase()} for sale from local sellers in Ireland on ${APP_NAME}.`;

  return {
    title: `${category.name} for sale`,
    description,
    ...canonicalMetadata(buildCategoryCanonicalPath(category.slug)),
    openGraph: {
      title: `${category.name} for sale`,
      description,
      url: buildCategoryCanonicalPath(category.slug),
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      ...DEFAULT_TWITTER,
      title: `${category.name} for sale`,
      description,
    },
  };
}

export function buildBrowsePaginationPaths(
  params: Record<string, string | string[] | undefined>,
  totalPages: number,
): { prevPath?: string; nextPath?: string } {
  const pageRaw = params.page;
  const currentPage =
    typeof pageRaw === 'string' && pageRaw !== '1' ? Math.max(1, parseInt(pageRaw, 10) || 1) : 1;

  if (totalPages <= 1) return {};

  const withPage = (page: number) => {
    const nextParams = { ...params, page: String(page) };
    if (page <= 1) {
      const { page: _removed, ...rest } = nextParams;
      return buildBrowseCanonicalPath(rest);
    }
    return buildBrowseCanonicalPath(nextParams);
  };

  return {
    ...(currentPage > 1 ? { prevPath: withPage(currentPage - 1) } : {}),
    ...(currentPage < totalPages ? { nextPath: withPage(currentPage + 1) } : {}),
  };
}

export function filtersToParamsKey(filters: ListingSearchFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.condition) params.set('condition', filters.condition);
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.area) params.set('area', filters.area);
  if (filters.deliveryAvailable) params.set('deliveryAvailable', 'true');
  if (filters.deliveryCollection) params.set('deliveryCollection', 'true');
  if (filters.sellerVerified) params.set('sellerVerified', 'true');
  if (filters.latitude != null) params.set('lat', String(filters.latitude));
  if (filters.longitude != null) params.set('lng', String(filters.longitude));
  if (filters.radiusKm != null) params.set('radiusKm', String(filters.radiusKm));
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  return params.toString();
}
