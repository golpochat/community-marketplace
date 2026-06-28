'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { DashboardPageShell } from '@/components/dashboard/async-resource';
import { LoadingState } from '@/components/LoadingState';
import { CreateDisputeForm } from '@/components/disputes/create-dispute-form';

function CreateDisputePageContent() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId');
  const paymentId = searchParams.get('paymentId') ?? undefined;

  if (!listingId) {
    return (
      <DashboardPageShell title="Open dispute" description="Missing listing information.">
        <p className="text-sm text-gray-600">
          Open a dispute from your purchase history after a successful payment.
        </p>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell title="Open dispute" description="Describe the issue with your purchase.">
      <CreateDisputeForm listingId={listingId} paymentId={paymentId} />
    </DashboardPageShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CreateDisputePageContent />
    </Suspense>
  );
}
