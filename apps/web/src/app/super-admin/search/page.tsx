'use client';

import { SuperAdminPageContent } from '@/components/super-admin/super-admin-page-content';

export default function SuperAdminSearchPage() {
  return (
    <SuperAdminPageContent
      title="Search System"
      description="Configure Meilisearch indexes and search relevance."
      cardTitle="Search configuration"
    />
  );
}
