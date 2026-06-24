'use client';

import { RolePageContent } from '@/components/dashboard/role-page-content';

export default function SuperAdminAuditLogPage() {
  return (
    <RolePageContent
      title="Audit Log"
      description="Review privileged actions and system audit trails."
      cardTitle="Audit trail"
    />
  );
}
