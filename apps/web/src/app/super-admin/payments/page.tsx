'use client';

import { SuperAdminPageContent } from '@/components/super-admin/super-admin-page-content';

export default function SuperAdminPaymentsPage() {
  return (
    <SuperAdminPageContent
      title="Payments"
      description="Monitor transactions, payouts, and payment disputes."
      cardTitle="Payment operations"
    />
  );
}
