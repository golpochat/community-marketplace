import type { SellerStorefront } from '@community-marketplace/types';
import type { Metadata } from 'next';

import { APP_NAME } from '@community-marketplace/config';

import { buildStoreCanonicalPath, canonicalMetadata } from '@/lib/seo/canonical';
import { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_PATH, DEFAULT_TWITTER } from '@/lib/seo/og-default';

const DESCRIPTION_MAX = 160;

function truncate(text: string, max: number): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export function buildStoreMetadata(store: SellerStorefront): Metadata {
  const title = store.name;
  const description = truncate(
    store.tagline?.trim() || store.description || `${store.name} on ${APP_NAME}`,
    DESCRIPTION_MAX,
  );
  const imageUrl = store.bannerUrl || store.logoUrl;
  const canonicalPath = buildStoreCanonicalPath(store.slug);

  const ogImage = imageUrl
    ? { url: imageUrl, alt: `${store.name} store` }
    : DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    ...canonicalMetadata(canonicalPath),
    openGraph: {
      title: `${store.name} | ${APP_NAME}`,
      description,
      type: 'website',
      url: canonicalPath,
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: store.name,
      description,
      images: [imageUrl ?? DEFAULT_OG_IMAGE_PATH],
    },
  };
}
