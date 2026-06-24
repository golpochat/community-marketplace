'use client';

import { RolePageContent } from '@/components/dashboard/role-page-content';

export default function AdminPaymentsPage() {
  return (
    <RolePageContent
      title="Payments"
      description="Monitor transactions and payment-related issues."
      cardTitle="Payment overview"
    />
  );
}
