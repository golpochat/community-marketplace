'use client';

import Link from 'next/link';

import { CreateListingButton } from '@/components/seller/create-listing-button';
import { SellerConnectBanner } from '@/components/seller/seller-connect-banner';
import { SellerDashboardCards } from '@/components/seller/seller-dashboard-cards';
import { SellerDashboardSkeleton } from '@/components/seller/seller-dashboard-skeleton';
import { SellerDashboardSummary } from '@/components/seller/seller-dashboard-summary';
import { SellerVerificationBanner } from '@/components/seller/seller-verification-banner';
import { useSellerDashboardData } from '@/hooks/use-seller-dashboard-data';
import { Card, PageHeader } from '@community-marketplace/ui-dashboard';

const QUICK_LINKS = [
  { href: '/seller/storefront', label: 'Storefronts' },
  { href: '/seller/earnings', label: 'Earnings & payouts' },
  { href: '/seller/notifications', label: 'Notifications' },
  { href: '/seller/chat', label: 'Messages' },
  { href: '/seller/settings', label: 'Settings' },
] as const;

export default function SellerDashboardPage() {
  const {
    profile,
    verification,
    stores,
    listingsSummary,
    stats,
    loading,
    error,
  } = useSellerDashboardData();

  return (
    <>
      <PageHeader
        title="Home"
        description={
          profile?.displayName
            ? `Welcome back, ${profile.displayName}.`
            : loading
              ? 'Loading your seller overview…'
              : 'Your seller dashboard overview.'
        }
      />

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <SellerVerificationBanner className="mb-4 sm:mb-6" />
      <SellerConnectBanner className="mb-4 sm:mb-6" />

      {loading ? (
        <SellerDashboardSkeleton />
      ) : profile && verification ? (
        <>
          <SellerDashboardSummary
            profile={profile}
            verification={verification}
            listingsSummary={listingsSummary}
            stores={stores}
          />

          <SellerDashboardCards stats={stats} />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card title="Listing performance">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Total views</dt>
                  <dd className="font-semibold tabular-nums text-[hsl(var(--dashboard-main-fg))]">
                    {stats.totalViews}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Unread notifications</dt>
                  <dd className="font-semibold tabular-nums text-[hsl(var(--dashboard-main-fg))]">
                    {stats.unreadNotifications}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Draft listings</dt>
                  <dd className="font-semibold tabular-nums text-[hsl(var(--dashboard-main-fg))]">
                    {listingsSummary.draft}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card title="Quick links">
              <nav className="grid gap-2 sm:grid-cols-2">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-[hsl(var(--dashboard-accent))] transition-colors hover:bg-[hsl(var(--dashboard-sidebar-border))]/20 hover:underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </Card>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CreateListingButton
              label="Create a new listing"
              className="inline-flex w-full items-center justify-center rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 sm:w-auto"
              disabledClassName="inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-gray-300 px-4 py-2.5 text-sm font-medium text-gray-500 sm:w-auto"
            />
          </div>
        </>
      ) : null}
    </>
  );
}
