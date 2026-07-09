import type { Listing } from '@community-marketplace/types';

import { JsonLd } from '@/components/seo/json-ld';
import { buildListingBreadcrumbSchema } from '@/lib/seo/schema';
import { getListingPageUrl } from '@/lib/site-url';

interface ListingJsonLdProps {
  listing: Listing;
}

export function ListingJsonLd({ listing }: ListingJsonLdProps) {
  const price = listing.salePrice ?? listing.price;
  const image = listing.images[0]?.url;
  const pageUrl = getListingPageUrl(listing);

  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description.trim().slice(0, 5000) || listing.title,
    sku: listing.id,
    url: pageUrl,
    ...(image ? { image: [image] } : {}),
    offers: {
      '@type': 'Offer',
      price: String(price),
      priceCurrency: listing.currency,
      availability:
        listing.status === 'active'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: pageUrl,
    },
    ...(listing.seller?.displayName
      ? {
          brand: {
            '@type': 'Brand',
            name: listing.seller.displayName,
          },
        }
      : {}),
  };

  const reviewCount = listing.seller?.reviewCount ?? 0;
  const averageRating = listing.seller?.averageRating;
  if (reviewCount > 0 && averageRating != null && averageRating > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: averageRating,
      reviewCount,
    };
  }

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={buildListingBreadcrumbSchema(listing)} />
    </>
  );
}
