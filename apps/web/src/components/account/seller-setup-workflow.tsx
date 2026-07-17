'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  REGISTRATION_SELLER_KIND_OPTIONS,
  VERIFICATION_ONBOARDING_COPY,
  isSellerVerified,
  type SellerRegistrationKind,
} from '@community-marketplace/types';
import { Button, cn } from '@community-marketplace/ui';
import { PageHeader } from '@community-marketplace/ui-dashboard';

import { useSellerConnectStatus } from '@/hooks/use-seller-connect-status';
import { useSellerDashboardData } from '@/hooks/use-seller-dashboard-data';
import { useSellerListingGate } from '@/hooks/use-seller-listing-gate';
import { useSellerStoreData } from '@/hooks/use-seller-store-data';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { SELLER_ROUTES } from '@/lib/seller-routes';
import { reloadAuthenticatedSession } from '@/lib/web-session';
import { useSellerOnboarding } from '@/providers/seller-onboarding-provider';
import { sellerOnboardingService } from '@/services/seller-onboarding.service';
import { SellerConnectBanner } from '@/components/seller/seller-connect-banner';

type StepId = 'seller_type' | 'storefront' | 'first_listing' | 'verification' | 'payouts';
type StepState = 'complete' | 'current' | 'upcoming';

interface WorkflowStep {
  id: StepId;
  title: string;
  description: string;
  state: StepState;
}

function StepIndicator({ step, index }: { step: WorkflowStep; index: number }) {
  const isComplete = step.state === 'complete';
  const isCurrent = step.state === 'current';

  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
          isComplete && 'border-primary bg-primary text-primary-foreground',
          isCurrent && 'border-primary bg-primary/10 text-primary',
          !isComplete && !isCurrent && 'border-border bg-muted text-muted-foreground',
        )}
        aria-hidden
      >
        {isComplete ? '✓' : index + 1}
      </div>
      <div className="min-w-0 pt-0.5">
        <p
          className={cn(
            'text-sm font-medium',
            isCurrent ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {step.title}
        </p>
        <p className="text-xs text-muted-foreground">{step.description}</p>
      </div>
    </div>
  );
}

function SellerTypeStep({
  onComplete,
}: {
  onComplete: () => Promise<void>;
}) {
  const [sellerKind, setSellerKind] = useState<SellerRegistrationKind | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!sellerKind) {
      setError('Choose how you sell: individual, sole trader, or limited company.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sellerOnboardingService.start(sellerKind);
      await reloadAuthenticatedSession();
      await onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start seller setup');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">How do you sell?</legend>
        {REGISTRATION_SELLER_KIND_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-3 transition-colors duration-150',
              'hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5',
            )}
          >
            <input
              type="radio"
              name="seller-kind"
              value={option.value}
              checked={sellerKind === option.value}
              onChange={() => setSellerKind(option.value)}
              className="mt-1 accent-primary"
            />
            <span>
              <span className="block text-sm font-medium text-foreground">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <p className="text-xs text-muted-foreground">
        {VERIFICATION_ONBOARDING_COPY.REGISTRATION_EMAIL_PRIVATE}
      </p>

      <Button type="submit" disabled={loading || !sellerKind}>
        {loading ? 'Saving…' : 'Continue to storefront'}
      </Button>
    </form>
  );
}

function ActiveSellerOverview() {
  const { stats, listingsSummary, loading } = useSellerDashboardData();

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading your seller overview…</p>;
  }

  return (
    <div className="space-y-6">
      <SellerConnectBanner />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Active listings
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{stats.activeListings}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total sold
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{stats.totalSales}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Earnings
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{stats.totalEarnings}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/account/listings/create">Create listing</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={WEB_APP_ROUTES.accountListings}>Manage listings ({listingsSummary.total})</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={SELLER_ROUTES.storefront}>Manage storefront</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={WEB_APP_ROUTES.accountEarnings}>Earnings &amp; payouts</Link>
        </Button>
      </div>
    </div>
  );
}

function SuspendedNotice() {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
      <h2 className="font-semibold text-foreground">Seller account suspended</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your ability to sell is paused. Contact support if you believe this is a mistake, or check
        your messages for details from our team.
      </p>
      <Button variant="outline" className="mt-4" asChild>
        <Link href={WEB_APP_ROUTES.accountMessages}>View messages</Link>
      </Button>
    </div>
  );
}

export function SellerSetupWorkflow() {
  const router = useRouter();
  const { snapshot, phase, loading: onboardingLoading, refresh } = useSellerOnboarding();
  const started = snapshot?.started ?? false;
  const dashboardEnabled = started || phase === 'active_seller';

  const { status: verificationStatus, loading: verificationLoading } = useSellerListingGate();
  const sellerLimit = verificationStatus?.sellerLimit ?? 5;
  const identityComplete = isSellerVerified(verificationStatus?.sellerStatus);
  const identityPending =
    !identityComplete &&
    (verificationStatus?.sellerStatus === 'under_review' ||
      Boolean(verificationStatus?.verificationRequestedAt));
  const { isReady: payoutsReady, loading: connectLoading } = useSellerConnectStatus({
    enabled: dashboardEnabled && identityComplete,
  });
  const { listingsSummary, loading: listingsLoading } = useSellerDashboardData({
    enabled: dashboardEnabled,
  });
  const { stores, loading: storesLoading, reload: reloadStores } = useSellerStoreData({
    enabled: dashboardEnabled,
  });

  const hasStorefront = Boolean(snapshot?.hasStorefront) || stores.length > 0;
  const hasListings = listingsSummary.total > 0;

  useEffect(() => {
    function handleFocus() {
      void refresh();
      void reloadStores();
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refresh, reloadStores]);

  const steps = useMemo((): WorkflowStep[] => {
    const sellerTypeComplete = started;
    const storefrontComplete = hasStorefront;
    const listingComplete = hasListings;
    const verificationComplete = identityComplete;
    const payoutsComplete = payoutsReady;

    const raw: Omit<WorkflowStep, 'state'>[] = [
      {
        id: 'seller_type',
        title: 'Choose seller type',
        description: 'Individual, sole trader, or limited company',
      },
      {
        id: 'storefront',
        title: 'Set up your storefront',
        description: 'Required before you can create listings',
      },
      {
        id: 'first_listing',
        title: 'Publish your first listing',
        description: 'Share what you sell with local buyers',
      },
      {
        id: 'verification',
        title: 'Verify your identity',
        description: identityPending
          ? 'Submitted — waiting for review'
          : 'Needed for payouts and more than 5 live listings',
      },
      {
        id: 'payouts',
        title: 'Connect payouts',
        description: 'Link your bank via Stripe Connect',
      },
    ];

    const completion = [
      sellerTypeComplete,
      storefrontComplete,
      listingComplete,
      verificationComplete,
      payoutsComplete,
    ];
    // Only mark a step complete when every earlier step is also done (avoids
    // "verification complete" while storefront is still outstanding).
    const sequentialComplete = completion.map((_, index) =>
      completion.slice(0, index + 1).every(Boolean),
    );
    const firstIncomplete = sequentialComplete.findIndex((done) => !done);

    return raw.map((step, index) => {
      let state: StepState = 'upcoming';
      if (sequentialComplete[index]) state = 'complete';
      else if (firstIncomplete === index) state = 'current';
      return { ...step, state };
    });
  }, [
    started,
    hasStorefront,
    hasListings,
    identityComplete,
    identityPending,
    payoutsReady,
    sellerLimit,
  ]);

  const currentStepId = steps.find((step) => step.state === 'current')?.id ?? 'first_listing';
  const completedCount = steps.filter((step) => step.state === 'complete').length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  if (onboardingLoading) {
    return <p className="text-sm text-muted-foreground">Loading seller setup…</p>;
  }

  if (phase === 'suspended') {
    return <SuspendedNotice />;
  }

  if (phase === 'active_seller' && completedCount === steps.length) {
    return <ActiveSellerOverview />;
  }

  const setupLoading =
    verificationLoading || connectLoading || listingsLoading || (started && storesLoading);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="rounded-xl border border-border bg-card p-5 shadow-brand-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Seller setup</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {phase === 'buyer_only'
                ? 'One guided path — choose how you sell, set up your storefront, list, then verify for payouts.'
                : `${completedCount} of ${steps.length} steps complete`}
            </p>
          </div>
          {started && (
            <div className="flex items-center gap-3">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-sm font-medium text-foreground">{progressPercent}%</span>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {steps.map((step, index) => (
            <StepIndicator key={step.id} step={step} index={index} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-brand-sm">
        {setupLoading && currentStepId !== 'seller_type' ? (
          <p className="text-sm text-muted-foreground">Loading step details…</p>
        ) : null}

        {!setupLoading || currentStepId === 'seller_type' ? (
          <>
            {currentStepId === 'seller_type' && (
              <SellerTypeStep onComplete={refresh} />
            )}

            {currentStepId === 'storefront' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create your shop with at least a store name. Buyers see this on your public
                  storefront, and listings cannot be added until it exists.
                </p>
                <Button asChild>
                  <Link href={SELLER_ROUTES.storefront}>Set up storefront</Link>
                </Button>
              </div>
            )}

            {currentStepId === 'first_listing' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your storefront is ready. Create your first listing — you can save a draft and
                  publish when you are happy with it. Unverified sellers can have up to{' '}
                  {sellerLimit} approved live listings.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/account/listings/create">Create listing</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={WEB_APP_ROUTES.accountListings}>View my listings</Link>
                  </Button>
                </div>
              </div>
            )}

            {currentStepId === 'verification' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {identityPending
                    ? 'Your identity check is with our team. We will email you when it is reviewed — you can continue setup after it is approved.'
                    : 'Confirm your identity so buyers can trust who they are buying from, unlock more than 5 live listings, and receive payouts.'}
                </p>
                <Button onClick={() => router.push(WEB_APP_ROUTES.accountVerification)}>
                  {identityPending ? 'View verification status' : 'Start verification'}
                </Button>
              </div>
            )}

            {currentStepId === 'payouts' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect Stripe so we can pay out your earnings securely. You will be redirected to
                  Stripe to verify your bank details.
                </p>
                <Button onClick={() => router.push(WEB_APP_ROUTES.accountEarnings)}>
                  {payoutsReady ? 'Review payout settings' : 'Set up payouts'}
                </Button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export function SellerSellingPageHeader() {
  const { phase } = useSellerOnboarding();

  if (phase === 'active_seller') {
    return (
      <PageHeader
        title="Selling"
        description="Manage listings, track earnings, and grow your local sales."
      />
    );
  }

  if (phase === 'suspended') {
    return (
      <PageHeader
        title="Seller account"
        description="Your selling access is currently restricted."
      />
    );
  }

  if (phase === 'setup_in_progress') {
    return (
      <PageHeader
        title="Continue seller setup"
        description="Set up your storefront before creating listings. Verification unlocks more than 5 live listings and payouts."
      />
    );
  }

  return (
    <PageHeader
      title="Start selling"
      description="One account for buying and selling. Set up your storefront, list items, then verify for payouts."
    />
  );
}
