import { Suspense } from 'react';

import { ListingsBrowseClient } from '@/components/listings/listings-browse-client';
import { ListingCardSkeleton } from '@/components/shared/skeleton';

export const metadata = { title: 'Listings' };

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
