'use client';

import { RolePageContent } from '@/components/dashboard/role-page-content';

export default function SuperAdminPaymentsPage() {
  return (
    <RolePageContent
      title="Payments"
      description="Monitor transactions, payouts, and payment disputes."
      cardTitle="Payment operations"
    />
  );
}
