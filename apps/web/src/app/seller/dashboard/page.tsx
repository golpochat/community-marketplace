'use client';

import Link from 'next/link';

import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { SellerConnectBanner } from '@/components/seller/seller-connect-banner';
import { SellerDashboardCards } from '@/components/seller/seller-dashboard-cards';
import { useSellerDashboardStats } from '@/hooks/use-seller-dashboard-stats';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useAuth } from '@/hooks/use-auth';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, error } = useUserProfile();
  const { stats, loading: statsLoading } = useSellerDashboardStats();

  return (
    <>
      <PageHeader
        title="Home"
        description={
          profile?.displayName
            ? `Welcome back, ${profile.displayName}.`
            : 'Your seller dashboard overview.'
        }
      />
      {profileLoading && (
        <p className="mb-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading profile…</p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <SellerConnectBanner className="mb-6" />
      <SellerDashboardCards stats={stats} loading={statsLoading} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <DashboardCard title="Listing performance">
          <dl className="space-y-2 text-sm text-[hsl(var(--dashboard-main-fg))]">
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Total views</dt>
              <dd className="font-medium">{statsLoading ? '…' : stats.totalViews}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Unread notifications</dt>
              <dd className="font-medium">{statsLoading ? '…' : stats.unreadNotifications}</dd>
            </div>
          </dl>
        </DashboardCard>
        {profile && (
          <DashboardCard title="Account">
            <div className="space-y-1 text-sm text-[hsl(var(--dashboard-main-fg))]">
              <p>Email: {profile.email}</p>
              <p>Status: {profile.status}</p>
              {profile.verificationBadge ? (
                <p className="font-medium text-[hsl(var(--dashboard-accent))]">Verified seller</p>
              ) : null}
            </div>
          </DashboardCard>
        )}
      </div>
      {!profile && user && !profileLoading && (
        <p className="mt-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          Signed in as {user.email}
        </p>
      )}
      <p className="mt-4 text-sm">
        <Link
          href="/seller/listings/create"
          className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
        >
          Create a new listing
        </Link>
      </p>
    </>
  );
}
