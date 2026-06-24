'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type { Listing, ListingSummary } from '@community-marketplace/types';

import { Gallery } from '@/components/listings/gallery';
import { SellerCard } from '@/components/listings/seller-card';
import { ChatButton } from '@/components/listings/chat-button';
import { SaveButton } from '@/components/listings/save-button';
import { ReportButton } from '@/components/listings/report-button';
import { DescriptionSection } from '@/components/listings/description-section';
import { SimilarListings } from '@/components/listings/similar-listings';
import { Skeleton } from '@/components/shared/skeleton';
import { listingsService } from '@/services/listings.service';

interface ListingDetailClientProps {
  id: string;
}

export function ListingDetailClient({ id }: ListingDetailClientProps) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [similar, setSimilar] = useState<ListingSummary[]>([]);
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
      setLoading(false);
    }
    void load();
  }, [id]);

  if (notFoundState) notFound();

  if (loading || !listing) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-6 h-80 w-full rounded-xl" />
        <Skeleton className="mt-6 h-8 w-2/3" />
      </div>
    );
  }

  const sellerSlug = listing.sellerId === 'seller-1' ? 'dublin-cycles' : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/listings" className="text-sm text-primary hover:text-primary/90">
        ← Back to listings
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <Gallery images={listing.images} title={listing.title} />
          <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl">{listing.title}</h1>
          <DescriptionSection listing={listing} />
          <div className="mt-6 flex flex-wrap gap-3">
            <ChatButton listingId={listing.id} sellerId={listing.sellerId} />
            <SaveButton listingId={listing.id} />
            <ReportButton listingId={listing.id} />
          </div>
          <SimilarListings listings={similar} />
        </div>
        <aside>
          <SellerCard
            sellerId={listing.sellerId}
            sellerName={sellerSlug ? 'Dublin Cycles & More' : 'Community Seller'}
            sellerSlug={sellerSlug}
            verified={!!sellerSlug}
            location={listing.location.label}
          />
        </aside>
      </div>
    </div>
  );
}
