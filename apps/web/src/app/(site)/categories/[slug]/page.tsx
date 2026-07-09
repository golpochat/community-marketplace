import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { parseBrowseFiltersFromRecord } from '@/components/listings/browse/browse-url-filters';
import { ListingsBrowseClient } from '@/components/listings/listings-browse-client';
import { ListingCardSkeleton } from '@/components/shared/skeleton';
import { ContentHubLinks } from '@/components/seo/content-hub-links';
import { buildCategoryMetadata, filtersToParamsKey } from '@/lib/seo/browse-metadata';
import { fetchBrowsePage, fetchCategoryBySlug } from '@/lib/server-browse';
import { BROWSE_RESULTS_GRID_CLASS } from '@/lib/listing-browse-layout';
import { SITE_PAGE_CLASS } from '@/lib/page-layout';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) {
    return { title: 'Category not found' };
  }
  return buildCategoryMetadata(category);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) notFound();

  const filters = parseBrowseFiltersFromRecord({ categoryId: category.id });
  const { categories, listings, meta } = await fetchBrowsePage(filters);
  const initialFiltersKey = filtersToParamsKey(filters);

  return (
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
        pageTitle={`${category.name} for sale`}
        pageDescription={
          category.description?.trim() ||
          `Browse ${category.name.toLowerCase()} from trusted local sellers in Ireland.`
        }
      />
      <div className="mx-auto max-w-6xl px-4 pb-12 md:px-6">
        <ContentHubLinks variant="compact" />
      </div>
    </Suspense>
  );
}
