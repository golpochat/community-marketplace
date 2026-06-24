'use client';

import Link from 'next/link';

import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { BuyerDashboardCards } from '@/components/buyer/buyer-dashboard-cards';
import { useBuyerDashboardStats } from '@/hooks/use-buyer-dashboard-stats';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useAuth } from '@/hooks/use-auth';

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, error } = useUserProfile();
  const { stats, loading: statsLoading } = useBuyerDashboardStats();

  return (
    <>
      <PageHeader
        title="Home"
        description={
          profile?.displayName
            ? `Welcome back, ${profile.displayName}.`
            : 'Your buyer dashboard overview.'
        }
      />
      {profileLoading && (
        <p className="mb-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading profile…</p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <BuyerDashboardCards stats={stats} loading={statsLoading} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <DashboardCard title="Inbox summary">
          <dl className="space-y-2 text-sm text-[hsl(var(--dashboard-main-fg))]">
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Unread messages</dt>
              <dd className="font-medium">{statsLoading ? '…' : stats.unreadMessages}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Active chats</dt>
              <dd className="font-medium">{statsLoading ? '…' : stats.activeChats}</dd>
            </div>
          </dl>
        </DashboardCard>
        {profile && (
          <DashboardCard title="Account">
            <div className="space-y-1 text-sm text-[hsl(var(--dashboard-main-fg))]">
              <p>Email: {profile.email}</p>
              <p>Status: {profile.status}</p>
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
          href="/buyer/listings"
          className="font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
        >
          Browse listings
        </Link>
      </p>
    </>
  );
}
