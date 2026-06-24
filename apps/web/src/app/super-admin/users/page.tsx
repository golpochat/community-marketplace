'use client';

import { RolePageContent } from '@/components/dashboard/role-page-content';

export default function SuperAdminUsersPage() {
  return (
    <RolePageContent
      title="Users"
      description="Manage buyer and seller accounts across the marketplace."
      cardTitle="User management"
    />
  );
}
