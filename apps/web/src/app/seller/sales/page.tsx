'use client';

import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { EmptyState } from '@/components/shared/empty-state';

export default function SellerSalesPage() {
  return (
    <>
      <PageHeader title="Sales" description="Track completed and pending sales." />
      <DashboardCard>
        <EmptyState
          variant="dashboard"
          title="No sales yet"
          description="Your completed sales will appear here."
        />
      </DashboardCard>
    </>
  );
}
