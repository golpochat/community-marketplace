'use client';

import type { ListingSummary } from '@community-marketplace/types';
import {
  formatJustListedLabel,
  formatListingConditionLabel,
  formatLocationLabel,
  isFreshListing,
  isFreeListingPrice,
  resolveListingListedAt,
} from '@community-marketplace/utils';
import { cn } from '@community-marketplace/ui';
import { BadgeCheck, MapPin } from 'lucide-react';

import { DealBlock } from '@/components/listings/deal-block';
import { BoostedBadge } from '@/components/listings/boosted-badge';
import { FeaturedBadge } from '@/components/listings/featured-badge';
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
import type { ListingImageVariant } from '@/lib/listing-image-url';

import { ListingMediaImage } from '@/components/listings/listing-media-image';

export type ListingCardLayout = 'grid' | 'list' | 'compact';

export function useListingCardData(listing: ListingSummary) {
  const listedAt = resolveListingListedAt(listing.createdAt, listing.activatedAt);
  const isFresh = isFreshListing(listedAt);
  const conditionLabel = formatListingConditionLabel(listing.condition);
  const isVehicle = isVehicleListingSummary(listing);
  const isFree = isFreeListingPrice(listing.price);
  const listedLabel = formatJustListedLabel(listedAt);
  const locationLabel = formatLocationLabel(listing.location.label);

  return {
    listedAt,
    isFresh,
    conditionLabel,
    isVehicle,
    isFree,
    listedLabel,
    locationLabel,
  };
}

function DeliveryBadge({ summary }: { summary?: string }) {
  if (!summary) return null;
  return (
    <ListingBadge tone="delivery" className="font-normal">
      {summary}
    </ListingBadge>
  );
}

/** Compact verified seller indicator for browse cards (no full trust strip). */
export function ListingCardVerifiedBadge({ verified }: { verified?: boolean }) {
  if (!verified) return null;
  return (
    <ListingBadge tone="verified" className="font-normal">
      <BadgeCheck className="h-3 w-3" aria-hidden />
      Verified
    </ListingBadge>
  );
}

interface ListingCardImageProps {
  listing: ListingSummary;
  layout: ListingCardLayout;
  imageVariant: ListingImageVariant;
  showSave: boolean;
  initialSaved?: boolean;
  isFresh: boolean;
  conditionLabel: string | null | undefined;
  isFree: boolean;
}

export function ListingCardImage({
  listing,
  layout,
  imageVariant,
  showSave,
  initialSaved,
  isFresh,
  conditionLabel,
  isFree,
}: ListingCardImageProps) {
  const isList = layout === 'list';
  const isCompact = layout === 'compact';

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden bg-muted',
        isList
          ? 'aspect-video w-full sm:aspect-auto sm:h-44 sm:w-60'
          : isCompact
            ? 'aspect-[4/3]'
            : 'aspect-video',
      )}
    >
      <ListingMediaImage
        imageUrl={listing.imageUrl}
        variant={imageVariant}
        alt={listing.title}
        className="transition-transform duration-200 group-hover:scale-[1.02]"
      />

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

      {isFresh && !isCompact && (
        <ListingBadge tone="fresh" className="absolute bottom-2 left-2 z-10">
          Just listed
        </ListingBadge>
      )}

      <div
        className={cn(
          'absolute bottom-2 right-2 z-20 flex gap-1.5 transition-opacity',
          'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100',
        )}
      >
        <ShareListingButton listingId={listing.id} title={listing.title} variant="icon" />
        {showSave && (
          <SaveButton listingId={listing.id} initialSaved={initialSaved} size="sm" />
        )}
      </div>
    </div>
  );
}

interface ListingCardContentProps {
  listing: ListingSummary;
  layout: ListingCardLayout;
  showTrust: boolean;
  isVehicle: boolean;
  locationLabel: string;
  listedLabel: string;
}

export function ListingCardContent({
  listing,
  layout,
  showTrust,
  isVehicle,
  locationLabel,
  listedLabel,
}: ListingCardContentProps) {
  const isList = layout === 'list';
  const isCompact = layout === 'compact';

  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col',
        isCompact ? 'gap-2 p-3' : isList ? 'gap-2.5 p-4 sm:p-5' : 'gap-2.5 p-4',
      )}
    >
      <h2
        className={cn(
          'font-semibold leading-snug text-foreground',
          isCompact ? 'line-clamp-1 text-sm' : isList ? 'line-clamp-2 text-base sm:text-lg' : 'line-clamp-2 text-sm sm:text-base',
        )}
      >
        {listing.title}
      </h2>

      <DealBlock
        price={listing.price}
        originalPrice={listing.originalPrice}
        salePrice={listing.salePrice}
        discountPercent={listing.discountPercent}
        currency={listing.currency}
        variant={isCompact ? 'inline' : 'card'}
        showBadge={false}
      />

      {isVehicle && !isCompact && (
        <VehicleListingMeta
          listing={listing}
          variant={isList ? 'list' : 'grid'}
          showTrust={false}
        />
      )}

      <div className={cn('mt-auto space-y-1.5', !isCompact && 'space-y-2')}>
        <div
          className={cn(
            'flex flex-wrap items-center gap-2 text-muted-foreground',
            isList ? 'text-sm' : 'text-xs',
          )}
        >
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin
              className={cn('shrink-0 text-primary', isList ? 'h-4 w-4' : 'h-3.5 w-3.5')}
              aria-hidden
            />
            <span className="truncate">{locationLabel}</span>
          </span>
          <DeliveryBadge summary={listing.deliverySummary} />
          {!isCompact && <ListingCardVerifiedBadge verified={listing.sellerVerified} />}
          <FeaturedBadge featuredUntil={listing.featuredUntil} isFeatured={listing.isFeatured} />
          <BoostedBadge boostedUntil={listing.boostedUntil} />
        </div>

        <p className="text-xs text-muted-foreground/70">{listedLabel}</p>

        {showTrust && !isCompact && (
          <ListingCardTrustStrip listing={listing} />
        )}
      </div>
    </div>
  );
}

/** Single seller trust block — no duplicate vehicle trust or marketplace marketing. */
export function ListingCardTrustStrip({ listing }: { listing: ListingSummary }) {
  const hasRating = listing.sellerRating != null && listing.sellerRating > 0;
  const hasBadges =
    listing.sellerVerified ||
    (listing.sellerSoldCount ?? 0) > 0 ||
    hasRating;

  if (!hasRating && !hasBadges) return null;

  return (
    <div className="space-y-1.5 border-t border-border pt-2">
      {hasRating && (
        <SellerRatingDisplay
          averageRating={listing.sellerRating}
          reviewCount={listing.sellerReviewCount}
          size="sm"
        />
      )}
      <SellerTrustBadges
        variant="compact"
        verified={listing.sellerVerified}
        soldCount={listing.sellerSoldCount}
        averageRating={listing.sellerRating}
        reviewCount={listing.sellerReviewCount}
      />
    </div>
  );
}

export function listingCardShellClass(layout: ListingCardLayout, className?: string) {
  const isList = layout === 'list';
  return cn(
    'group relative overflow-hidden rounded-brand-md border border-border bg-card shadow-brand-sm transition-all duration-200 hover:shadow-brand-md',
    isList ? '' : 'flex h-full flex-col',
    !isList && 'hover:-translate-y-0.5',
    className,
  );
}

export function listingCardLinkClass(layout: ListingCardLayout) {
  const isList = layout === 'list';
  return cn('flex', isList ? 'flex-col sm:flex-row' : 'flex-1 flex-col');
}
