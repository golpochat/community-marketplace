import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import {
  buildBrowseHref,
  parseBrowseFiltersFromRecord,
} from '@/components/listings/browse/browse-url-filters';
import { ListingsBrowseClient } from '@/components/listings/listings-browse-client';
import { ListingCardSkeleton } from '@/components/shared/skeleton';
import { ContentHubLinks } from '@/components/seo/content-hub-links';
import { PaginationRelLinks } from '@/components/seo/pagination-rel-links';
import { buildBrowseMetadata, buildBrowsePaginationPaths, filtersToParamsKey } from '@/lib/seo/browse-metadata';
import { fetchBrowsePage, fetchCategories } from '@/lib/server-browse';
import { BROWSE_RESULTS_GRID_CLASS } from '@/lib/listing-browse-layout';
import { SITE_PAGE_CLASS } from '@/lib/page-layout';

interface ListingsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: ListingsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const categories = await fetchCategories();
  return buildBrowseMetadata(params, categories);
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const params = await searchParams;
  const categories = await fetchCategories();
  const filters = parseBrowseFiltersFromRecord(params, 12, categories);

  // Canonical category URLs live at /categories/{slug} — redirect query forms.
  if (filters.categoryId) {
    redirect(buildBrowseHref(filters, categories));
  }

  const { listings, meta } = await fetchBrowsePage(filters);
  const initialFiltersKey = filtersToParamsKey(filters, categories);
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const pagination = buildBrowsePaginationPaths(params, totalPages, categories);

  return (
    <>
      <PaginationRelLinks prevPath={pagination.prevPath} nextPath={pagination.nextPath} />
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
        />
      </Suspense>
      <div className="mx-auto max-w-6xl px-4 pb-12 md:px-6">
        <ContentHubLinks variant="compact" />
      </div>
    </>
  );
}
