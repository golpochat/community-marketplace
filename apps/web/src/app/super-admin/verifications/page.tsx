'use client';

import { RolePageContent } from '@/components/dashboard/role-page-content';

export default function SuperAdminVerificationsPage() {
  return (
    <RolePageContent
      title="Verifications"
      description="Review seller identity verification requests and badges."
      cardTitle="Verification queue"
    />
  );
}
