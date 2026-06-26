'use client';

import Link from 'next/link';

import type { ListingSummary } from '@community-marketplace/types';
import {
  formatJustListedLabel,
  formatListingConditionLabel,
  formatLocationLabel,
  isFreshListing,
  isFreeListingPrice,
  resolveListingListedAt,
} from '@community-marketplace/utils';
import { MapPin, MessageSquare, ShieldCheck } from 'lucide-react';

import { DealBlock } from '@/components/listings/deal-block';
import { ListingBadge } from '@/components/listings/listing-badge';
import { SaveButton } from '@/components/listings/save-button';
import { ShareListingButton } from '@/components/listings/ShareListingButton';
import { SaleBadgeOverlay } from '@/components/listings/sale-badge-overlay';
import {
  isVehicleListingSummary,
  VehicleListingMeta,
} from '@/components/listings/vehicle-listing-meta';
import { SellerRatingDisplay } from '@/components/trust/seller-rating-display';
import { SellerTrustBadges } from '@/components/trust/seller-trust-badges';
import { listingImageVariantUrl } from '@/lib/listing-image-url';

interface ListingCardListProps {
  listing: ListingSummary;
  showSave?: boolean;
  initialSaved?: boolean;
}

function DeliveryBadge({ summary }: { summary?: string }) {
  if (!summary) return null;
  return (
    <ListingBadge tone="delivery" className="font-normal">
      {summary}
    </ListingBadge>
  );
}

export function ListingCardList({
  listing,
  showSave = false,
  initialSaved,
}: ListingCardListProps) {
  const listedAt = resolveListingListedAt(listing.createdAt, listing.activatedAt);
  const imageSrc = listingImageVariantUrl(listing.imageUrl, 'card');
  const isFresh = isFreshListing(listedAt);
  const conditionLabel = formatListingConditionLabel(listing.condition);
  const isVehicle = isVehicleListingSummary(listing);
  const isFree = isFreeListingPrice(listing.price);

  return (
    <article className="group relative overflow-hidden rounded-brand-md border border-gray-200 bg-white shadow-brand-sm transition-all duration-200 hover:shadow-brand-md">
      <Link href={`/listings/${listing.id}`} className="flex flex-col sm:flex-row">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-gray-100 sm:aspect-auto sm:h-48 sm:w-72 md:w-80">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full min-h-[160px] items-center justify-center text-sm text-gray-400">
              No image
            </div>
          )}

          {!isFree && (
            <SaleBadgeOverlay
              originalPrice={listing.originalPrice}
              salePrice={listing.salePrice}
              discountPercent={listing.discountPercent}
            />
          )}

          {isFresh && (
            <ListingBadge tone="fresh" className="absolute bottom-2 left-2 z-10">
              Just listed
            </ListingBadge>
          )}

          <div className="absolute bottom-2 right-2 z-20 flex gap-1.5">
            <ShareListingButton listingId={listing.id} title={listing.title} variant="icon" />
            {showSave && (
              <SaveButton listingId={listing.id} initialSaved={initialSaved} size="sm" />
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-base font-semibold leading-snug text-gray-900 sm:text-lg">
              {listing.title}
            </h2>
            {conditionLabel && (
              <ListingBadge tone="condition" className="shrink-0">
                {conditionLabel}
              </ListingBadge>
            )}
          </div>

          <DealBlock
            price={listing.price}
            originalPrice={listing.originalPrice}
            salePrice={listing.salePrice}
            discountPercent={listing.discountPercent}
            currency={listing.currency}
            variant="card"
            showBadge={false}
          />

          {isVehicle && <VehicleListingMeta listing={listing} variant="list" />}

          <div className="mt-auto space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="truncate">{formatLocationLabel(listing.location.label)}</span>
              </span>
              <DeliveryBadge summary={listing.deliverySummary} />
            </div>

            <p className="text-xs text-gray-400">{formatJustListedLabel(listedAt)}</p>

            <SellerRatingDisplay
              averageRating={listing.sellerRating}
              reviewCount={listing.sellerReviewCount}
              size="md"
            />
            <SellerTrustBadges
              variant="compact"
              verified={listing.sellerVerified}
              soldCount={listing.sellerSoldCount}
              averageRating={listing.sellerRating}
              reviewCount={listing.sellerReviewCount}
            />

            {!isVehicle && (
              <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2 text-[11px] text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  Safe marketplace
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" aria-hidden />
                  Secure messaging
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
