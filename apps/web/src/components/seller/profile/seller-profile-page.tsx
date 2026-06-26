'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { PageHeader } from '@community-marketplace/ui-dashboard';
import { SELLER_VERIFICATION_MESSAGES } from '@community-marketplace/types';

import { SellerVerificationModal } from '@/components/seller/seller-verification-modal';
import {
  isListingCreationBlocked,
  listingGateTooltip,
} from '@/hooks/use-seller-listing-gate';
import { useSellerProfileData } from '@/hooks/use-seller-profile-data';

import { SellerAccountSettingsTab } from './seller-account-settings-tab';
import { SellerProfileListingsTab } from './seller-profile-listings-tab';
import { SellerProfileOverview } from './seller-profile-overview';
import { SellerVerificationFlow } from './seller-verification-flow';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'listings', label: 'Listings' },
  { id: 'verification', label: 'Verification' },
  { id: 'settings', label: 'Account' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function parseTab(value: string | null): TabId {
  if (value && TABS.some((tab) => tab.id === value)) {
    return value as TabId;
  }
  return 'overview';
}

export function SellerProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get('tab'));
  const { profile, verification, listingsSummary, loading, error, reload } = useSellerProfileData();
  const [gateModalOpen, setGateModalOpen] = useState(false);

  const listingBlocked = isListingCreationBlocked(verification);
  const gateTooltip = listingGateTooltip(verification);

  useEffect(() => {
    if (
      verification?.sellerStatus === 'verification_required' &&
      tab === 'listings'
    ) {
      setGateModalOpen(true);
    }
  }, [verification?.sellerStatus, tab]);

  const setTab = useCallback(
    (next: TabId) => {
      router.replace(`/seller/profile?tab=${next}`, { scroll: false });
    },
    [router],
  );

  return (
    <>
      <PageHeader
        title="Seller profile"
        description="Manage your store, verification, listings, and account settings."
      />

      <nav className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-2" aria-label="Profile sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? 'bg-[hsl(var(--dashboard-accent))] text-white'
                : 'text-[hsl(var(--dashboard-sidebar-muted))] hover:bg-gray-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {loading && (
        <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading profile…</p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && profile && verification && tab === 'overview' && (
        <SellerProfileOverview
          profile={profile}
          verification={verification}
          listingsSummary={listingsSummary}
          onEditStore={() => setTab('settings')}
          onStartVerification={() => setTab('verification')}
          listingCreateBlocked={listingBlocked}
          listingCreateTooltip={gateTooltip}
        />
      )}

      {!loading && profile && !verification && tab === 'overview' && (
        <p className="text-sm text-amber-700">
          Verification status could not be loaded. Try the Verification tab or refresh the page.
        </p>
      )}

      {!loading && tab === 'listings' && <SellerProfileListingsTab />}

      {!loading && tab === 'verification' && (
        <SellerVerificationFlow onSubmitted={() => void reload()} />
      )}

      {!loading && tab === 'settings' && (
        <SellerAccountSettingsTab
          profile={profile}
          verification={verification}
          onProfileSaved={() => void reload()}
          onOpenVerification={() => setTab('verification')}
        />
      )}

      <SellerVerificationModal
        open={gateModalOpen}
        onClose={() => setGateModalOpen(false)}
        message={SELLER_VERIFICATION_MESSAGES.BLOCK_VERIFICATION_REQUIRED}
        dismissible={false}
      />
    </>
  );
}
