import { Suspense } from 'react';

import { ListingsBrowseClient } from '@/components/listings/listings-browse-client';
import { ListingCardSkeleton } from '@/components/shared/skeleton';
import { BROWSE_RESULTS_GRID_CLASS } from '@/lib/listing-browse-layout';
import { SITE_PAGE_CLASS } from '@/lib/page-layout';

export const metadata = { title: 'Listings' };

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className={SITE_PAGE_CLASS}>
          <div className={BROWSE_RESULTS_GRID_CLASS}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <ListingsBrowseClient />
    </Suspense>
  );
}
