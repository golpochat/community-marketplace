import type { Category, Listing, ListingFeedType, ListingSearchFilters, ListingSummary, PaginatedResult, SellerTrustProfile } from '@community-marketplace/types';
import { paginationSchema } from '@community-marketplace/validation';

import { apiClient } from '@/lib/api-client';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import { normalizePaginated } from '@/lib/normalize-api-response';
import { trustService } from '@/services/trust.service';

function toSearchParams(filters: ListingSearchFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.q) params.q = filters.q;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.minPrice != null) params.minPrice = String(filters.minPrice);
  if (filters.maxPrice != null) params.maxPrice = String(filters.maxPrice);
  if (filters.condition) params.condition = filters.condition;
  if (filters.deliveryAvailable) params.deliveryAvailable = 'true';
  if (filters.deliveryCollection) params.deliveryCollection = 'true';
  if (filters.sellerVerified) params.sellerVerified = 'true';
  if (filters.sellerBusiness === true) params.sellerBusiness = 'true';
  if (filters.sellerBusiness === false) params.sellerBusiness = 'false';
  if (filters.minSellerRating != null) params.minSellerRating = String(filters.minSellerRating);
  if (filters.make) params.make = filters.make;
  if (filters.model) params.model = filters.model;
  if (filters.minYear != null) params.minYear = String(filters.minYear);
  if (filters.maxYear != null) params.maxYear = String(filters.maxYear);
  if (filters.minMileage != null) params.minMileage = String(filters.minMileage);
  if (filters.maxMileage != null) params.maxMileage = String(filters.maxMileage);
  if (filters.fuelType) params.fuelType = filters.fuelType;
  if (filters.transmission) params.transmission = filters.transmission;
  if (filters.bodyType) params.bodyType = filters.bodyType;
  if (filters.engineSize) params.engineSize = filters.engineSize;
  if (filters.seats) params.seats = filters.seats;
  if (filters.doors) params.doors = filters.doors;
  if (filters.brand) params.brand = filters.brand;
  if (filters.storage) params.storage = filters.storage;
  if (filters.material) params.material = filters.material;
  if (filters.serviceType) params.serviceType = filters.serviceType;
  if (filters.clothingSize) params.clothingSize = filters.clothingSize;
  if (filters.gender) params.gender = filters.gender;
  if (filters.area) params.area = filters.area;
  if (filters.freeOnly) params.freeOnly = 'true';
  if (filters.latitude != null) params.latitude = String(filters.latitude);
  if (filters.longitude != null) params.longitude = String(filters.longitude);
  if (filters.radiusKm != null) params.radiusKm = String(filters.radiusKm);
  if (filters.sort) params.sort = filters.sort;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  return params;
}

export const listingsService = {
  async search(filters: ListingSearchFilters = {}): Promise<PaginatedResult<ListingSummary>> {
    const { page = 1, limit = 12 } = paginationSchema.parse({
      page: filters.page ?? 1,
      limit: filters.limit ?? 12,
    });

    try {
      const response = await apiClient<ListingSummary[] | PaginatedResult<ListingSummary>>(
        WEB_API_ROUTES.public.listingSearch,
        {
          params: toSearchParams({ ...filters, page, limit }),
        },
      );
      return normalizePaginated(response, { page, limit });
    } catch {
      return { data: [], meta: { page, limit, total: 0 } };
    }
  },

  async getAll(page = 1, limit = 20): Promise<PaginatedResult<ListingSummary>> {
    const { page: p, limit: l } = paginationSchema.parse({ page, limit });

    try {
      const response = await apiClient<ListingSummary[] | PaginatedResult<ListingSummary>>(
        WEB_API_ROUTES.public.listings,
        {
          params: { page: String(p), limit: String(l) },
        },
      );
      return normalizePaginated(response, { page: p, limit: l });
    } catch {
      return { data: [], meta: { page: p, limit: l, total: 0 } };
    }
  },

  async getById(id: string): Promise<Listing | null> {
    try {
      const response = await apiClient<Listing>(`${WEB_API_ROUTES.public.listings}/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient<Category[]>(`${WEB_API_ROUTES.public.listings}/categories`);
      return response.data ?? [];
    } catch {
      return [];
    }
  },

  async getSimilar(listingId: string, limit = 4): Promise<ListingSummary[]> {
    const listing = await this.getById(listingId);
    if (!listing) return [];

    const result = await this.search({ categoryId: listing.categoryId, limit: limit + 1 });
    return result.data.filter((l) => l.id !== listingId).slice(0, limit);
  },

  async getSellerTrust(sellerId: string): Promise<SellerTrustProfile> {
    try {
      return await trustService.getSellerTrust(sellerId);
    } catch {
      return { sellerId, reviewCount: 0, soldCount: 0 };
    }
  },

  async getFeed(params: {
    feed: ListingFeedType;
    latitude: number;
    longitude: number;
    radiusKm?: number;
    area?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<ListingSummary>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 12;
    try {
      const response = await apiClient<ListingSummary[] | PaginatedResult<ListingSummary>>(
        `${WEB_API_ROUTES.public.listings}/feeds`,
        {
          params: {
            feed: params.feed,
            latitude: String(params.latitude),
            longitude: String(params.longitude),
            radiusKm: String(params.radiusKm ?? 10),
            ...(params.area ? { area: params.area } : {}),
            page: String(page),
            limit: String(limit),
          },
        },
      );
      return normalizePaginated(response, { page, limit });
    } catch {
      return { data: [], meta: { page, limit, total: 0 } };
    }
  },
};
