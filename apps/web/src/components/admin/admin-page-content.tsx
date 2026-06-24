'use client';

import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

interface AdminPageContentProps {
  title: string;
  description?: string;
  cardTitle?: string;
}

export function AdminPageContent({ title, description, cardTitle }: AdminPageContentProps) {
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
