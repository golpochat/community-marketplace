'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import {
  formatAiMarketingQuotaSummary,
  type AiMarketingQuotaSummary,
} from '@community-marketplace/types';
import { Button } from '@community-marketplace/ui';
import { Card, PageHeader } from '@community-marketplace/ui-dashboard';

import { WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { AiCreditPackDialog } from '@/components/seller/ai-credit-pack-dialog';
import { aiMarketingService } from '@/services/ai-marketing.service';
import { SellerGrowthPackDialog } from '@/components/seller/seller-growth-pack-dialog';
const ENTRY_POINTS = [
  {
    href: WEB_APP_ROUTES.accountListingsCreate,
    title: 'Create a listing',
    description:
      'Marketing Hub sits under Details, Pricing, and Photos while you write and upload.',
  },
  {
    href: WEB_APP_ROUTES.accountListings,
    title: 'My listings',
    description:
      'Open any listing to edit copy, photos, campaign pack, and boost when live.',
  },
  {
    href: WEB_APP_ROUTES.accountStorefront,
    title: 'Promote your shop',
    description:
      'Copy your storefront URL and generate shop social / outreach copy on Storefront settings.',
  },
] as const;

export function SellerMarketingHubPage() {
  const [quota, setQuota] = useState<AiMarketingQuotaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditPackOpen, setCreditPackOpen] = useState(false);
  const [growthPackOpen, setGrowthPackOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setQuota(await aiMarketingService.getQuota());
    } catch (err) {
      setQuota(null);
      setError(
        err instanceof Error ? err.message : 'Could not load Marketing Hub status',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const published = Boolean(quota?.published && quota?.deployEnabled);

  return (
    <>
      <PageHeader
        title="AI Marketing Hub"
        description="Generate Irish English listing copy, social posts, and share assets — then boost on SellNearby."
      />

      {loading && (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading…</p>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && quota && (
        <div className="space-y-6">
          <Card title="Your allowance">
            {!published ? (
              <p className="text-sm text-amber-800">
                {!quota.deployEnabled
                  ? 'Marketing Hub is temporarily unavailable (deploy switch).'
                  : 'Marketing Hub is not published yet. Tools appear on listings and storefront once an admin turns it on.'}
              </p>
            ) : (
              <p className="text-sm text-[hsl(var(--dashboard-main-fg))]">
                {formatAiMarketingQuotaSummary(quota)}
              </p>
            )}
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2">
                <dt className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                  Free units left
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-[hsl(var(--dashboard-main-fg))]">
                  {quota.sellerVerified ? quota.freeUnitsRemaining : '—'}
                </dd>
              </div>
              <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2">
                <dt className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                  SellNearby Credit
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-[hsl(var(--dashboard-main-fg))]">
                  €{quota.walletBalance.toFixed(2)}
                </dd>
              </div>
              <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2">
                <dt className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                  Generations today
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-[hsl(var(--dashboard-main-fg))]">
                  {quota.dailyGenerationsUsed}/{quota.dailyGenerationLimit}
                </dd>
              </div>
            </dl>
            {!quota.sellerVerified && (
              <p className="mt-3 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Verified sellers get a monthly free allowance. You can still use paid units from
                SellNearby Credit when the hub is live.{' '}
                <Link
                  href={WEB_APP_ROUTES.accountVerification}
                  className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
                >
                  Get verified
                </Link>
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
                Refresh status
              </Button>
              {published && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setCreditPackOpen(true)}
                  >
                    Top up credits
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setGrowthPackOpen(true)}
                  >
                    Growth Pack
                  </Button>
                </>
              )}
            </div>
          </Card>

          <Card title="Where to use it">
            <ul className="space-y-3">
              {ENTRY_POINTS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-3 transition-colors hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
                  >
                    <p className="text-sm font-medium text-[hsl(var(--dashboard-accent))]">
                      {item.title} →
                    </p>
                    <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                      {item.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="What you can generate">
            <ul className="list-disc space-y-1 pl-5 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
              <li>SEO titles, descriptions, and social captions (Instagram, Facebook, TikTok script)</li>
              <li>WhatsApp, email, and seasonal promo drafts</li>
              <li>Photo enhance, background remove, and share banners (saved listings)</li>
              <li>Free price suggestion and best posting time (Europe/Dublin)</li>
              <li>Campaign pack zip + Growth Pack / boost when your listing is live</li>
            </ul>
            <p className="mt-3 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              AI never auto-saves — Accept, Copy, or Download only. Short template video is not
              available yet; use the TikTok script for spoken copy.
            </p>
          </Card>
        </div>
      )}

      <AiCreditPackDialog
        open={creditPackOpen}
        onClose={() => setCreditPackOpen(false)}
        onSuccess={() => void load()}
      />
      <SellerGrowthPackDialog
        open={growthPackOpen}
        onClose={() => setGrowthPackOpen(false)}
        onSuccess={() => void load()}
      />
    </>
  );
}
