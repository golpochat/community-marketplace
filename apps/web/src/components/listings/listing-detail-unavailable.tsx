import Link from 'next/link';

import type { Listing, ListingSummary } from '@community-marketplace/types';

import { SimilarListings } from '@/components/listings/similar-listings';
import { ListingDetailSidebar } from '@/components/listings/listing-detail-sidebar';
import {
  LISTING_DETAIL_GRID_CLASS,
  SITE_PAGE_CLASS,
} from '@/lib/page-layout';

interface ListingDetailUnavailableProps {
  listing: Listing;
  message: string;
  similar: ListingSummary[];
  initialSaved?: boolean;
}

export function ListingDetailUnavailable({
  listing,
  message,
  similar,
  initialSaved,
}: ListingDetailUnavailableProps) {
  return (
    <div className={SITE_PAGE_CLASS}>
      <Link href="/listings" className="text-sm text-primary hover:text-primary/90">
        ← Back to listings
      </Link>

      <div className={`mt-8 ${LISTING_DETAIL_GRID_CLASS}`}>
        <div className="order-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-6 py-12 text-center lg:order-none">
          <h1 className="text-xl font-semibold text-gray-900">{listing.title}</h1>
          <p className="mt-4 text-gray-600">{message}</p>
        </div>

        <aside className="order-2 min-w-0 lg:order-none">
          <ListingDetailSidebar
            listing={listing}
            initialSaved={initialSaved}
            compact
            hideActions
          />
        </aside>
      </div>

      <SimilarListings
        listings={similar}
        categoryName={listing.category?.name}
        categorySlug={listing.category?.slug}
      />
    </div>
  );
}
