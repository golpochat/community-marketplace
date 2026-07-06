import Link from 'next/link';

import { cn } from '@community-marketplace/ui';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

interface StatCardProps {
  label: string;
  value: string;
  href?: string;
  /** Highlights the card when the metric needs attention (e.g. non-zero queue depth). */
  needsAttention?: boolean;
}

export function StatCard({ label, value, href, needsAttention = false }: StatCardProps) {
  const content = (
    <>
      <p className="text-sm font-medium text-[hsl(var(--dashboard-sidebar-muted))]">{label}</p>
      <p
        className={cn(
          'mt-2 text-2xl font-bold',
          needsAttention
            ? 'text-amber-700 dark:text-amber-400'
            : 'text-[hsl(var(--dashboard-main-fg))]',
        )}
      >
        {value}
      </p>
    </>
  );

  if (!href) {
    return (
      <DashboardCard
        className={cn(needsAttention && 'border-amber-300/60 bg-amber-50/50 dark:border-amber-700/40 dark:bg-amber-950/20')}
      >
        {content}
      </DashboardCard>
    );
  }

  return (
    <Link href={href} className="block rounded-xl transition-opacity hover:opacity-90">
      <DashboardCard
        className={cn(
          'transition-colors hover:bg-[hsl(var(--dashboard-sidebar-active)/0.15)]',
          needsAttention && 'border-amber-300/60 bg-amber-50/50 dark:border-amber-700/40 dark:bg-amber-950/20',
        )}
      >
        {content}
      </DashboardCard>
    </Link>
  );
}
