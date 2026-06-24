'use client';

import { Card, PageHeader } from '@community-marketplace/ui-dashboard';

interface RolePageContentProps {
  title: string;
  description?: string;
  cardTitle?: string;
}

export function RolePageContent({ title, description, cardTitle }: RolePageContentProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card title={cardTitle ?? 'Coming soon'}>
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          This section is ready for feature integration.
        </p>
      </Card>
    </>
  );
}
