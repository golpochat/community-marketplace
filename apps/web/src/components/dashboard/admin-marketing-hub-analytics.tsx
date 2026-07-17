'use client';

import { useCallback, useEffect, useState } from 'react';

import type {
  MarketingHubAnalyticsResponse,
  MarketingHubBoostSourceBucket,
} from '@community-marketplace/types';
import { DashboardCard } from '@community-marketplace/ui-dashboard';

import { monetizationService } from '@/services/monetization.service';
import type { AdminServiceRole } from '@/services/admin.service';

function monthStartIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatEur(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
  }).format(amount);
}

const SOURCE_LABELS: Record<MarketingHubBoostSourceBucket, string> = {
  marketing_hub: 'Marketing Hub',
  listings_table: 'Listings table',
  listing_edit: 'Listing edit',
  unknown: 'Unknown / legacy',
};

interface AdminMarketingHubAnalyticsProps {
  role: AdminServiceRole;
}

export function AdminMarketingHubAnalytics({ role }: AdminMarketingHubAnalyticsProps) {
  const [dateFrom, setDateFrom] = useState(monthStartIso);
  const [dateTo, setDateTo] = useState(todayIso);
  const [data, setData] = useState<MarketingHubAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (dateFrom > dateTo) {
      setError('Start date must be on or before end date.');
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await monetizationService.getMarketingHubAnalytics(role, {
        dateFrom,
        dateTo,
      });
      setData(result);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Failed to load Marketing Hub analytics');
    } finally {
      setLoading(false);
    }
  }, [role, dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardCard title="Marketing Hub → boost analytics">
      <p className="mb-4 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        Succeeded boosts by checkout source, Growth Pack sales, and AI generation volume for the
        selected range. Use this to see whether the hub funnel converts into paid boosts.
      </p>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-transparent px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))]"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-[hsl(var(--dashboard-main-fg))]">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-transparent px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))]"
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading && !data ? (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading analytics…</p>
      ) : data ? (
        <div className="space-y-5">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="AI generations"
              value={String(data.generations.count)}
              hint={`${data.generations.uniqueSellers} sellers · ${data.generations.uniqueListings} listings`}
            />
            <StatTile
              label="Credit units used"
              value={String(data.generations.creditUnits)}
              hint={`${formatEur(data.generations.amountEur, data.currency)} wallet overage`}
            />
            <StatTile
              label="Hub boosts"
              value={String(
                data.boostsBySource.find((row) => row.source === 'marketing_hub')?.count ?? 0,
              )}
              hint={
                data.hubBoostsPerGeneration == null
                  ? 'No generations in range'
                  : `${data.hubBoostsPerGeneration} boosts / generation`
              }
            />
            <StatTile
              label="Growth Packs"
              value={String(data.growthPacks.count)}
              hint={`${formatEur(data.growthPacks.revenueEur, data.currency)} · ${data.growthPacks.discountConsumed} discounts used`}
            />
          </dl>

          <div className="overflow-x-auto rounded-lg border border-[hsl(var(--dashboard-sidebar-border))]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-sidebar-muted))]">
                  <th className="px-3 py-2 font-medium">Boost source</th>
                  <th className="px-3 py-2 font-medium">Count</th>
                  <th className="px-3 py-2 font-medium">Revenue</th>
                  <th className="px-3 py-2 font-medium">Growth Pack discount</th>
                </tr>
              </thead>
              <tbody>
                {data.boostsBySource.map((row) => (
                  <tr
                    key={row.source}
                    className="border-b border-[hsl(var(--dashboard-sidebar-border)/0.5)]"
                  >
                    <td className="px-3 py-2 font-medium text-[hsl(var(--dashboard-main-fg))]">
                      {SOURCE_LABELS[row.source]}
                    </td>
                    <td className="px-3 py-2 text-[hsl(var(--dashboard-main-fg))]">{row.count}</td>
                    <td className="px-3 py-2 text-[hsl(var(--dashboard-main-fg))]">
                      {formatEur(row.revenueEur, data.currency)}
                    </td>
                    <td className="px-3 py-2 text-[hsl(var(--dashboard-sidebar-muted))]">
                      {row.withGrowthPackDiscount}
                    </td>
                  </tr>
                ))}
                <tr className="bg-[hsl(var(--dashboard-sidebar-active)/0.25)]">
                  <td className="px-3 py-2 font-medium text-[hsl(var(--dashboard-main-fg))]">
                    All boosts
                  </td>
                  <td className="px-3 py-2 font-medium text-[hsl(var(--dashboard-main-fg))]">
                    {data.boostsTotal.count}
                  </td>
                  <td className="px-3 py-2 font-medium text-[hsl(var(--dashboard-main-fg))]">
                    {formatEur(data.boostsTotal.revenueEur, data.currency)}
                  </td>
                  <td className="px-3 py-2 text-[hsl(var(--dashboard-sidebar-muted))]">
                    {data.boostsBySource.reduce(
                      (sum, row) => sum + row.withGrowthPackDiscount,
                      0,
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Growth Pack unused discounts in range: {data.growthPacks.discountUnused}. Counts use
            purchase created date and succeeded status only.
          </p>
        </div>
      ) : null}
    </DashboardCard>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-3">
      <dt className="text-xs font-medium text-[hsl(var(--dashboard-sidebar-muted))]">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-[hsl(var(--dashboard-main-fg))]">{value}</dd>
      <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{hint}</p>
    </div>
  );
}
