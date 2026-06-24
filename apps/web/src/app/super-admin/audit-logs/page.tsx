'use client';

import { SuperAdminPageContent } from '@/components/super-admin/super-admin-page-content';

export default function SuperAdminAuditLogsPage() {
  return (
    <SuperAdminPageContent
      title="Audit Logs"
      description="Review privileged actions and system audit trails."
      cardTitle="Audit trail"
    />
  );
}
