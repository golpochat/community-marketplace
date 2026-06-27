'use client';

import Link from 'next/link';

import type { ListingSummary } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';

import {
  ListingCardContent,
  ListingCardImage,
  listingCardLinkClass,
  listingCardShellClass,
  useListingCardData,
  type ListingCardLayout,
} from '@/components/listings/listing-card-parts';
import type { ListingImageVariant } from '@/lib/listing-image-url';

export interface ListingCardProps {
  listing: ListingSummary;
  layout?: ListingCardLayout;
  showSave?: boolean;
  initialSaved?: boolean;
  footer?: React.ReactNode;
  imageVariant?: ListingImageVariant;
  /** Seller rating + trust badges (off by default on browse). */
  showTrust?: boolean;
  className?: string;
  /** @deprecated Use `showTrust` */
  showTrustCues?: boolean;
  /** @deprecated Use `layout="compact"` */
  compact?: boolean;
}

export function ListingCard({
  listing,
  layout: layoutProp,
  showSave = false,
  initialSaved,
  footer,
  imageVariant = 'card',
  showTrust,
  className,
  showTrustCues,
  compact,
}: ListingCardProps) {
  const layout: ListingCardLayout = layoutProp ?? (compact ? 'compact' : 'grid');
  const trust = showTrust ?? showTrustCues ?? false;
  const variant = layout === 'compact' ? 'thumb' : imageVariant;

  const data = useListingCardData(listing);

  return (
    <article className={listingCardShellClass(layout, className)}>
      <Link href={`/listings/${listing.id}`} className={listingCardLinkClass(layout)}>
        <ListingCardImage
          listing={listing}
          layout={layout}
          imageVariant={variant}
          showSave={showSave}
          initialSaved={initialSaved}
          isFresh={data.isFresh}
          conditionLabel={data.conditionLabel}
          isFree={data.isFree}
        />
        <ListingCardContent
          listing={listing}
          layout={layout}
          showTrust={trust}
          isVehicle={data.isVehicle}
          locationLabel={data.locationLabel}
          listedLabel={data.listedLabel}
        />
      </Link>

      {footer && <div className="border-t border-gray-100 px-4 py-3">{footer}</div>}
    </article>
  );
}
