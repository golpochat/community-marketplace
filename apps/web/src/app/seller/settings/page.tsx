'use client';

import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { EmptyState } from '@/components/shared/empty-state';

export default function SellerSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your store profile and preferences." />
      <DashboardCard>
        <EmptyState
          variant="dashboard"
          title="Settings"
          description="Store branding, policies, and notification preferences will be available here."
        />
      </DashboardCard>
    </>
  );
}
