import type {
  ApiResponse,
  Category,
  FeaturedPlacement,
  ListingSearchFilters,
  ListingSummary,
  PaginatedResult,
} from '@community-marketplace/types';

import { normalizePaginated } from '@/lib/normalize-api-response';
import { WEB_API_ROUTES } from '@/lib/api-routes';

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
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function toSearchQuery(filters: ListingSearchFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.condition) params.set('condition', filters.condition);
  if (filters.deliveryAvailable) params.set('deliveryAvailable', 'true');
  if (filters.deliveryCollection) params.set('deliveryCollection', 'true');
  if (filters.sellerVerified) params.set('sellerVerified', 'true');
  if (filters.area) params.set('area', filters.area);
  if (filters.freeOnly) params.set('freeOnly', 'true');
  if (filters.latitude != null) params.set('latitude', String(filters.latitude));
  if (filters.longitude != null) params.set('longitude', String(filters.longitude));
  if (filters.radiusKm != null) params.set('radiusKm', String(filters.radiusKm));
  if (filters.sort) params.set('sort', filters.sort);
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 12));
  return params.toString();
}

export interface BrowsePageData {
  categories: Category[];
  listings: ListingSummary[];
  meta: { page: number; limit: number; total: number };
}

export async function fetchCategories(): Promise<Category[]> {
  const json = await fetchJson<ApiResponse<Category[]>>(`${WEB_API_ROUTES.public.listings}/categories`);
  return json?.data ?? [];
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await fetchCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

async function fetchFeatured(params: {
  placement: FeaturedPlacement;
  categoryId?: string;
  limit?: number;
}): Promise<ListingSummary[]> {
  const query = new URLSearchParams({
    placement: params.placement,
    limit: String(params.limit ?? 8),
  });
  if (params.categoryId) query.set('categoryId', params.categoryId);

  const json = await fetchJson<ApiResponse<ListingSummary[]>>(
    `${WEB_API_ROUTES.public.featuredListings}?${query.toString()}`,
  );
  return json?.data ?? [];
}

export async function fetchBrowsePage(filters: ListingSearchFilters): Promise<BrowsePageData> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;

  const [categories, searchJson] = await Promise.all([
    fetchCategories(),
    fetchJson<ApiResponse<PaginatedResult<ListingSummary> | ListingSummary[]>>(
      `${WEB_API_ROUTES.public.listingSearch}?${toSearchQuery(filters)}`,
    ),
  ]);

  const result = searchJson
    ? normalizePaginated(searchJson, { page, limit })
    : { data: [], meta: { page, limit, total: 0 } };

  let listings = result.data;

  if (filters.categoryId) {
    const featured = await fetchFeatured({
      placement: 'category',
      categoryId: filters.categoryId,
      limit: 8,
    });
    if (featured.length > 0) {
      const featuredIds = new Set(featured.map((listing) => listing.id));
      listings = [...featured, ...result.data.filter((listing) => !featuredIds.has(listing.id))];
    }
  }

  return {
    categories,
    listings,
    meta: result.meta,
  };
}
