import type { Listing, ListingSummary } from '@community-marketplace/types';

import {
  buildListingOgContent,
  buildListingOgDescription,
  buildListingOgTitle,
} from '@/lib/listing-og-metadata';
import { getOptimizedOgImageUrl } from '@/lib/og-image';

export interface ListingShareOgPreview {
  title: string;
  description: string;
  imageUrl: string;
}

export function buildListingShareOgPreview(
  listing: Listing,
  pageUrl?: string,
): ListingShareOgPreview {
  const og = buildListingOgContent(listing, pageUrl);
  return {
    title: og.title,
    description: og.description,
    imageUrl: og.imageUrl,
  };
}

type ListingOgFields = Pick<
  Listing,
  | 'title'
  | 'description'
  | 'price'
  | 'originalPrice'
  | 'salePrice'
  | 'discountPercent'
  | 'deliveryOptions'
>;

/** Card/grid share buttons only have summary fields — approximate the same OG card. */
export function buildListingShareOgPreviewFromSummary(
  listing: ListingSummary,
): ListingShareOgPreview {
  const ogFields: ListingOgFields = {
    title: listing.title,
    description: listing.title,
    price: listing.price,
    originalPrice: listing.originalPrice,
    salePrice: listing.salePrice,
    discountPercent: listing.discountPercent,
    deliveryOptions: undefined,
  };

  let description = buildListingOgDescription(ogFields as Listing);
  const deliverySummary = listing.deliverySummary?.trim();
  if (deliverySummary && !description.toLowerCase().includes(deliverySummary.toLowerCase())) {
    description = `${description} • ${deliverySummary}`;
  }

  return {
    title: buildListingOgTitle(ogFields as Listing),
    description,
    imageUrl: getOptimizedOgImageUrl(listing.id),
  };
}
