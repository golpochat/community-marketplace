import type { ListingLocation } from '@/lib/seo/content/locations';
import type { Metadata } from 'next';

import { APP_NAME } from '@community-marketplace/config';

import { buildListingLocationPath } from '@/lib/seo/content/locations';
import { buildLocalCountyPath } from '@/lib/seo/content/counties';
import { buildGuidePath } from '@/lib/seo/content/guides';
import { canonicalMetadata } from '@/lib/seo/canonical';
import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER } from '@/lib/seo/og-default';

export function buildLocationBrowseMetadata(location: ListingLocation): Metadata {
  const title = `${location.name} listings — buy & sell locally`;
  const description = `Browse second-hand items in ${location.name}, ${location.county}. Local sellers, no commission — furniture, electronics, and more on ${APP_NAME}.`;
  const path = buildListingLocationPath(location.slug);

  return {
    title,
    description,
    ...canonicalMetadata(path),
    openGraph: {
      title,
      description,
      url: path,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      ...DEFAULT_TWITTER,
      title,
      description,
    },
  };
}

export function buildLocationCollectionPageSchema(location: ListingLocation) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${location.name} marketplace listings`,
    description: location.intro,
    url: buildListingLocationPath(location.slug),
    about: {
      '@type': 'Place',
      name: location.name,
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: location.county,
      },
    },
  };
}

export function getLocationRelatedLinks(location: ListingLocation) {
  return [
    { href: `/listings?area=${encodeURIComponent(location.browseArea)}`, label: `All ${location.name} area listings` },
    { href: buildLocalCountyPath(location.county.toLowerCase()), label: `Sell safely in ${location.county}` },
    { href: buildGuidePath('best-places-to-sell-locally-ireland'), label: 'Best places to sell locally' },
    { href: '/guides', label: 'All selling guides' },
  ];
}
