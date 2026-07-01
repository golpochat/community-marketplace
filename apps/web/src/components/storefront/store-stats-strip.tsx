import type { StoreAnalytics } from '@community-marketplace/types';
import { Package, ShoppingBag, Star, CalendarDays } from 'lucide-react';

interface StoreStatsStripProps {
  listingCount: number;
  analytics: StoreAnalytics;
  memberSince?: string;
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-brand-md border border-border bg-card px-4 py-3 shadow-brand-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-lg font-bold text-foreground">{value}</p>
        {detail ? <p className="truncate text-xs text-muted-foreground">{detail}</p> : null}
      </div>
    </div>
  );
}

export function StoreStatsStrip({ listingCount, analytics, memberSince }: StoreStatsStripProps) {
  const joinedYear = memberSince ? new Date(memberSince).getFullYear().toString() : null;
  const ratingValue =
    analytics.reviewCount > 0 ? analytics.averageRating.toFixed(1) : 'New seller';
  const ratingDetail =
    analytics.reviewCount > 0
      ? `${analytics.reviewCount} review${analytics.reviewCount === 1 ? '' : 's'}`
      : 'No reviews yet';

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <StatCard
        icon={<Package className="h-4 w-4" aria-hidden />}
        label="Active listings"
        value={String(listingCount)}
      />
      <StatCard
        icon={<ShoppingBag className="h-4 w-4" aria-hidden />}
        label="Items sold"
        value={String(analytics.totalSales)}
      />
      <StatCard
        icon={<Star className="h-4 w-4" aria-hidden />}
        label="Seller rating"
        value={ratingValue}
        detail={ratingDetail}
      />
      {joinedYear ? (
        <StatCard
          icon={<CalendarDays className="h-4 w-4" aria-hidden />}
          label="Member since"
          value={joinedYear}
        />
      ) : null}
    </div>
  );
}
