import type { Listing } from '@community-marketplace/types';

import { getListingPageUrl } from '@/lib/site-url';

interface ListingJsonLdProps {
  listing: Listing;
}

export function ListingJsonLd({ listing }: ListingJsonLdProps) {
  const price = listing.salePrice ?? listing.price;
  const image = listing.images[0]?.url;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description.trim().slice(0, 5000) || listing.title,
    sku: listing.id,
    url: getListingPageUrl(listing.id),
    ...(image ? { image: [image] } : {}),
    offers: {
      '@type': 'Offer',
      price: String(price),
      priceCurrency: listing.currency,
      availability:
        listing.status === 'active'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: getListingPageUrl(listing.id),
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
