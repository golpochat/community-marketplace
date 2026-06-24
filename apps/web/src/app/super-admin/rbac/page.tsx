'use client';

import { RolePageContent } from '@/components/dashboard/role-page-content';

export default function SuperAdminRbacPage() {
  return (
    <RolePageContent
      title="RBAC"
      description="Manage roles, permissions, and access control policies."
      cardTitle="Role-based access control"
    />
  );
}
