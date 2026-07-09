import type { Listing, ListingDeliverySelection } from '@community-marketplace/types';
import type { Metadata } from 'next';

import { buildListingCanonicalPath, canonicalMetadata } from '@/lib/seo/canonical';
import { listingRobotsMetadata } from '@/lib/seo/listing-indexability';
import { getOptimizedOgImageUrl } from '@/lib/og-image';
import { fetchShortLinkForListing } from '@/lib/server-share';
import { getListingPageUrl } from '@/lib/site-url';

const OG_DESCRIPTION_MAX = 120;

export interface ListingOgContent {
  title: string;
  description: string;
  finalPrice: number;
  currency: string;
  imageUrl: string;
  pageUrl: string;
  hasSale: boolean;
}

function formatEuro(amount: number): string {
  return `€${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

function listingHasSale(listing: Listing): boolean {
  return (
    listing.originalPrice != null &&
    listing.salePrice != null &&
    listing.discountPercent != null &&
    listing.salePrice < listing.originalPrice
  );
}

function getFinalPrice(listing: Listing): number {
  return listing.salePrice ?? listing.price;
}

export function buildListingOgTitle(listing: Listing): string {
  const hasSale = listingHasSale(listing);
  const finalPrice = getFinalPrice(listing);

  let title: string;
  if (hasSale && listing.originalPrice != null && listing.salePrice != null) {
    title = `SALE – ${listing.title} – Now ${formatEuro(listing.salePrice)} (Was ${formatEuro(listing.originalPrice)})`;
  } else {
    title = `${listing.title} – ${formatEuro(finalPrice)}`;
  }

  if (listing.discountPercent != null && listing.discountPercent > 0) {
    title = `${title} – ${listing.discountPercent}% OFF`;
  }

  return title;
}

function deliverySuffix(options?: ListingDeliverySelection[]): string {
  if (!options?.length) return '';

  const zones = options.map((o) => o.zone).filter(Boolean);
  if (zones.length === 0) return '';

  const onlyCollection = zones.every((z) => z === 'COLLECTION');
  if (onlyCollection) return ' • Collection only';
  if (zones.some((z) => z !== 'COLLECTION')) return ' • Delivery available';
  return '';
}

export function buildListingOgDescription(listing: Listing): string {
  const trimmed = listing.description.trim().replace(/\s+/g, ' ');
  const base =
    trimmed.length > OG_DESCRIPTION_MAX
      ? `${trimmed.slice(0, OG_DESCRIPTION_MAX).trimEnd()}…`
      : trimmed;

  let description = base + deliverySuffix(listing.deliveryOptions);

  if (listingHasSale(listing) && listing.originalPrice != null && listing.salePrice != null) {
    const savings = Math.round((listing.originalPrice - listing.salePrice) * 100) / 100;
    if (savings > 0) {
      description = `${description} • Save ${formatEuro(savings)}`;
    }
  }

  return description;
}

export function buildListingOgContent(
  listing: Listing,
  pageUrl?: string,
): ListingOgContent {
  const mainImage = listing.images[0]?.url;
  return {
    title: buildListingOgTitle(listing),
    description: buildListingOgDescription(listing),
    finalPrice: getFinalPrice(listing),
    currency: listing.currency,
    imageUrl: getOptimizedOgImageUrl(listing.id, mainImage),
    pageUrl: pageUrl ?? getListingPageUrl(listing),
    hasSale: listingHasSale(listing),
  };
}

export async function buildListingOgContentAsync(listing: Listing): Promise<ListingOgContent> {
  const shortLink = await fetchShortLinkForListing(listing.id);
  const pageUrl = shortLink?.shortUrl ?? getListingPageUrl(listing);
  return buildListingOgContent(listing, pageUrl);
}

export function buildListingMetadata(listing: Listing, pageUrl?: string): Metadata {
  const og = buildListingOgContent(listing, pageUrl);
  const canonicalPath = buildListingCanonicalPath(listing);

  return {
    title: og.title,
    description: og.description,
    ...canonicalMetadata(canonicalPath),
    ...listingRobotsMetadata(listing.status),
    openGraph: {
      title: og.title,
      description: og.description,
      url: og.pageUrl,
      type: 'website',
      images: [
        {
          url: og.imageUrl,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: og.title,
      description: og.description,
      images: [og.imageUrl],
    },
    other: {
      'og:type': 'product',
      'product:price:amount': String(og.finalPrice),
      'product:price:currency': og.currency,
    },
  };
}

export async function buildListingMetadataAsync(listing: Listing): Promise<Metadata> {
  const shortLink = await fetchShortLinkForListing(listing.id);
  return buildListingMetadata(listing, shortLink?.shortUrl);
}
