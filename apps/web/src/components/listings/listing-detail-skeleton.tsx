import { Skeleton } from '@/components/shared/skeleton';
import { LISTING_DETAIL_GRID_CLASS, SITE_PAGE_CLASS } from '@/lib/page-layout';

export function ListingDetailSkeleton() {
  return (
    <div className={SITE_PAGE_CLASS}>
      <Skeleton className="h-4 w-32" />
      <div className={`mt-6 ${LISTING_DETAIL_GRID_CLASS}`}>
        <div className="min-w-0 space-y-6">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <aside className="min-w-0 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </aside>
      </div>
    </div>
  );
}
