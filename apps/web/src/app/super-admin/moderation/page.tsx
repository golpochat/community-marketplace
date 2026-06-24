'use client';

import { RolePageContent } from '@/components/dashboard/role-page-content';

export default function SuperAdminModerationPage() {
  return (
    <RolePageContent
      title="Moderation"
      description="Handle reports, appeals, and content enforcement."
      cardTitle="Moderation queue"
    />
  );
}
