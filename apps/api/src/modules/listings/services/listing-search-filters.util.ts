import type { ListingSearchFilters, ListingSummary } from '@community-marketplace/types';

function attrString(attrs: ListingSummary['attributes'], key: string): string | undefined {
  const value = attrs?.[key as keyof NonNullable<ListingSummary['attributes']>];
  if (value == null || value === '') return undefined;
  return String(value).toLowerCase();
}

function attrNumber(attrs: ListingSummary['attributes'], key: string): number | undefined {
  const value = attrs?.[key as keyof NonNullable<ListingSummary['attributes']>];
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function textIncludes(haystack: string | undefined, needle: string | undefined): boolean {
  if (!needle?.trim()) return true;
  return (haystack ?? '').toLowerCase().includes(needle.trim().toLowerCase());
}

export function hasExtendedSearchFilters(filters: ListingSearchFilters): boolean {
  return Boolean(
    filters.sellerVerified ||
      filters.sellerBusiness ||
      filters.minSellerRating != null ||
      filters.make ||
      filters.model ||
      filters.minYear != null ||
      filters.maxYear != null ||
      filters.minMileage != null ||
      filters.maxMileage != null ||
      filters.fuelType ||
      filters.transmission ||
      filters.bodyType ||
      filters.engineSize ||
      filters.seats ||
      filters.doors ||
      filters.brand ||
      filters.storage ||
      filters.material ||
      filters.serviceType ||
      filters.clothingSize ||
      filters.gender,
  );
}

export function applyExtendedListingFilters(
  items: ListingSummary[],
  filters: ListingSearchFilters,
): ListingSummary[] {
  return items.filter((item) => {
    if (filters.sellerVerified && !item.sellerVerified) return false;
    if (filters.sellerBusiness === true && !item.sellerBusiness) return false;
    if (filters.sellerBusiness === false && item.sellerBusiness) return false;
    if (filters.minSellerRating != null) {
      if (item.sellerRating == null || item.sellerRating < filters.minSellerRating) return false;
    }

    const attrs = item.attributes;
    if (filters.make && !textIncludes(attrString(attrs, 'make'), filters.make)) return false;
    if (filters.model && !textIncludes(attrString(attrs, 'model'), filters.model)) return false;

    const year = attrNumber(attrs, 'year');
    if (filters.minYear != null && (year == null || year < filters.minYear)) return false;
    if (filters.maxYear != null && (year == null || year > filters.maxYear)) return false;

    const mileage = attrNumber(attrs, 'mileage');
    if (filters.minMileage != null && (mileage == null || mileage < filters.minMileage)) return false;
    if (filters.maxMileage != null && (mileage == null || mileage > filters.maxMileage)) return false;

    if (filters.fuelType && !textIncludes(attrString(attrs, 'fuelType'), filters.fuelType)) {
      return false;
    }
    if (filters.transmission && !textIncludes(attrString(attrs, 'transmission'), filters.transmission)) {
      return false;
    }
    if (filters.bodyType && !textIncludes(attrString(attrs, 'bodyType'), filters.bodyType)) {
      return false;
    }
    if (filters.engineSize) {
      const engine =
        attrString(attrs, 'engineSizeText') ??
        (attrNumber(attrs, 'engineSize') != null ? String(attrNumber(attrs, 'engineSize')) : undefined);
      if (!textIncludes(engine, filters.engineSize)) return false;
    }
    if (filters.seats) {
      const seats =
        attrString(attrs, 'seatsText') ??
        (attrNumber(attrs, 'seats') != null ? String(attrNumber(attrs, 'seats')) : undefined);
      if (!textIncludes(seats, filters.seats)) return false;
    }
    if (filters.doors) {
      const doors =
        attrString(attrs, 'doorsText') ??
        (attrNumber(attrs, 'doors') != null ? String(attrNumber(attrs, 'doors')) : undefined);
      if (!textIncludes(doors, filters.doors)) return false;
    }

    const combined = `${item.title} ${JSON.stringify(attrs ?? {})}`.toLowerCase();
    if (filters.brand && !combined.includes(filters.brand.toLowerCase())) return false;
    if (filters.storage && !combined.includes(filters.storage.toLowerCase())) return false;
    if (filters.material && !combined.includes(filters.material.toLowerCase())) return false;
    if (filters.serviceType && !combined.includes(filters.serviceType.toLowerCase())) return false;
    if (filters.clothingSize && !combined.includes(filters.clothingSize.toLowerCase())) return false;
    if (filters.gender && !combined.includes(filters.gender.toLowerCase())) return false;

    return true;
  });
}

export function applyExtendedListingSort(
  items: ListingSummary[],
  sort: ListingSearchFilters['sort'],
): ListingSummary[] {
  const sorted = [...items];
  switch (sort) {
    case 'price_low_to_high':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price_high_to_low':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'mileage_low_to_high':
      sorted.sort(
        (a, b) =>
          (attrNumber(a.attributes, 'mileage') ?? Number.MAX_SAFE_INTEGER) -
          (attrNumber(b.attributes, 'mileage') ?? Number.MAX_SAFE_INTEGER),
      );
      break;
    case 'mileage_high_to_low':
      sorted.sort(
        (a, b) =>
          (attrNumber(b.attributes, 'mileage') ?? 0) - (attrNumber(a.attributes, 'mileage') ?? 0),
      );
      break;
    case 'year_newest':
      sorted.sort(
        (a, b) =>
          (attrNumber(b.attributes, 'year') ?? 0) - (attrNumber(a.attributes, 'year') ?? 0),
      );
      break;
    case 'year_oldest':
      sorted.sort(
        (a, b) =>
          (attrNumber(a.attributes, 'year') ?? Number.MAX_SAFE_INTEGER) -
          (attrNumber(b.attributes, 'year') ?? Number.MAX_SAFE_INTEGER),
      );
      break;
    case 'highest_rating':
      sorted.sort((a, b) => (b.sellerRating ?? 0) - (a.sellerRating ?? 0));
      break;
    case 'newest':
    default:
      sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
  }
  return sorted;
}

export function paginateItems<T>(items: T[], page: number, limit: number): T[] {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
}
