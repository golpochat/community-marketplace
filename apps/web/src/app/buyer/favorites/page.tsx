'use client';

import Link from 'next/link';

import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { EmptyState } from '@/components/shared/empty-state';

export default function BuyerFavoritesPage() {
  return (
    <>
      <PageHeader title="Favorites" description="Listings you have saved." />
      <DashboardCard>
        <EmptyState
          variant="dashboard"
          title="No favorites yet"
          description="Save listings while browsing to find them here."
          action={
            <Link
              href="/buyer/listings"
              className="inline-flex rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Browse listings
            </Link>
          }
        />
      </DashboardCard>
    </>
  );
}
