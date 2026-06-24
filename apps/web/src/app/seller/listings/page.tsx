'use client';

import Link from 'next/link';

import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { EmptyState } from '@/components/shared/empty-state';

export default function SellerListingsPage() {
  return (
    <>
      <PageHeader
        title="My Listings"
        description="Manage your active and draft listings."
      />
      <DashboardCard>
        <EmptyState
          variant="dashboard"
          title="No listings yet"
          description="Create your first listing to start selling."
          action={
            <Link
              href="/seller/listings/create"
              className="inline-flex rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Create listing
            </Link>
          }
        />
      </DashboardCard>
    </>
  );
}
