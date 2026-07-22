'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import type { Listing, ListingSummary } from '@community-marketplace/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from '@community-marketplace/ui';

import { DescriptionSection } from '@/components/listings/description-section';
import { Gallery } from '@/components/listings/gallery';
import { ListingDetailHeader } from '@/components/listings/listing-detail-header';
import { ListingDetailSidebar } from '@/components/listings/listing-detail-sidebar';
import { ListingDetailUnavailable } from '@/components/listings/listing-detail-unavailable';
import { SimilarListings } from '@/components/listings/similar-listings';
import { useListingFavorite } from '@/hooks/use-listing-favorite';
import { getListingUnavailableMessage } from '@/lib/listing-availability';
import {
  LISTING_DETAIL_GRID_CLASS,
  LISTING_DETAIL_MAIN_CLASS,
  SITE_PAGE_CLASS,
} from '@/lib/page-layout';
import { listingsService } from '@/services/listings.service';
import { useAuth } from '@/hooks/use-auth';

interface ListingDetailClientProps {
  id: string;
  initialListing: Listing;
  initialSimilar?: ListingSummary[];
}

export function ListingDetailClient({
  id,
  initialListing,
  initialSimilar = [],
}: ListingDetailClientProps) {
  const { isAuthenticated } = useAuth();
  const [listing, setListing] = useState(initialListing);
  const [similar, setSimilar] = useState(initialSimilar);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { initialSaved } = useListingFavorite(id);

  const retryRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const [nextListing, nextSimilar] = await Promise.all([
        listingsService.getById(id, { trackView: false }),
        listingsService.getSimilar(id),
      ]);
      if (!nextListing) {
        setRefreshError('This listing is no longer available.');
        return;
      }
      setListing(nextListing);
      setSimilar(nextSimilar);
    } catch {
      setRefreshError('Could not refresh this listing. Check your connection and try again.');
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  // SSR fetch is unauthenticated; refresh so reserve CTA sees the viewer.
  useEffect(() => {
    if (!isAuthenticated) return;
    void listingsService.getById(id, { trackView: false }).then((next) => {
      if (next) setListing(next);
    });
  }, [id, isAuthenticated]);

  const unavailableMessage = getListingUnavailableMessage(listing.status);

  if (unavailableMessage) {
    return (
      <ListingDetailUnavailable
        listing={listing}
        message={unavailableMessage}
        similar={similar}
        initialSaved={initialSaved}
      />
    );
  }

  const categoryHref = listing.category?.slug
    ? `/categories/${listing.category.slug}`
    : undefined;

  return (
    <div className={SITE_PAGE_CLASS}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/listings">Listings</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {listing.category?.name && categoryHref ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={categoryHref}>{listing.category.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          ) : null}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[12rem] truncate sm:max-w-md">{listing.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {refreshError && (
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <span>{refreshError}</span>
          <Button type="button" variant="outline" size="sm" disabled={refreshing} onClick={retryRefresh}>
            {refreshing ? 'Retrying…' : 'Retry'}
          </Button>
        </div>
      )}

      <div className={`mt-6 ${LISTING_DETAIL_GRID_CLASS}`}>
        <div className={`order-1 lg:col-start-1 lg:row-start-1 ${LISTING_DETAIL_MAIN_CLASS}`}>
          <Gallery images={listing.images} title={listing.title} />
        </div>

        <aside className="order-2 min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-3">
          <ListingDetailSidebar
            listing={listing}
            initialSaved={initialSaved}
            onListingChange={setListing}
          />
        </aside>

        <div className={`order-3 space-y-6 lg:col-start-1 lg:row-start-2 ${LISTING_DETAIL_MAIN_CLASS}`}>
          <ListingDetailHeader listing={listing} />
          <DescriptionSection listing={listing} />
        </div>

        <div className={`order-4 lg:col-start-1 lg:row-start-3 ${LISTING_DETAIL_MAIN_CLASS}`}>
          <SimilarListings
            listings={similar}
            categoryName={listing.category?.name}
            categorySlug={listing.category?.slug}
            narrow
          />
        </div>
      </div>
    </div>
  );
}
