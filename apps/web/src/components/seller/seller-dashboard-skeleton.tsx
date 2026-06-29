'use client';

import { Card } from '@community-marketplace/ui-dashboard';

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-[hsl(var(--dashboard-sidebar-border))]/60 ${className}`} />;
}

function SummaryCardSkeleton() {
  return (
    <Card>
      <Pulse className="h-4 w-24" />
      <div className="mt-4 space-y-3">
        <Pulse className="h-10 w-full" />
        <Pulse className="h-4 w-3/4" />
      </div>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <Pulse className="h-4 w-28" />
      <Pulse className="mt-3 h-8 w-16" />
      <Pulse className="mt-2 h-3 w-24" />
    </Card>
  );
}

export function SellerDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </div>
    </div>
  );
}
