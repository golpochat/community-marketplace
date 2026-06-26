import type { Category, ListingCondition, ListingSearchFilters, ListingSortOption } from '@community-marketplace/types';
import { formatCurrency, formatListingConditionLabel } from '@community-marketplace/utils';

import { getActiveCategorySlug } from '@/components/listings/browse/browse-url-filters';
import { isVehicleCategory } from '@/lib/vehicle-catalog';

export type DeliveryFilterValue = 'all' | 'available' | 'collection';
export type SellerTypeFilterValue = 'all' | 'private' | 'business';

export const BASE_SORT_OPTIONS: { value: ListingSortOption; label: string; disabled?: boolean }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_low_to_high', label: 'Price: Low → High' },
  { value: 'price_high_to_low', label: 'Price: High → Low' },
  { value: 'highest_rating', label: 'Highest rating' },
];

export const VEHICLE_SORT_OPTIONS: { value: ListingSortOption; label: string }[] = [
  { value: 'mileage_low_to_high', label: 'Lowest mileage' },
  { value: 'mileage_high_to_low', label: 'Highest mileage' },
  { value: 'year_newest', label: 'Newest year' },
  { value: 'year_oldest', label: 'Oldest year' },
];

export const CONDITION_OPTIONS: { value: ListingCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Needs Work' },
];

export const DELIVERY_OPTIONS: { value: DeliveryFilterValue; label: string }[] = [
  { value: 'all', label: 'All delivery options' },
  { value: 'available', label: 'Delivery available' },
  { value: 'collection', label: 'Collection only' },
];

export const SELLER_TYPE_OPTIONS: { value: SellerTypeFilterValue; label: string }[] = [
  { value: 'all', label: 'All sellers' },
  { value: 'private', label: 'Private' },
  { value: 'business', label: 'Business' },
];

export const ELECTRONICS_BRANDS = [
  'Apple',
  'Samsung',
  'Sony',
  'LG',
  'Dell',
  'HP',
  'Lenovo',
  'Microsoft',
  'Google',
  'Other',
] as const;

export const STORAGE_OPTIONS = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB+'] as const;

export const FURNITURE_MATERIALS = [
  'Wood',
  'Metal',
  'Glass',
  'Leather',
  'Fabric',
  'Plastic',
  'Other',
] as const;

export const SERVICE_TYPES = [
  'Cleaning',
  'Gardening',
  'Tutoring',
  'Repairs',
  'Moving',
  'Pet care',
  'Other',
] as const;

export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export const GENDER_OPTIONS = ['Men', 'Women', 'Unisex', 'Kids'] as const;

export function getDeliveryFilter(filters: ListingSearchFilters): DeliveryFilterValue {
  if (filters.deliveryAvailable) return 'available';
  if (filters.deliveryCollection) return 'collection';
  return 'all';
}

export function applyDeliveryFilter(
  filters: ListingSearchFilters,
  delivery: DeliveryFilterValue,
): ListingSearchFilters {
  return {
    ...filters,
    deliveryAvailable: delivery === 'available' ? true : undefined,
    deliveryCollection: delivery === 'collection' ? true : undefined,
    page: 1,
  };
}

export function getSellerTypeFilter(filters: ListingSearchFilters): SellerTypeFilterValue {
  if (filters.sellerBusiness === true) return 'business';
  if (filters.sellerBusiness === false) return 'private';
  return 'all';
}

export function applySellerTypeFilter(
  filters: ListingSearchFilters,
  sellerType: SellerTypeFilterValue,
): ListingSearchFilters {
  return {
    ...filters,
    sellerBusiness:
      sellerType === 'business' ? true : sellerType === 'private' ? false : undefined,
    page: 1,
  };
}

export function formatConditionLabel(condition: ListingCondition): string {
  return formatListingConditionLabel(condition) ?? condition.replace(/_/g, ' ');
}

export function getSortOptionsForCategory(
  categories: Category[],
  categoryId?: string,
): { value: ListingSortOption; label: string; disabled?: boolean }[] {
  const category = categories.find((c) => c.id === categoryId);
  const isVehicle = category ? isVehicleCategory(category) : false;
  return isVehicle ? [...BASE_SORT_OPTIONS, ...VEHICLE_SORT_OPTIONS] : BASE_SORT_OPTIONS;
}

export function getSortLabel(
  sort?: ListingSortOption,
  categories: Category[] = [],
  categoryId?: string,
): string {
  const options = getSortOptionsForCategory(categories, categoryId);
  return options.find((o) => o.value === sort)?.label ?? 'Newest first';
}

export interface ActiveFilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

function pushChip(
  chips: ActiveFilterChip[],
  id: string,
  label: string,
  onRemove: () => void,
): void {
  chips.push({ id, label, onRemove });
}

export function buildActiveFilterChips(
  filters: ListingSearchFilters,
  categories: Category[],
  onChange: (next: ListingSearchFilters) => void,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.q?.trim()) {
    pushChip(chips, 'q', `"${filters.q.trim()}"`, () =>
      onChange({ ...filters, q: undefined, page: 1 }),
    );
  }

  if (filters.categoryId) {
    const name = categories.find((c) => c.id === filters.categoryId)?.name ?? 'Category';
    pushChip(chips, 'category', name, () => onChange({ ...filters, categoryId: undefined, page: 1 }));
  }

  if (filters.condition) {
    pushChip(chips, 'condition', formatConditionLabel(filters.condition), () =>
      onChange({ ...filters, condition: undefined, page: 1 }),
    );
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    const min = filters.minPrice != null ? formatCurrency(filters.minPrice, 'EUR') : '€0';
    const max = filters.maxPrice != null ? formatCurrency(filters.maxPrice, 'EUR') : 'Any';
    pushChip(chips, 'price', `${min}–${max}`, () =>
      onChange({ ...filters, minPrice: undefined, maxPrice: undefined, page: 1 }),
    );
  }

  const delivery = getDeliveryFilter(filters);
  if (delivery === 'available') {
    pushChip(chips, 'delivery', 'Delivery available', () =>
      onChange(applyDeliveryFilter(filters, 'all')),
    );
  }
  if (delivery === 'collection') {
    pushChip(chips, 'delivery', 'Collection only', () =>
      onChange(applyDeliveryFilter(filters, 'all')),
    );
  }

  const sellerType = getSellerTypeFilter(filters);
  if (sellerType === 'business') {
    pushChip(chips, 'sellerType', 'Business sellers', () =>
      onChange(applySellerTypeFilter(filters, 'all')),
    );
  }
  if (sellerType === 'private') {
    pushChip(chips, 'sellerType', 'Private sellers', () =>
      onChange(applySellerTypeFilter(filters, 'all')),
    );
  }

  if (filters.sellerVerified) {
    pushChip(chips, 'sellerVerified', 'Trusted sellers', () =>
      onChange({ ...filters, sellerVerified: undefined, page: 1 }),
    );
  }

  if (filters.minSellerRating != null) {
    pushChip(chips, 'minSellerRating', `${filters.minSellerRating}+ stars`, () =>
      onChange({ ...filters, minSellerRating: undefined, page: 1 }),
    );
  }

  if (filters.make) {
    pushChip(chips, 'make', `Make: ${filters.make}`, () =>
      onChange({ ...filters, make: undefined, page: 1 }),
    );
  }
  if (filters.model) {
    pushChip(chips, 'model', `Model: ${filters.model}`, () =>
      onChange({ ...filters, model: undefined, page: 1 }),
    );
  }
  if (filters.minYear != null || filters.maxYear != null) {
    pushChip(
      chips,
      'year',
      `Year: ${filters.minYear ?? 'Any'}–${filters.maxYear ?? 'Any'}`,
      () => onChange({ ...filters, minYear: undefined, maxYear: undefined, page: 1 }),
    );
  }
  if (filters.minMileage != null || filters.maxMileage != null) {
    pushChip(
      chips,
      'mileage',
      `Mileage: ${filters.minMileage?.toLocaleString() ?? '0'}–${filters.maxMileage?.toLocaleString() ?? 'Any'} km`,
      () => onChange({ ...filters, minMileage: undefined, maxMileage: undefined, page: 1 }),
    );
  }
  if (filters.fuelType) {
    pushChip(chips, 'fuelType', filters.fuelType, () =>
      onChange({ ...filters, fuelType: undefined, page: 1 }),
    );
  }
  if (filters.transmission) {
    pushChip(chips, 'transmission', filters.transmission, () =>
      onChange({ ...filters, transmission: undefined, page: 1 }),
    );
  }
  if (filters.bodyType) {
    pushChip(chips, 'bodyType', filters.bodyType, () =>
      onChange({ ...filters, bodyType: undefined, page: 1 }),
    );
  }
  if (filters.engineSize) {
    pushChip(chips, 'engineSize', `Engine: ${filters.engineSize}`, () =>
      onChange({ ...filters, engineSize: undefined, page: 1 }),
    );
  }
  if (filters.seats) {
    pushChip(chips, 'seats', `${filters.seats} seats`, () =>
      onChange({ ...filters, seats: undefined, page: 1 }),
    );
  }
  if (filters.doors) {
    pushChip(chips, 'doors', `${filters.doors} doors`, () =>
      onChange({ ...filters, doors: undefined, page: 1 }),
    );
  }
  if (filters.brand) {
    pushChip(chips, 'brand', `Brand: ${filters.brand}`, () =>
      onChange({ ...filters, brand: undefined, page: 1 }),
    );
  }
  if (filters.storage) {
    pushChip(chips, 'storage', filters.storage, () =>
      onChange({ ...filters, storage: undefined, page: 1 }),
    );
  }
  if (filters.material) {
    pushChip(chips, 'material', filters.material, () =>
      onChange({ ...filters, material: undefined, page: 1 }),
    );
  }
  if (filters.serviceType) {
    pushChip(chips, 'serviceType', filters.serviceType, () =>
      onChange({ ...filters, serviceType: undefined, page: 1 }),
    );
  }
  if (filters.clothingSize) {
    pushChip(chips, 'clothingSize', `Size: ${filters.clothingSize}`, () =>
      onChange({ ...filters, clothingSize: undefined, page: 1 }),
    );
  }
  if (filters.gender) {
    pushChip(chips, 'gender', filters.gender, () =>
      onChange({ ...filters, gender: undefined, page: 1 }),
    );
  }

  if (filters.sort && filters.sort !== 'newest') {
    pushChip(chips, 'sort', getSortLabel(filters.sort, categories, filters.categoryId), () =>
      onChange({ ...filters, sort: 'newest', page: 1 }),
    );
  }

  return chips;
}

export function hasActiveFilters(filters: ListingSearchFilters): boolean {
  return buildActiveFilterChips(filters, [], () => undefined).length > 0;
}

export function resetBrowseFilters(limit = 12): ListingSearchFilters {
  return { sort: 'newest', page: 1, limit };
}

export function isVehicleBrowseCategory(categories: Category[], categoryId?: string): boolean {
  const category = categories.find((c) => c.id === categoryId);
  return category ? isVehicleCategory(category) : false;
}

export function getCategoryFilterSlug(categories: Category[], categoryId?: string): string | undefined {
  return getActiveCategorySlug(categories, categoryId);
}
