import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

import { LocationBrowsePage } from '@/components/listings/location-browse-page';
import { ListingDetailClient } from '@/components/listings/listing-detail-client';
import { ListingJsonLd } from '@/components/listings/listing-json-ld';
import { buildListingMetadataAsync } from '@/lib/listing-og-metadata';
import { buildListingPath, isBareListingId, parseListingRouteParam } from '@/lib/listing-slug';
import { getListingLocationBySlug } from '@/lib/seo/content/locations';
import { buildLocationBrowseMetadata } from '@/lib/seo/location-metadata';
import { fetchListingById, fetchSimilarListings } from '@/lib/server-listings';

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingDetailPageProps): Promise<Metadata> {
  const { id: param } = await params;
  const listingId = parseListingRouteParam(param);
  if (!listingId) {
    const location = getListingLocationBySlug(param);
    if (location) return buildLocationBrowseMetadata(location);
    return { title: 'Listing not found' };
  }
  const listing = await fetchListingById(listingId, { trackView: false });
  if (!listing) {
    return { title: 'Listing not found' };
  }
  return buildListingMetadataAsync(listing);
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id: param } = await params;
  const listingId = parseListingRouteParam(param);

  if (!listingId) {
    const location = getListingLocationBySlug(param);
    if (!location) notFound();
    return <LocationBrowsePage location={location} />;
  }

  const [listing, similar] = await Promise.all([
    fetchListingById(listingId, { trackView: true }),
    fetchSimilarListings(listingId),
  ]);

  if (!listing) notFound();

  if (isBareListingId(param)) {
    permanentRedirect(buildListingPath(listing));
  }

  return (
    <>
      <ListingJsonLd listing={listing} />
      <ListingDetailClient id={listingId} initialListing={listing} initialSimilar={similar} />
    </>
  );
}
