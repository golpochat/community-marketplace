'use client';

import type { ListingSummary } from '@community-marketplace/types';
import {
  formatEngineSizeLitres,
  resolveVehicleEngineSizeDisplay,
  resolveVehicleYearDisplay,
} from '@community-marketplace/utils';

import { isVehicleCategory } from '@/lib/vehicle-catalog';
import { SellerRatingDisplay } from '@/components/trust/seller-rating-display';
import { SellerTrustBadges } from '@/components/trust/seller-trust-badges';

interface VehicleListingMetaProps {
  listing: ListingSummary;
  variant?: 'grid' | 'list';
  showTrust?: boolean;
}

function formatMileage(mileage: number, unit?: 'km' | 'mi'): string {
  const formatted = mileage.toLocaleString('en-IE');
  return unit === 'mi' ? `${formatted} mi` : `${formatted} km`;
}

export function VehicleListingMeta({
  listing,
  variant = 'grid',
  showTrust = true,
}: VehicleListingMetaProps) {
  const category = listing.categorySlug
    ? { slug: listing.categorySlug }
    : { slug: undefined, name: undefined };
  if (!isVehicleCategory(category)) return null;

  const attrs = listing.attributes;
  const year = attrs ? resolveVehicleYearDisplay(attrs) : undefined;
  const engine = attrs
    ? resolveVehicleEngineSizeDisplay(attrs) ?? formatEngineSizeLitres(attrs.engineSize)
    : undefined;
  const mileage =
    attrs?.mileage != null ? formatMileage(attrs.mileage, attrs.mileageUnit) : undefined;

  const items = [year, mileage, engine, attrs?.fuelType, attrs?.transmission, attrs?.bodyType].filter(
    Boolean,
  );

  const hasTrust =
    showTrust &&
    (listing.sellerVerified ||
      listing.sellerRating != null ||
      (listing.sellerReviewCount ?? 0) > 0);

  if (items.length === 0 && !hasTrust) return null;

  const isList = variant === 'list';

  return (
    <div className={isList ? 'space-y-2' : 'space-y-1.5'}>
      {items.length > 0 && (
        <p className={isList ? 'text-sm text-muted-foreground' : 'line-clamp-2 text-xs text-muted-foreground'}>
          {items.join(' · ')}
        </p>
      )}

      {showTrust && (
        <>
          <SellerRatingDisplay
            averageRating={listing.sellerRating}
            reviewCount={listing.sellerReviewCount}
          />
          <SellerTrustBadges
            variant="compact"
            verified={listing.sellerVerified}
            soldCount={listing.sellerSoldCount}
            averageRating={listing.sellerRating}
            reviewCount={listing.sellerReviewCount}
          />
        </>
      )}
    </div>
  );
}

export function isVehicleListingSummary(listing: ListingSummary): boolean {
  if (listing.categorySlug) {
    return isVehicleCategory({ slug: listing.categorySlug });
  }
  return Boolean(listing.attributes && (listing.attributes.make || listing.attributes.year));
}
