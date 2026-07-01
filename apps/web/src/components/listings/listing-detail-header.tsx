import Link from 'next/link';

import type { Listing } from '@community-marketplace/types';
import {
  formatJustListedLabel,
  isFreshListing,
  listingIsHybrid,
  resolveListingListedAt,
  resolveListingVehicleSpecs,
} from '@community-marketplace/utils';

import { ListingBadge } from '@/components/listings/listing-badge';
import { ListingDetailStats } from '@/components/listings/listing-detail-stats';

interface ListingDetailHeaderProps {
  listing: Listing;
}

export function ListingDetailHeader({ listing }: ListingDetailHeaderProps) {
  const listedAt = resolveListingListedAt(listing.createdAt, listing.activatedAt);
  const isFresh = isFreshListing(listedAt);
  const showHybrid = listingIsHybrid(listing);
  const vehicleSpecs = resolveListingVehicleSpecs(listing);
  const categoryHref = listing.category?.slug
    ? `/listings?categoryId=${listing.categoryId}`
    : undefined;

  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{listing.title}</h1>
        {showHybrid && (
          <ListingBadge tone="success" className="mt-1 capitalize">
            Hybrid model
          </ListingBadge>
        )}
        {isFresh && (
          <ListingBadge tone="fresh" className="mt-1">
            Just listed
          </ListingBadge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{formatJustListedLabel(listedAt)}</span>
        <ListingDetailStats
          viewCount={listing.viewCount}
          favoriteCount={listing.favoriteCount}
        />
      </div>

      {listing.category?.name && (
        <div>
          {categoryHref ? (
            <Link href={categoryHref}>
              <ListingBadge tone="outline" className="hover:bg-muted">
                {listing.category.name}
              </ListingBadge>
            </Link>
          ) : (
            <ListingBadge tone="outline">{listing.category.name}</ListingBadge>
          )}
        </div>
      )}
    </header>
  );
}
