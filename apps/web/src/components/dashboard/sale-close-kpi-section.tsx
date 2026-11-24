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
  const unknownHot = resolved.unknownCount > 0;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
        Sale close mix ({resolved.windowDays} days) — Friday KPI
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
        <StatCard
          label="Unmeasured sold"
          value={String(resolved.unknownCount)}
          needsAttention={unknownHot}
        />
      </div>
      <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        Listed GMV is the listing price at mark-sold, not captured card revenue. Card closes are
        recorded automatically from checkout. Cash / off-platform must use Mark as sold with a
        channel — unknown means a sold without closeChannel (fix seller habit).
      </p>
      {leakHot && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Leak rate ≥ 50%: nudge Pay on SellNearby in chat, check Connect drop-off, do not cut the
          sitewide fee. See pilot-concierge-gtm Friday table.
        </p>
      )}
      {unknownHot && !leakHot && (
        <p className="mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Unmeasured solds hide leak rate. Remind concierge sellers to Mark as sold with cash or
          off-platform when they skip card checkout.
        </p>
      )}
    </section>
  );
}
