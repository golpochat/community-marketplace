'use client';

import { SuperAdminPageContent } from '@/components/super-admin/super-admin-page-content';

export default function SuperAdminSettingsPage() {
  return (
    <SuperAdminPageContent
      title="System Settings"
      description="Configure global platform settings and feature flags."
      cardTitle="System configuration"
    />
  );
}
