'use client';

import Link from 'next/link';

import type { SellerStore, SellerVerificationStatus, UserProfile } from '@community-marketplace/types';
import { Card } from '@community-marketplace/ui-dashboard';

import { isStorefrontComplete } from '@/hooks/use-seller-store-data';
import type { SellerListingsSummary } from '@/hooks/use-seller-profile-data';
import { SELLER_ROUTES } from '@/lib/seller-routes';

import { SellerProfileStatusBadge } from '@/components/seller/profile/seller-profile-status-badge';

interface SellerDashboardSummaryProps {
  profile: UserProfile;
  verification: SellerVerificationStatus;
  listingsSummary: SellerListingsSummary;
  stores: SellerStore[];
}

function countIncompleteStores(stores: SellerStore[]): number {
  return stores.filter((store) => !isStorefrontComplete(store)).length;
}

export function SellerDashboardSummary({
  profile,
  verification,
  listingsSummary,
  stores,
}: SellerDashboardSummaryProps) {
  const storeCount = stores.length;
  const incompleteCount = countIncompleteStores(stores);

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <Card title="Storefronts">
        <p className="text-3xl font-bold tabular-nums text-[hsl(var(--dashboard-main-fg))]">
          {storeCount}
        </p>
        <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          {storeCount === 0
            ? 'No storefront yet'
            : storeCount === 1
              ? 'Storefront on your account'
              : 'Storefronts on your account'}
        </p>
        {incompleteCount > 0 ? (
          <p className="mt-2 text-sm text-amber-800">
            {incompleteCount} need{incompleteCount === 1 ? 's' : ''} setup
          </p>
        ) : null}
        <Link
          href={SELLER_ROUTES.storefront}
          className="mt-4 inline-block text-sm font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
        >
          Manage storefronts →
        </Link>
      </Card>

      <Card title="Account">
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-medium text-[hsl(var(--dashboard-main-fg))]">
              {profile.displayName?.trim() || 'Add your display name'}
            </p>
            <SellerProfileStatusBadge status={verification.sellerStatus} />
          </div>
          <p className="truncate text-[hsl(var(--dashboard-sidebar-muted))]">{profile.email}</p>
        </div>
        <Link
          href={
            verification.sellerStatus !== 'verified'
              ? SELLER_ROUTES.verification
              : SELLER_ROUTES.profile
          }
          className="mt-4 inline-block text-sm font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
        >
          {verification.sellerStatus !== 'verified'
            ? 'Continue verification →'
            : 'View profile →'}
        </Link>
      </Card>

      <Card title="Listings">
        <dl className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg bg-[hsl(var(--dashboard-sidebar-border))]/15 px-2 py-3">
            <dt className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">Active</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-[hsl(var(--dashboard-main-fg))]">
              {listingsSummary.active}
            </dd>
          </div>
          <div className="rounded-lg bg-[hsl(var(--dashboard-sidebar-border))]/15 px-2 py-3">
            <dt className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">Sold</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-[hsl(var(--dashboard-main-fg))]">
              {listingsSummary.sold}
            </dd>
          </div>
          <div className="rounded-lg bg-[hsl(var(--dashboard-sidebar-border))]/15 px-2 py-3">
            <dt className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">Draft</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-[hsl(var(--dashboard-main-fg))]">
              {listingsSummary.draft}
            </dd>
          </div>
        </dl>
        <Link
          href={SELLER_ROUTES.listings}
          className="mt-4 inline-block text-sm font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
        >
          Manage listings →
        </Link>
      </Card>
    </div>
  );
}
