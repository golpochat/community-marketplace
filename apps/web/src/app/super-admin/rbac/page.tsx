'use client';

import { SuperAdminPageContent } from '@/components/super-admin/super-admin-page-content';

export default function SuperAdminRbacPage() {
  return (
    <SuperAdminPageContent
      title="RBAC"
      description="Manage roles, permissions, and access control policies."
      cardTitle="Role-based access control"
    />
  );
}
