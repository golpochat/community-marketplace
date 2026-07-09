import type { Listing, SellerStorefront } from '@community-marketplace/types';

import {
  APP_NAME,
  APP_SHORT_NAME,
  PLATFORM_COUNTRY_NAME,
} from '@community-marketplace/config';

import { buildCategoryCanonicalPath } from '@/lib/seo/canonical';
import { absoluteUrl } from '@/lib/seo/canonical';
import { HELP_FAQ_ITEMS } from '@/lib/seo/help-faq';
import { DEFAULT_OG_IMAGE_PATH } from '@/lib/seo/og-default';
import { buildListingPath } from '@/lib/listing-slug';
import { getAppUrl } from '@/lib/site-url';

const SUPPORT_EMAIL = 'support@sellnearby.ie';

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    alternateName: APP_SHORT_NAME,
    url: getAppUrl(),
    logo: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
    email: SUPPORT_EMAIL,
    areaServed: {
      '@type': 'Country',
      name: PLATFORM_COUNTRY_NAME,
    },
  };
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP_NAME,
    url: getAppUrl(),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${getAppUrl()}/listings?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildFaqPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HELP_FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildListingBreadcrumbSchema(listing: Listing) {
  const items: Array<{ name: string; path: string }> = [
    { name: 'Home', path: '/' },
    { name: 'Listings', path: '/listings' },
  ];

  if (listing.category?.slug && listing.category.name) {
    items.push({
      name: listing.category.name,
      path: buildCategoryCanonicalPath(listing.category.slug),
    });
  }

  items.push({
    name: listing.title,
    path: buildListingPath(listing),
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildLocalBusinessSchema(store: SellerStorefront) {
  const address =
    store.contact?.city || store.contact?.addressLine || store.location
      ? {
          '@type': 'PostalAddress' as const,
          ...(store.contact?.addressLine ? { streetAddress: store.contact.addressLine } : {}),
          addressLocality: store.contact?.city ?? store.location,
        }
      : undefined;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: store.name,
    description: store.description?.trim() || store.tagline?.trim() || undefined,
    url: absoluteUrl(`/store/${store.slug}`),
    ...(store.logoUrl || store.bannerUrl ? { image: store.bannerUrl ?? store.logoUrl } : {}),
    ...(address ? { address } : {}),
  };

  if (store.analytics.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: store.analytics.averageRating,
      reviewCount: store.analytics.reviewCount,
    };
  }

  return schema;
}
