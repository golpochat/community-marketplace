import type { ReadonlyURLSearchParams } from 'next/navigation';

import type { Category, ListingCondition, ListingSearchFilters, ListingSortOption } from '@community-marketplace/types';

function readNumber(params: ReadonlyURLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isNaN(value) ? undefined : value;
}

function readBoolean(params: ReadonlyURLSearchParams, key: string): boolean | undefined {
  const raw = params.get(key);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return undefined;
}

export function parseBrowseFiltersFromParams(
  searchParams: ReadonlyURLSearchParams,
  limit = 12,
): ListingSearchFilters {
  const sellerBusiness = readBoolean(searchParams, 'sellerBusiness');

  return {
    q: searchParams.get('q') ?? undefined,
    categoryId: searchParams.get('categoryId') ?? undefined,
    condition: (searchParams.get('condition') as ListingCondition) || undefined,
    minPrice: readNumber(searchParams, 'minPrice'),
    maxPrice: readNumber(searchParams, 'maxPrice'),
    deliveryAvailable: searchParams.get('deliveryAvailable') === 'true' ? true : undefined,
    deliveryCollection: searchParams.get('deliveryCollection') === 'true' ? true : undefined,
    sellerVerified: searchParams.get('sellerVerified') === 'true' ? true : undefined,
    sellerBusiness,
    minSellerRating: readNumber(searchParams, 'minSellerRating'),
    make: searchParams.get('make') ?? undefined,
    model: searchParams.get('model') ?? undefined,
    minYear: readNumber(searchParams, 'minYear'),
    maxYear: readNumber(searchParams, 'maxYear'),
    minMileage: readNumber(searchParams, 'minMileage'),
    maxMileage: readNumber(searchParams, 'maxMileage'),
    fuelType: searchParams.get('fuelType') ?? undefined,
    transmission: searchParams.get('transmission') ?? undefined,
    bodyType: searchParams.get('bodyType') ?? undefined,
    engineSize: searchParams.get('engineSize') ?? undefined,
    seats: searchParams.get('seats') ?? undefined,
    doors: searchParams.get('doors') ?? undefined,
    brand: searchParams.get('brand') ?? undefined,
    storage: searchParams.get('storage') ?? undefined,
    material: searchParams.get('material') ?? undefined,
    serviceType: searchParams.get('serviceType') ?? undefined,
    clothingSize: searchParams.get('clothingSize') ?? undefined,
    gender: searchParams.get('gender') ?? undefined,
    area: searchParams.get('area') ?? undefined,
    freeOnly: searchParams.get('freeOnly') === 'true' ? true : undefined,
    latitude: readNumber(searchParams, 'lat') ?? readNumber(searchParams, 'latitude'),
    longitude: readNumber(searchParams, 'lng') ?? readNumber(searchParams, 'longitude'),
    radiusKm: readNumber(searchParams, 'radiusKm'),
    sort: (searchParams.get('sort') as ListingSortOption) || 'newest',
    page: readNumber(searchParams, 'page') ?? 1,
    limit,
  };
}

export function serializeBrowseFilters(filters: ListingSearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.condition) params.set('condition', filters.condition);
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.deliveryAvailable) params.set('deliveryAvailable', 'true');
  if (filters.deliveryCollection) params.set('deliveryCollection', 'true');
  if (filters.sellerVerified) params.set('sellerVerified', 'true');
  if (filters.sellerBusiness === true) params.set('sellerBusiness', 'true');
  if (filters.sellerBusiness === false) params.set('sellerBusiness', 'false');
  if (filters.minSellerRating != null) params.set('minSellerRating', String(filters.minSellerRating));
  if (filters.make) params.set('make', filters.make);
  if (filters.model) params.set('model', filters.model);
  if (filters.minYear != null) params.set('minYear', String(filters.minYear));
  if (filters.maxYear != null) params.set('maxYear', String(filters.maxYear));
  if (filters.minMileage != null) params.set('minMileage', String(filters.minMileage));
  if (filters.maxMileage != null) params.set('maxMileage', String(filters.maxMileage));
  if (filters.fuelType) params.set('fuelType', filters.fuelType);
  if (filters.transmission) params.set('transmission', filters.transmission);
  if (filters.bodyType) params.set('bodyType', filters.bodyType);
  if (filters.engineSize) params.set('engineSize', filters.engineSize);
  if (filters.seats) params.set('seats', filters.seats);
  if (filters.doors) params.set('doors', filters.doors);
  if (filters.brand) params.set('brand', filters.brand);
  if (filters.storage) params.set('storage', filters.storage);
  if (filters.material) params.set('material', filters.material);
  if (filters.serviceType) params.set('serviceType', filters.serviceType);
  if (filters.clothingSize) params.set('clothingSize', filters.clothingSize);
  if (filters.gender) params.set('gender', filters.gender);
  if (filters.area) params.set('area', filters.area);
  if (filters.freeOnly) params.set('freeOnly', 'true');
  if (filters.latitude != null) params.set('lat', String(filters.latitude));
  if (filters.longitude != null) params.set('lng', String(filters.longitude));
  if (filters.radiusKm != null) params.set('radiusKm', String(filters.radiusKm));
  if (filters.latitude != null && filters.longitude != null) params.set('local', 'true');
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  return params;
}

export function getActiveCategorySlug(
  categories: Category[],
  categoryId?: string,
): string | undefined {
  if (!categoryId) return undefined;
  return categories.find((c) => c.id === categoryId)?.slug;
}

export function clearCategorySpecificFilters(filters: ListingSearchFilters): ListingSearchFilters {
  return {
    ...filters,
    make: undefined,
    model: undefined,
    minYear: undefined,
    maxYear: undefined,
    minMileage: undefined,
    maxMileage: undefined,
    fuelType: undefined,
    transmission: undefined,
    bodyType: undefined,
    engineSize: undefined,
    seats: undefined,
    doors: undefined,
    brand: undefined,
    storage: undefined,
    material: undefined,
    serviceType: undefined,
    clothingSize: undefined,
    gender: undefined,
    page: 1,
  };
}
