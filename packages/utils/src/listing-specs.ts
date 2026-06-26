import type { Listing, ListingVehicleAttributes } from '@community-marketplace/types';

import { compactVehicleAttributes, hasVehicleAttributeValue } from './vehicle-attributes';

const YEAR_PATTERN = /\b(19|20)\d{2}\b/;
const MILEAGE_PATTERN = /(\d[\d,.\s]*)\s*(km|kms|kilometres?|kilometers?|mi|miles?)\b/i;

const FUEL_KEYWORDS: Record<string, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
  electric: 'Electric',
  phev: 'Plug-in Hybrid',
};

const TRANSMISSION_KEYWORDS: Record<string, string> = {
  automatic: 'Automatic',
  manual: 'Manual',
  cvt: 'CVT',
};

function isVehicleListing(listing: Listing): boolean {
  const slug = listing.category?.slug?.toLowerCase();
  if (slug === 'vehicles') return true;
  const name = listing.category?.name?.toLowerCase() ?? '';
  return name.includes('vehicle') || name.includes('car') || name.includes('motor');
}

function inferFromText(listing: Listing): ListingVehicleAttributes {
  const combined = `${listing.title}\n${listing.description}`;
  const yearMatch = listing.title.match(YEAR_PATTERN);
  const mileageMatch = combined.match(MILEAGE_PATTERN);

  const specs: ListingVehicleAttributes = {};
  if (yearMatch) specs.year = Number(yearMatch[0]);
  if (mileageMatch?.[1]) {
    specs.mileage = Number(mileageMatch[1].replace(/[,\s]/g, ''));
    specs.mileageUnit = mileageMatch[2]?.toLowerCase().startsWith('mi') ? 'mi' : 'km';
  }

  for (const [keyword, label] of Object.entries(FUEL_KEYWORDS)) {
    if (new RegExp(`\\b${keyword}\\b`, 'i').test(combined)) {
      specs.fuelType = label;
      break;
    }
  }
  for (const [keyword, label] of Object.entries(TRANSMISSION_KEYWORDS)) {
    if (new RegExp(`\\b${keyword}\\b`, 'i').test(combined)) {
      specs.transmission = label;
      break;
    }
  }

  specs.isHybrid = /\bhybrid\b/i.test(combined);
  return compactVehicleAttributes(specs);
}

/** Resolve structured vehicle specs from stored attributes or legacy text inference. */
export function resolveListingVehicleSpecs(listing: Listing): ListingVehicleAttributes | null {
  if (listing.attributes && Object.keys(listing.attributes).length > 0) {
    const compact = compactVehicleAttributes(listing.attributes);
    return Object.keys(compact).length > 0 ? compact : null;
  }

  if (!isVehicleListing(listing)) return null;
  const inferred = inferFromText(listing);
  return Object.keys(inferred).length > 0 ? inferred : null;
}

export function listingIsHybrid(listing: Listing): boolean {
  const specs = resolveListingVehicleSpecs(listing);
  if (!specs) return false;
  if (specs.isHybrid) return true;
  const fuel = specs.fuelType?.toLowerCase() ?? '';
  return fuel.includes('hybrid') || fuel.includes('plug-in');
}

export function vehicleSpecsHasAnyField(
  specs: ListingVehicleAttributes,
  keys: Array<keyof ListingVehicleAttributes>,
): boolean {
  return keys.some((key) => hasVehicleAttributeValue(specs[key]));
}
