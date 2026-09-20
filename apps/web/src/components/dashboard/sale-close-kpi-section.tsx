'use client';

import type { SaleCloseChannelKpi } from '@community-marketplace/types';
import { emptySaleCloseChannelKpi, formatCurrency, formatPercent } from '@community-marketplace/utils';

import { StatCard } from './stat-card';

interface SaleCloseKpiSectionProps {
  kpi?: SaleCloseChannelKpi | null;
}

export function SaleCloseKpiSection({ kpi }: SaleCloseKpiSectionProps) {
  const resolved = kpi ?? emptySaleCloseChannelKpi();
  const classified = resolved.cardCount + resolved.leakedCount;
  const leakHot = classified > 0 && resolved.leakRate >= 0.5;
  const leakRateLabel = classified > 0 ? formatPercent(resolved.leakRate) : '—';

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
        Sale close mix ({resolved.windowDays} days)
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Card on SellNearby"
          value={`${resolved.cardCount} · ${formatCurrency(resolved.cardListedGmv)}`}
        />
        <StatCard
          label="Sold without card"
          value={`${resolved.leakedCount} · ${formatCurrency(resolved.leakedListedGmv)}`}
          needsAttention={leakHot}
        />
        <StatCard label="Leak rate" value={leakRateLabel} needsAttention={leakHot} />
        <StatCard label="Unmeasured sold" value={String(resolved.unknownCount)} />
      </div>
      <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        Listed GMV is the listing price at mark-sold, not captured card revenue. Unknown is sold
        before a close channel was recorded.
      </p>
    </section>
  );
}
