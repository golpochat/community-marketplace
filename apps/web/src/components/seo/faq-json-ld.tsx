import { JsonLd } from '@/components/seo/json-ld';
import { buildFaqPageSchema } from '@/lib/seo/schema';

export function FaqJsonLd() {
  return <JsonLd data={buildFaqPageSchema()} />;
}
