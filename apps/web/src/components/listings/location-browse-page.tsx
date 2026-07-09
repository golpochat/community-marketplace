import Link from 'next/link';
import { Suspense } from 'react';

import { Button } from '@community-marketplace/ui';

import { parseBrowseFiltersFromRecord } from '@/components/listings/browse/browse-url-filters';
import { ListingsBrowseClient } from '@/components/listings/listings-browse-client';
import { JsonLd } from '@/components/seo/json-ld';
import { ContentHubLinks } from '@/components/seo/content-hub-links';
import { ListingCardSkeleton } from '@/components/shared/skeleton';
import type { ListingLocation } from '@/lib/seo/content/locations';
import { buildLocalCountyPath } from '@/lib/seo/content/counties';
import {
  buildLocationCollectionPageSchema,
  getLocationRelatedLinks,
} from '@/lib/seo/location-metadata';
import { filtersToParamsKey } from '@/lib/seo/browse-metadata';
import { fetchBrowsePage } from '@/lib/server-browse';
import { BROWSE_RESULTS_GRID_CLASS } from '@/lib/listing-browse-layout';
import { SITE_PAGE_CLASS } from '@/lib/page-layout';

interface LocationBrowsePageProps {
  location: ListingLocation;
}

export async function LocationBrowsePage({ location }: LocationBrowsePageProps) {
  const filters = parseBrowseFiltersFromRecord({ area: location.browseArea });
  const { categories, listings, meta } = await fetchBrowsePage(filters);
  const initialFiltersKey = filtersToParamsKey(filters);
  const relatedLinks = getLocationRelatedLinks(location);

  return (
    <>
      <JsonLd data={buildLocationCollectionPageSchema(location)} />
      <div className={`${SITE_PAGE_CLASS} pb-0`}>
        <header className="mx-auto max-w-3xl">
          <p className="text-sm font-medium text-primary">{location.county} · Local marketplace</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">{location.name} listings</h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">{location.intro}</p>
        </header>

        <section className="mx-auto mt-8 max-w-3xl rounded-xl border border-border bg-muted/30 p-5">
          <h2 className="text-lg font-semibold text-foreground">Local selling in {location.name}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {location.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            <strong className="font-medium text-foreground">Meet-up tip:</strong> {location.meetUpHint}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href={buildLocalCountyPath(location.county.toLowerCase())}>
                Sell safely in {location.county}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/register?intent=seller">List an item</Link>
            </Button>
          </div>
        </section>
      </div>

      <Suspense
        fallback={
          <div className={SITE_PAGE_CLASS}>
            <div className={BROWSE_RESULTS_GRID_CLASS}>
              {Array.from({ length: 8 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          </div>
        }
      >
        <ListingsBrowseClient
          initialCategories={categories}
          initialListings={listings}
          initialMeta={meta}
          initialFiltersKey={initialFiltersKey}
          pageTitle={`Latest in ${location.name}`}
          pageDescription={`Active listings from sellers in ${location.name} and nearby.`}
        />
      </Suspense>

      <nav
        aria-label="Related local pages"
        className="mx-auto max-w-6xl px-4 pb-8 md:px-6"
      >
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {relatedLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-primary">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto max-w-6xl px-4 pb-12 md:px-6">
        <ContentHubLinks variant="compact" />
      </div>
    </>
  );
}
