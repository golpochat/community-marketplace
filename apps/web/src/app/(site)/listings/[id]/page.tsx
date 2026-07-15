import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

import { LocationBrowsePage } from '@/components/listings/location-browse-page';
import { ListingCanonicalPathSync } from '@/components/listings/listing-canonical-path-sync';
import { ListingDetailClient } from '@/components/listings/listing-detail-client';
import { ListingJsonLd } from '@/components/listings/listing-json-ld';
import { buildListingMetadataAsync } from '@/lib/listing-og-metadata';
import {
  buildListingPath,
  isBareListingId,
  isCanonicalListingRouteParam,
} from '@/lib/listing-slug';
import { getListingLocationBySlug } from '@/lib/seo/content/locations';
import { buildLocationBrowseMetadata } from '@/lib/seo/location-metadata';
import {
  fetchListingById,
  fetchSimilarListings,
  resolveListingIdFromRouteParam,
} from '@/lib/server-listings';

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingDetailPageProps): Promise<Metadata> {
  const { id: param } = await params;
  const listingId = await resolveListingIdFromRouteParam(param);
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
  const listingId = await resolveListingIdFromRouteParam(param);

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

  const canonicalPath = buildListingPath(listing);

  // Bare UUID → hard redirect (middleware cannot invent the title slug).
  if (isBareListingId(param)) {
    permanentRedirect(canonicalPath);
  }

  const needsCanonicalSync = !isCanonicalListingRouteParam(param, listing);

  return (
    <>
      {needsCanonicalSync ? <ListingCanonicalPathSync path={canonicalPath} /> : null}
      <ListingJsonLd listing={listing} />
      <ListingDetailClient id={listingId} initialListing={listing} initialSimilar={similar} />
    </>
  );
}
