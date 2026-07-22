import type { Category, ListingSearchFilters } from '@community-marketplace/types';
import type { Metadata } from 'next';

import { APP_NAME } from '@community-marketplace/config';

import { filtersToParamsKey as buildFiltersParamsKey } from '@/components/listings/browse/browse-url-filters';
import { buildBrowseCanonicalPath, canonicalMetadata } from '@/lib/seo/canonical';
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER } from '@/lib/seo/og-default';

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === 'string' ? value : undefined;
}

function resolveCategoryFromParams(
  params: Record<string, string | string[] | undefined>,
  categories: Category[],
): Category | undefined {
  const slug = readParam(params, 'category');
  if (slug) {
    return categories.find((item) => item.slug === slug);
  }
  const categoryId = readParam(params, 'categoryId');
  if (categoryId) {
    return categories.find((item) => item.id === categoryId);
  }
  return undefined;
}

export function buildBrowseMetadata(
  params: Record<string, string | string[] | undefined>,
  categories: Category[] = [],
): Metadata {
  const q = readParam(params, 'q');
  const area = readParam(params, 'area');
  const category = resolveCategoryFromParams(params, categories);
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

  const canonicalParams = { ...params };
  if (category && !readParam(canonicalParams, 'category')) {
    canonicalParams.category = category.slug;
  }
  delete canonicalParams.categoryId;

  return {
    title: `${title}${pageSuffix}`,
    description,
    ...canonicalMetadata(buildBrowseCanonicalPath(canonicalParams)),
    openGraph: {
      title: `${title}${pageSuffix}`,
      description,
      url: buildBrowseCanonicalPath(canonicalParams),
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      ...DEFAULT_TWITTER,
      title: `${title}${pageSuffix}`,
      description,
    },
  };
}

export function buildCategoryMetadata(
  category: Category,
  params: Record<string, string | string[] | undefined> = {},
): Metadata {
  const description =
    category.description?.trim() ||
    `Browse ${category.name.toLowerCase()} for sale from local sellers in Ireland on ${APP_NAME}.`;
  const page = readParam(params, 'page');
  const pageSuffix = page && page !== '1' ? ` – Page ${page}` : '';
  const canonical = buildBrowseCanonicalPath({ ...params, category: category.slug });

  return {
    title: `${category.name} for sale${pageSuffix}`,
    description,
    ...canonicalMetadata(canonical),
    openGraph: {
      title: `${category.name} for sale${pageSuffix}`,
      description,
      url: canonical,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      ...DEFAULT_TWITTER,
      title: `${category.name} for sale${pageSuffix}`,
      description,
    },
  };
}

export function buildBrowsePaginationPaths(
  params: Record<string, string | string[] | undefined>,
  totalPages: number,
  categories: Category[] = [],
): { prevPath?: string; nextPath?: string } {
  const pageRaw = params.page;
  const currentPage =
    typeof pageRaw === 'string' && pageRaw !== '1' ? Math.max(1, parseInt(pageRaw, 10) || 1) : 1;

  if (totalPages <= 1) return {};

  const category = resolveCategoryFromParams(params, categories);
  const baseParams = { ...params };
  if (category) baseParams.category = category.slug;
  delete baseParams.categoryId;

  const withPage = (page: number) => {
    const nextParams = { ...baseParams, page: String(page) };
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

export function filtersToParamsKey(
  filters: ListingSearchFilters,
  categories: Category[] = [],
): string {
  return buildFiltersParamsKey(filters, categories);
}
