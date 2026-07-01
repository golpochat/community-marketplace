import { cn } from '@community-marketplace/ui';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} style={style} />;
}

export function ListingCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-brand-md border border-border bg-card shadow-brand-sm">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function ListingCardListSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-brand-md border border-border bg-card shadow-brand-sm sm:flex-row">
      <Skeleton className="aspect-video w-full rounded-none sm:h-44 sm:w-60 sm:shrink-0 sm:rounded-none" />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="mt-4 h-8 w-1/3" />
    </div>
  );
}
