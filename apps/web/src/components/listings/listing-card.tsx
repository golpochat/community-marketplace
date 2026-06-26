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
import { MapPin } from 'lucide-react';

import { DealBlock } from '@/components/listings/deal-block';
import { ListingBadge } from '@/components/listings/listing-badge';
import { SaveButton } from '@/components/listings/save-button';
import { ShareListingButton } from '@/components/listings/ShareListingButton';
import { SaleBadgeOverlay } from '@/components/listings/sale-badge-overlay';
import {
  isVehicleListingSummary,
  VehicleListingMeta,
} from '@/components/listings/vehicle-listing-meta';
import { ListingCardTrustRow } from '@/components/trust/listing-card-trust-row';
import { SellerRatingDisplay } from '@/components/trust/seller-rating-display';
import { SellerTrustBadges } from '@/components/trust/seller-trust-badges';
import { listingImageVariantUrl, type ListingImageVariant } from '@/lib/listing-image-url';

interface ListingCardProps {
  listing: ListingSummary;
  showSave?: boolean;
  initialSaved?: boolean;
  footer?: React.ReactNode;
  imageVariant?: ListingImageVariant;
  compact?: boolean;
  showTrustCues?: boolean;
}

function DeliveryBadge({ summary }: { summary?: string }) {
  if (!summary) return null;
  return (
    <ListingBadge tone="delivery" className="font-normal">
      {summary}
    </ListingBadge>
  );
}

export function ListingCard({
  listing,
  showSave = false,
  initialSaved,
  footer,
  imageVariant = 'card',
  compact = false,
  showTrustCues = true,
}: ListingCardProps) {
  const listedAt = resolveListingListedAt(listing.createdAt, listing.activatedAt);
  const imageSrc = listingImageVariantUrl(listing.imageUrl, imageVariant);
  const isFresh = isFreshListing(listedAt);
  const conditionLabel = formatListingConditionLabel(listing.condition);
  const isVehicle = isVehicleListingSummary(listing);
  const isFree = isFreeListingPrice(listing.price);

  return (
    <article className="group relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-brand-md border border-gray-200 bg-white shadow-brand-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brand-md">
      <Link href={`/listings/${listing.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-video shrink-0 overflow-hidden bg-gray-100">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
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

          {conditionLabel && (
            <ListingBadge tone="condition" className="absolute right-2 top-2 z-10">
              {conditionLabel}
            </ListingBadge>
          )}

          {isFresh && !compact && (
            <ListingBadge tone="fresh" className="absolute bottom-2 left-2 z-10">
              Just listed
            </ListingBadge>
          )}

          <div className="absolute bottom-2 right-2 z-20 flex gap-1.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            <ShareListingButton listingId={listing.id} title={listing.title} variant="icon" />
            {showSave && (
              <SaveButton listingId={listing.id} initialSaved={initialSaved} size="sm" />
            )}
          </div>
        </div>

        <div className={compact ? 'flex flex-1 flex-col gap-2 p-3' : 'flex flex-1 flex-col gap-3 p-4'}>
          <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 sm:text-base">
            {listing.title}
          </h2>

          <DealBlock
            price={listing.price}
            originalPrice={listing.originalPrice}
            salePrice={listing.salePrice}
            discountPercent={listing.discountPercent}
            currency={listing.currency}
            variant={compact ? 'inline' : 'card'}
            showBadge={false}
          />

          {isVehicle && !compact && <VehicleListingMeta listing={listing} variant="grid" />}

          <div className="mt-auto space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                <span className="truncate">{formatLocationLabel(listing.location.label)}</span>
              </span>
              <DeliveryBadge summary={listing.deliverySummary} />
            </div>

            <p className="text-xs text-gray-400">{formatJustListedLabel(listedAt)}</p>

            {showTrustCues && !compact && (
              <div className="space-y-2 border-t border-gray-100 pt-2">
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
                <ListingCardTrustRow />
              </div>
            )}
          </div>
        </div>
      </Link>

      {footer && <div className="border-t border-gray-100 px-4 py-3">{footer}</div>}
    </article>
  );
}
