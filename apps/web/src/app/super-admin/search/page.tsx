'use client';

import { RolePageContent } from '@/components/dashboard/role-page-content';

export default function SuperAdminSearchPage() {
  return (
    <RolePageContent
      title="Search"
      description="Configure Meilisearch indexes and search relevance."
      cardTitle="Search configuration"
    />
  );
}
