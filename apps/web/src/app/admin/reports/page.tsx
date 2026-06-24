'use client';

import { RolePageContent } from '@/components/dashboard/role-page-content';

export default function AdminReportsPage() {
  return (
    <RolePageContent
      title="Reports"
      description="Review user-submitted reports and flagged content."
      cardTitle="Report queue"
    />
  );
}
