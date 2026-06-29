'use client';

import Link from 'next/link';

import type { SellerStore, SellerVerificationStatus, UserProfile } from '@community-marketplace/types';
import { Card } from '@community-marketplace/ui-dashboard';

import { isStorefrontComplete } from '@/hooks/use-seller-store-data';
import type { SellerListingsSummary } from '@/hooks/use-seller-profile-data';
import { getPublicStorefrontPath } from '@/lib/storefront-path';
import { SELLER_ROUTES } from '@/lib/seller-routes';

import { SellerProfileStatusBadge } from '@/components/seller/profile/seller-profile-status-badge';

interface SellerDashboardSummaryProps {
  profile: UserProfile;
  verification: SellerVerificationStatus;
  listingsSummary: SellerListingsSummary;
  primaryStore?: SellerStore | null;
}

export function SellerDashboardSummary({
  profile,
  verification,
  listingsSummary,
  primaryStore,
}: SellerDashboardSummaryProps) {
  const storeComplete = isStorefrontComplete(primaryStore);
  const previewPath = getPublicStorefrontPath(primaryStore?.slug ?? profile.id);

  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-3">
      <Card title="Storefront">
        <div className="flex gap-3">
          {primaryStore?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryStore.logoUrl}
              alt=""
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
              Logo
            </div>
          )}
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold">{primaryStore?.name ?? 'Your store'}</p>
            <p className="truncate text-[hsl(var(--dashboard-sidebar-muted))]">
              {primaryStore?.description?.trim() || 'Add a store description'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            href={SELLER_ROUTES.storefront}
            className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
          >
            {storeComplete ? 'Edit storefront' : 'Complete storefront →'}
          </Link>
          <Link
            href={previewPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[hsl(var(--dashboard-sidebar-muted))] hover:underline"
          >
            Preview
          </Link>
        </div>
      </Card>

      <Card title="Account">
        <div className="space-y-2 text-sm">
          <SellerProfileStatusBadge status={verification.sellerStatus} />
          <p className="text-[hsl(var(--dashboard-sidebar-muted))]">
            {profile.displayName?.trim() || 'Add your display name in Profile'}
          </p>
        </div>
        {verification.sellerStatus !== 'verified' && (
          <Link
            href={SELLER_ROUTES.verification}
            className="mt-4 inline-block text-sm font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
          >
            Continue verification →
          </Link>
        )}
      </Card>

      <Card title="Listings">
        <dl className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Active</dt>
            <dd className="mt-1 text-xl font-semibold">{listingsSummary.active}</dd>
          </div>
          <div>
            <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Sold</dt>
            <dd className="mt-1 text-xl font-semibold">{listingsSummary.sold}</dd>
          </div>
          <div>
            <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Draft</dt>
            <dd className="mt-1 text-xl font-semibold">{listingsSummary.draft}</dd>
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
