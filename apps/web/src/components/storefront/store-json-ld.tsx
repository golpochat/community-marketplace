import type { SellerStorefront } from '@community-marketplace/types';

import { JsonLd } from '@/components/seo/json-ld';
import { buildLocalBusinessSchema } from '@/lib/seo/schema';

interface StoreJsonLdProps {
  store: SellerStorefront;
}

export function StoreJsonLd({ store }: StoreJsonLdProps) {
  return <JsonLd data={buildLocalBusinessSchema(store)} />;
}
