'use client';

import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

interface SuperAdminPageContentProps {
  title: string;
  description?: string;
  cardTitle?: string;
}

export function SuperAdminPageContent({ title, description, cardTitle }: SuperAdminPageContentProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <DashboardCard title={cardTitle ?? 'Coming soon'}>
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          This section is ready for feature integration.
        </p>
      </DashboardCard>
    </>
  );
}
