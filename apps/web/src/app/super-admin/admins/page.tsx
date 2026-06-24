'use client';

import { RolePageContent } from '@/components/dashboard/role-page-content';

export default function SuperAdminAdminsPage() {
  return (
    <RolePageContent
      title="Admins"
      description="Create and manage administrator accounts."
      cardTitle="Administrator accounts"
    />
  );
}
