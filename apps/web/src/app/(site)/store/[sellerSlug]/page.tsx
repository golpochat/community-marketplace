import { StorefrontPageClient } from '@/components/storefront/storefront-page-client';

export const metadata = { title: 'Store' };

interface StorePageProps {
  params: Promise<{ sellerSlug: string }>;
}

export default async function StorePage({ params }: StorePageProps) {
  const { sellerSlug } = await params;
  return <StorefrontPageClient sellerSlug={sellerSlug} />;
}
