'use client';

import { RolePageContent } from '@/components/dashboard/role-page-content';

export default function AdminUsersPage() {
  return (
    <RolePageContent
      title="Users"
      description="View and manage marketplace user accounts."
      cardTitle="User management"
    />
  );
}
