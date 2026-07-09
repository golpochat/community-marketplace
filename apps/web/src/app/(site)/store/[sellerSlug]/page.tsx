import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { StorefrontPageClient } from '@/components/storefront/storefront-page-client';
import { StoreJsonLd } from '@/components/storefront/store-json-ld';
import { buildStoreMetadata } from '@/lib/seo/store-metadata';
import { fetchStoreBySlug } from '@/lib/server-storefront';

interface StorePageProps {
  params: Promise<{ sellerSlug: string }>;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { sellerSlug } = await params;
  const store = await fetchStoreBySlug(sellerSlug);
  if (!store) {
    return { title: 'Store not found' };
  }
  return buildStoreMetadata(store);
}

export default async function StorePage({ params }: StorePageProps) {
  const { sellerSlug } = await params;
  const store = await fetchStoreBySlug(sellerSlug);
  if (!store) notFound();

  return (
    <>
      <StoreJsonLd store={store} />
      <StorefrontPageClient sellerSlug={sellerSlug} initialStore={store} />
    </>
  );
}
