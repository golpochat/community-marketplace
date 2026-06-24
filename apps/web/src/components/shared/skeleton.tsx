import { cn } from '@community-marketplace/ui';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-gray-200', className)} />;
}

export function ListingCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <Skeleton className="mb-4 h-40 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="mt-2 h-5 w-1/3" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="mt-4 h-8 w-1/3" />
    </div>
  );
}
