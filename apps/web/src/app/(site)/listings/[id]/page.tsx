import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { ListingDetailClient } from '@/components/listings/listing-detail-client';
import { ListingJsonLd } from '@/components/listings/listing-json-ld';
import { buildListingMetadataAsync } from '@/lib/listing-og-metadata';
import { fetchListingById, fetchSimilarListings } from '@/lib/server-listings';

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchListingById(id, { trackView: false });
  if (!listing) {
    return { title: 'Listing not found' };
  }
  return buildListingMetadataAsync(listing);
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;

  const [listing, similar] = await Promise.all([
    fetchListingById(id, { trackView: true }),
    fetchSimilarListings(id),
  ]);

  if (!listing) notFound();

  return (
    <>
      <ListingJsonLd listing={listing} />
      <ListingDetailClient id={id} initialListing={listing} initialSimilar={similar} />
    </>
  );
}
