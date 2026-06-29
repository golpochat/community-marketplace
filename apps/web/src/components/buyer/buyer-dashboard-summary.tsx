'use client';

import Link from 'next/link';

import type { BuyerTrustProfile, UserProfile } from '@community-marketplace/types';
import { Card } from '@community-marketplace/ui-dashboard';

import { BuyerTrustBadges } from '@/components/trust/buyer-trust-badges';
import { BUYER_ROUTES } from '@/lib/buyer-routes';

interface BuyerDashboardSummaryProps {
  profile: UserProfile;
  trust: BuyerTrustProfile | null;
}

export function BuyerDashboardSummary({ profile, trust }: BuyerDashboardSummaryProps) {
  const profileComplete = Boolean(profile.displayName?.trim());

  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-3">
      <Card title="Profile">
        <div className="text-sm">
          <p className="font-semibold">{profile.displayName ?? 'Add your name'}</p>
          <p className="mt-1 line-clamp-2 text-[hsl(var(--dashboard-sidebar-muted))]">
            {profile.bio?.trim() || 'Add a short bio so sellers know who you are.'}
          </p>
        </div>
        <Link
          href={BUYER_ROUTES.profile}
          className="mt-4 inline-block text-sm font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
        >
          {profileComplete ? 'Edit profile' : 'Complete profile →'}
        </Link>
      </Card>

      <Card title="Trust">
        <BuyerTrustBadges
          phoneVerified={trust?.phoneVerified}
          completedTransactions={trust?.completedTransactions}
          isCommunityMember={trust?.isCommunityMember}
          averageRating={trust?.averageRating}
          reviewCount={trust?.reviewCount}
        />
        {trust?.memberSince && (
          <p className="mt-3 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Member since{' '}
            {new Date(trust.memberSince).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </Card>

      <Card title="Profile & settings">
        <div className="space-y-1 text-sm text-[hsl(var(--dashboard-main-fg))]">
          <p className="truncate">{profile.email}</p>
          <p className="text-[hsl(var(--dashboard-sidebar-muted))]">
            {profile.phoneVerified ? 'Phone verified' : 'Phone not verified'}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            href={BUYER_ROUTES.profile}
            className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
          >
            Profile
          </Link>
          <Link
            href={BUYER_ROUTES.settings}
            className="text-[hsl(var(--dashboard-sidebar-muted))] hover:underline"
          >
            Settings
          </Link>
        </div>
      </Card>
    </div>
  );
}
