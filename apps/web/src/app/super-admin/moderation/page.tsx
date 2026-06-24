'use client';

import { SuperAdminPageContent } from '@/components/super-admin/super-admin-page-content';

export default function SuperAdminModerationPage() {
  return (
    <SuperAdminPageContent
      title="Moderation"
      description="Handle reports, appeals, and content enforcement."
      cardTitle="Moderation queue"
    />
  );
}
