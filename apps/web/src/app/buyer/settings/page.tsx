'use client';

import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { EmptyState } from '@/components/shared/empty-state';

export default function BuyerSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and preferences." />
      <DashboardCard>
        <EmptyState
          variant="dashboard"
          title="Settings"
          description="Profile and notification preferences will be available here."
        />
      </DashboardCard>
    </>
  );
}
