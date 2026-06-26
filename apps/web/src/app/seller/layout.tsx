'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { VerificationNudgeHost } from '@/components/seller/verification';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role="SELLER" theme="seller">
      <VerificationNudgeHost />
      {children}
    </DashboardLayout>
  );
}
