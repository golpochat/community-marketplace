'use client';

import { RolePageContent } from '@/components/dashboard/role-page-content';

export default function SuperAdminSettingsPage() {
  return (
    <RolePageContent
      title="Settings"
      description="Configure global platform settings and feature flags."
      cardTitle="System configuration"
    />
  );
}
