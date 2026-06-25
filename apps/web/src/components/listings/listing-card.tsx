'use client';

import Link from 'next/link';

import { Badge } from '@community-marketplace/ui';
import type { ListingSummary } from '@community-marketplace/types';

import { ListingPriceDisplay } from '@/components/listings/listing-price-display';
import { SaveButton } from '@/components/listings/save-button';
import { ShareListingButton } from '@/components/listings/ShareListingButton';
import { SaleBadgeOverlay } from '@/components/listings/sale-badge-overlay';

interface ListingCardProps {
  listing: ListingSummary;
  showSave?: boolean;
  initialSaved?: boolean;
  footer?: React.ReactNode;
}

export function ListingCard({ listing, showSave = false, initialSaved, footer }: ListingCardProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-brand-md border border-gray-200 bg-white shadow-brand-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brand-md">
      {showSave && (
        <div className="absolute right-2 top-2 z-10 flex gap-2">
          <ShareListingButton listingId={listing.id} title={listing.title} variant="icon" />
          <SaveButton listingId={listing.id} initialSaved={initialSaved} size="sm" />
        </div>
      )}
      {!showSave && (
        <div className="absolute right-2 top-2 z-10">
          <ShareListingButton listingId={listing.id} title={listing.title} variant="icon" />
        </div>
      )}
      <Link href={`/listings/${listing.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-video bg-gray-100">
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">No image</div>
          )}
          <SaleBadgeOverlay
            originalPrice={listing.originalPrice}
            salePrice={listing.salePrice}
            discountPercent={listing.discountPercent}
            size="sm"
          />
          <Badge className="absolute bottom-2 left-2 capitalize" variant="secondary">
            {listing.condition.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h2 className="line-clamp-2 font-semibold text-gray-900">{listing.title}</h2>
          <ListingPriceDisplay
            price={listing.price}
            originalPrice={listing.originalPrice}
            salePrice={listing.salePrice}
            discountPercent={listing.discountPercent}
            currency={listing.currency}
            size="card"
            showBadge={false}
          />
          <p className="mt-auto pt-1 text-small text-gray-500">{listing.location.label}</p>
        </div>
      </Link>
      {footer && <div className="border-t border-gray-100 px-4 py-3">{footer}</div>}
    </article>
  );
}
