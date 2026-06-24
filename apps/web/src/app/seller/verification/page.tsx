'use client';

import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { EmptyState } from '@/components/shared/empty-state';

export default function SellerVerificationPage() {
  return (
    <>
      <PageHeader
        title="Verification"
        description="Complete identity verification to earn a trusted seller badge."
      />
      <DashboardCard>
        <EmptyState
          variant="dashboard"
          title="Verification pending"
          description="Upload your documents to start the verification process."
        />
      </DashboardCard>
    </>
  );
}
