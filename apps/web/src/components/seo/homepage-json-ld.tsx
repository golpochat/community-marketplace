import { JsonLd } from '@/components/seo/json-ld';
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/seo/schema';

export function HomepageJsonLd() {
  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd data={buildWebSiteSchema()} />
    </>
  );
}
