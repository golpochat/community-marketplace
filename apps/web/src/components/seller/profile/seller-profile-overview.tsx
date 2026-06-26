'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { SellerVerificationStatus, UserProfile } from '@community-marketplace/types';
import { SELLER_VERIFICATION_MESSAGES } from '@community-marketplace/types';
import { formatLocationLabel } from '@community-marketplace/utils';
import { Card } from '@community-marketplace/ui-dashboard';

import type { SellerListingsSummary } from '@/hooks/use-seller-profile-data';
import { VerificationBanner, VerificationProgressBar } from '@/components/seller/verification';

import { SellerProfileStatusBadge } from './seller-profile-status-badge';

function PhoneBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        verified ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {verified ? 'Phone verified' : 'Phone unverified'}
    </span>
  );
}

function getNextVerificationStep(status: SellerVerificationStatus): string {
  if (status.sellerStatus === 'verified') {
    return 'Verification complete';
  }
  if (status.sellerStatus === 'under_review') {
    return 'Await admin review';
  }
  if (status.sellerStatus === 'suspended') {
    return 'Contact support to resolve suspension';
  }
  if (!status.phoneVerified) {
    return 'Verify your phone number';
  }
  if (!status.emailVerified) {
    return 'Confirm your email address';
  }
  if (!status.idVerified && !status.pendingRequest) {
    return 'Upload ID document and selfie';
  }
  if (status.pendingRequest || status.sellerStatus === 'verification_required') {
    return 'Submit verification for review';
  }
  return 'Start seller verification';
}

interface SellerProfileOverviewProps {
  profile: UserProfile;
  verification: SellerVerificationStatus;
  listingsSummary: SellerListingsSummary;
  onEditStore: () => void;
  onStartVerification: () => void;
  listingCreateBlocked: boolean;
  listingCreateTooltip: string;
}

export function SellerProfileOverview({
  profile,
  verification,
  listingsSummary,
  onEditStore,
  onStartVerification,
  listingCreateBlocked,
  listingCreateTooltip,
}: SellerProfileOverviewProps) {
  const router = useRouter();
  const storeLocation = profile.location?.label
    ? formatLocationLabel(profile.location.label)
    : '';

  function handleCreateListing() {
    if (listingCreateBlocked) return;
    router.push('/seller/listings/create');
  }

  const verificationCta =
    verification.sellerStatus === 'verified'
      ? null
      : verification.sellerStatus === 'under_review'
        ? null
        : verification.phoneVerified || verification.currentStage !== 'phone'
          ? 'Continue Verification'
          : 'Start Verification';

  return (
    <div className="space-y-6">
      {verification.sellerStatus === 'unverified' && (
        <VerificationBanner
          type={
            verification.unverifiedListingCount >= verification.sellerLimit - 1
              ? 'warning'
              : 'info'
          }
          message={`You have used ${verification.unverifiedListingCount} of ${verification.sellerLimit} free listings`}
          className="mb-0"
          actionHref="/seller/profile?tab=verification"
          actionLabel="Verify now"
        >
          <VerificationProgressBar
            className="mt-3"
            used={verification.unverifiedListingCount}
            limit={verification.sellerLimit}
          />
          <ul className="mt-3 list-inside list-disc space-y-1 opacity-90">
            <li>{SELLER_VERIFICATION_MESSAGES.NUDGE_FIRST_LISTING}</li>
            <li>{SELLER_VERIFICATION_MESSAGES.NUDGE_THIRD_LISTING}</li>
          </ul>
        </VerificationBanner>
      )}

      {verification.sellerStatus === 'under_review' && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          <p className="font-medium">{SELLER_VERIFICATION_MESSAGES.UNDER_REVIEW}</p>
        </div>
      )}

      {verification.sellerStatus === 'verified' && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <p className="font-semibold">Verified Seller</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Unlimited listings</li>
            <li>Higher visibility in search and browse</li>
            <li>Trusted seller badge on your listings</li>
            <li>Buyers can see you completed identity verification</li>
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Seller overview">
          <dl className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Name</dt>
              <dd className="font-medium">{profile.displayName ?? '—'}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Email</dt>
              <dd>{profile.email}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Phone</dt>
              <dd className="flex flex-wrap items-center gap-2">
                <span>{profile.phone ?? 'Not set'}</span>
                <PhoneBadge verified={verification.phoneVerified} />
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Seller status</dt>
              <dd>
                <SellerProfileStatusBadge status={verification.sellerStatus} />
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Joined</dt>
              <dd>{new Date(profile.createdAt).toLocaleDateString()}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Total listings</dt>
              <dd className="font-medium">{listingsSummary.total}</dd>
            </div>
          </dl>
          {verification.sellerStatus !== 'verified' && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs font-medium text-[hsl(var(--dashboard-sidebar-muted))]">
                Free listing allowance
              </p>
              <VerificationProgressBar
                used={verification.unverifiedListingCount}
                limit={verification.sellerLimit}
              />
            </div>
          )}
        </Card>

        <Card title="Verification status">
          <dl className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Current status</dt>
              <dd>
                <SellerProfileStatusBadge status={verification.sellerStatus} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Next step</dt>
              <dd className="text-right font-medium">{getNextVerificationStep(verification)}</dd>
            </div>
            {verification.verificationCompletedAt && (
              <div className="flex justify-between gap-4">
                <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Verified on</dt>
                <dd>{new Date(verification.verificationCompletedAt).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
          {verification.sellerStatus === 'verified' ? (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
              Verified Seller
            </span>
          ) : verificationCta ? (
            <button
              type="button"
              onClick={onStartVerification}
              className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              {verificationCta}
            </button>
          ) : null}
        </Card>

        <Card title="Store information">
          <div className="flex gap-4">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                Logo
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1 text-sm">
              <p className="font-semibold">{profile.displayName ?? 'Your store'}</p>
              <p className="text-[hsl(var(--dashboard-sidebar-muted))]">
                {profile.bio?.trim() || 'No store description yet.'}
              </p>
              <p className="text-[hsl(var(--dashboard-sidebar-muted))]">
                {storeLocation || 'No location set'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEditStore}
            className="mt-4 text-sm font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
          >
            Edit store
          </button>
        </Card>

        <Card title="Listings summary">
          <dl className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Active</dt>
              <dd className="mt-1 text-2xl font-semibold">{listingsSummary.active}</dd>
            </div>
            <div>
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Sold</dt>
              <dd className="mt-1 text-2xl font-semibold">{listingsSummary.sold}</dd>
            </div>
            <div>
              <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Draft</dt>
              <dd className="mt-1 text-2xl font-semibold">{listingsSummary.draft}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-3">
            {listingCreateBlocked ? (
              <span title={listingCreateTooltip} className="inline-block">
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500"
                >
                  Create New Listing
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleCreateListing}
                className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Create New Listing
              </button>
            )}
            <Link
              href="/seller/profile?tab=listings"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View all listings
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
