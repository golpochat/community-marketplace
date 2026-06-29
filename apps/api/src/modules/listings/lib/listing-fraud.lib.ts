import {
  parseVehicleAttributes,
  stripVehicleTitleSuffix,
  vehicleUnitsLikelyMatch,
} from '@community-marketplace/utils';

const HIGH_VALUE_PATTERN =
  /\b(iphone|macbook|laptop|ps5|xbox|rolex|watch|mercedes|bmw|audi|tesla|vehicle|car|van|camera|ipad|samsung galaxy)\b/i;

const NEW_SELLER_DAILY_LISTING_LIMIT = 5;
const NEW_SELLER_ACCOUNT_DAYS = 30;

export interface FraudCheckListingSnapshot {
  title: string;
  attributes?: unknown;
}

export interface FraudCheckInput {
  title: string;
  price: number;
  recentListings: FraudCheckListingSnapshot[];
  attributes?: unknown;
}

export function detectListingFraudSignals(input: FraudCheckInput): {
  requiresReview: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const normalizedTitle = stripVehicleTitleSuffix(input.title).trim().toLowerCase();
  const currentAttrs = parseVehicleAttributes(input.attributes);

  if (input.price > 0 && input.price < 50 && HIGH_VALUE_PATTERN.test(input.title)) {
    reasons.push('Price unusually low for a high-value item');
  }

  const duplicateListings = input.recentListings.filter((listing) => {
    const recentTitle = stripVehicleTitleSuffix(listing.title).trim().toLowerCase();
    if (recentTitle !== normalizedTitle) return false;
    return vehicleUnitsLikelyMatch(
      currentAttrs,
      parseVehicleAttributes(listing.attributes),
    );
  });

  if (duplicateListings.length >= 1) {
    reasons.push('Repeated listing with no clear difference between vehicles');
  }

  return { requiresReview: reasons.length > 0, reasons };
}

export function isNewSellerAccount(createdAt: Date): boolean {
  const ageMs = Date.now() - createdAt.getTime();
  return ageMs < NEW_SELLER_ACCOUNT_DAYS * 24 * 60 * 60 * 1000;
}

export { NEW_SELLER_DAILY_LISTING_LIMIT };
