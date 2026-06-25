import type { Metadata } from 'next';

import { ListingDetailClient } from '@/components/listings/listing-detail-client';
import { buildListingMetadataAsync } from '@/lib/listing-og-metadata';
import { fetchListingById } from '@/lib/server-listings';

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchListingById(id);
  if (!listing) {
    return { title: 'Listing not found' };
  }
  return buildListingMetadataAsync(listing);
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  return <ListingDetailClient id={id} />;
}
