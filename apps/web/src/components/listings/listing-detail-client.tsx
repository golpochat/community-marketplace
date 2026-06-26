'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { Listing, ListingSummary } from '@community-marketplace/types';
import { listingIsHybrid } from '@community-marketplace/utils';

import { DescriptionSection } from '@/components/listings/description-section';
import { Gallery } from '@/components/listings/gallery';
import { ListingBadge } from '@/components/listings/listing-badge';
import { ListingDetailSidebar } from '@/components/listings/listing-detail-sidebar';
import { SimilarListings } from '@/components/listings/similar-listings';
import { Skeleton } from '@/components/shared/skeleton';
import { getListingUnavailableMessage } from '@/lib/listing-availability';
import { listingsService } from '@/services/listings.service';
import { buyerService } from '@/services/marketplace.service';
import { useAuth } from '@/hooks/use-auth';

interface ListingDetailClientProps {
  id: string;
}

export function ListingDetailClient({ id }: ListingDetailClientProps) {
  const { isAuthenticated, user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [similar, setSimilar] = useState<ListingSummary[]>([]);
  const [initialSaved, setInitialSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await listingsService.getById(id);
      if (!data) {
        setNotFoundState(true);
        setLoading(false);
        return;
      }
      setListing(data);
      const similarListings = await listingsService.getSimilar(id);
      setSimilar(similarListings);

      if (isAuthenticated && user?.role === 'BUYER') {
        const saved = await buyerService.isFavorite(id);
        setInitialSaved(saved);
      }

      setLoading(false);
    }
    void load();
  }, [id, isAuthenticated, user?.role]);

  if (notFoundState) notFound();

  if (loading || !listing) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-6 aspect-video w-full rounded-xl" />
        <Skeleton className="mt-6 h-8 w-2/3" />
      </div>
    );
  }

  const sellerSlug = listing.sellerId;
  const sellerDisplayName =
    listing.seller?.displayName?.trim() || 'Seller';
  const unavailableMessage = getListingUnavailableMessage(listing.status);

  if (unavailableMessage) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/listings" className="text-sm text-primary hover:text-primary/90">
          ← Back to listings
        </Link>
        <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <h1 className="text-xl font-semibold text-gray-900">{listing.title}</h1>
          <p className="mt-4 text-gray-600">{unavailableMessage}</p>
        </div>
        <SimilarListings listings={similar} />
      </div>
    );
  }

  const showHybridNearTitle = listingIsHybrid(listing);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/listings" className="text-sm text-primary hover:text-primary/90">
        ← Back to listings
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <Gallery images={listing.images} title={listing.title} />

          <div className="mt-6">
            <div className="flex flex-wrap items-start gap-2">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{listing.title}</h1>
              {showHybridNearTitle && (
                <ListingBadge tone="success" className="mt-1 capitalize">
                  Hybrid model
                </ListingBadge>
              )}
            </div>
            {listing.status === 'active' && (
              <p className="mt-1 text-xs text-gray-500">Active listing</p>
            )}
          </div>

          <DescriptionSection listing={listing} />
          <SimilarListings listings={similar} />
        </div>

        <ListingDetailSidebar
          listing={listing}
          sellerDisplayName={sellerDisplayName}
          sellerSlug={sellerSlug}
          initialSaved={initialSaved}
        />
      </div>
    </div>
  );
}
