'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ShareAnalyticsSummary } from '@community-marketplace/types';
import { Card, TruncatedText } from '@community-marketplace/ui-dashboard';

import { DashboardPageShell } from '@/components/dashboard/async-resource';
import { shareService } from '@/services/share.service';

const PLATFORM_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  MESSENGER: 'Messenger',
  X: 'X',
  TELEGRAM: 'Telegram',
  EMAIL: 'Email',
  COPY_LINK: 'Copy link',
  QR: 'QR code',
  NATIVE: 'Device share',
};

export function SellerShareAnalyticsPage() {
  const [data, setData] = useState<ShareAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await shareService.getSellerAnalytics();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load share analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardPageShell
      title="Share Analytics"
      description="Track how buyers share your listings across platforms (last 30 days)."
      loading={loading}
      error={error}
      empty={!loading && !error && data?.totalShares === 0}
      emptyTitle="No shares yet"
      emptyDescription="When buyers share your listings, activity will appear here."
    >
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Total shares</p>
              <p className="mt-1 text-2xl font-semibold text-[hsl(var(--dashboard-main-fg))]">{data.totalShares}</p>
            </Card>
            <Card>
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Link clicks</p>
              <p className="mt-1 text-2xl font-semibold text-[hsl(var(--dashboard-main-fg))]">{data.totalClicks}</p>
            </Card>
            <Card>
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Click-through rate</p>
              <p className="mt-1 text-2xl font-semibold text-[hsl(var(--dashboard-main-fg))]">{data.clickThroughRate}%</p>
            </Card>
          </div>

          {data.sharesByPlatform.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">Shares by platform</h2>
              <ul className="mt-4 space-y-2">
                {data.sharesByPlatform.map((row) => (
                  <li key={row.platform} className="flex justify-between text-sm">
                    <span className="text-[hsl(var(--dashboard-main-fg))]">
                      {PLATFORM_LABELS[row.platform] ?? row.platform}
                    </span>
                    <span className="font-medium text-[hsl(var(--dashboard-main-fg))]">{row.count}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {data.sharesOverTime.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">Shares over time</h2>
              <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto text-sm">
                {data.sharesOverTime.map((row) => (
                  <li key={row.date} className="flex justify-between text-[hsl(var(--dashboard-main-fg))]">
                    <span>{row.date}</span>
                    <span className="font-medium">{row.count}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {data.topListings.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">Top-performing listings</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-sidebar-muted))]">
                      <th className="pb-2 pr-4 font-medium">Listing</th>
                      <th className="pb-2 pr-4 font-medium">Shares</th>
                      <th className="pb-2 pr-4 font-medium">Clicks</th>
                      <th className="pb-2 font-medium">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topListings.map((row) => (
                      <tr key={row.listingId} className="border-b border-[hsl(var(--dashboard-sidebar-border))]">
                        <td className="py-2 pr-4 text-[hsl(var(--dashboard-main-fg))]">
                          <TruncatedText text={row.title} />
                        </td>
                        <td className="py-2 pr-4">{row.shareCount}</td>
                        <td className="py-2 pr-4">{row.clickCount}</td>
                        <td className="py-2">{row.clickThroughRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}
