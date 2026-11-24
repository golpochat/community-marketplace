'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Listing } from '@community-marketplace/types';
import { canActAsBuyer } from '@community-marketplace/types';
import { Button, cn } from '@community-marketplace/ui';
import { COMMERCE_PUBLIC_COPY } from '@community-marketplace/utils';

import { useAuth } from '@/hooks/use-auth';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { paymentsService } from '@/services/payments.service';

interface BuyNowButtonProps {
  listing: Pick<Listing, 'id' | 'status' | 'sellerId' | 'reservation'> & {
    seller?: Pick<NonNullable<Listing['seller']>, 'cardCheckoutReady'>;
    /** Chat preview may pass readiness at the top level. */
    cardCheckoutReady?: boolean;
  };
  className?: string;
}

const PURCHASE_BLOCKED_MESSAGE =
  'Sign in to purchase this item, or complete registration if your account is not active yet.';

function formatCheckoutError(message: string): string {
  if (
    message.includes('Insufficient role') ||
    message.includes('Only buyers can initiate payments') ||
    message.includes('Only marketplace members')
  ) {
    return PURCHASE_BLOCKED_MESSAGE;
  }
  if (message.includes('Stripe Connect') || message.includes('not ready to receive')) {
    return COMMERCE_PUBLIC_COPY.cardCheckoutUnavailableHint;
  }
  if (message.includes('not available for purchase')) {
    return 'This listing is no longer available for purchase.';
  }
  return message;
}

function resolveCardCheckoutReady(
  listing: BuyNowButtonProps['listing'],
): boolean | undefined {
  if (typeof listing.cardCheckoutReady === 'boolean') {
    return listing.cardCheckoutReady;
  }
  if (typeof listing.seller?.cardCheckoutReady === 'boolean') {
    return listing.seller.cardCheckoutReady;
  }
  return undefined;
}

function PurchaseBlockedHint({ className }: { className?: string }) {
  return (
    <p className={cn('text-center text-xs', className)}>
      <span className="text-muted-foreground">{PURCHASE_BLOCKED_MESSAGE} </span>
      <Link href={WEB_APP_ROUTES.login} className="font-medium text-primary hover:underline">
        Sign in
      </Link>
      <span className="text-muted-foreground"> or </span>
      <Link href={WEB_APP_ROUTES.register} className="font-medium text-primary hover:underline">
        create an account
      </Link>
      <span className="text-muted-foreground">.</span>
    </p>
  );
}

export function BuyNowButton({ listing, className }: BuyNowButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReservingBuyer = Boolean(listing.reservation?.iAmReservingBuyer);
  const canBuy =
    listing.status === 'active' || (listing.status === 'reserved' && isReservingBuyer);
  const cardCheckoutReady = resolveCardCheckoutReady(listing);
  const cardPayBlocked = cardCheckoutReady === false;

  if (!canBuy) return null;
  if (isAuthenticated && user?.id === listing.sellerId) return null;

  if (isAuthenticated && user?.role && !canActAsBuyer(user.role)) {
    return <PurchaseBlockedHint className={className} />;
  }

  if (cardPayBlocked) {
    return (
      <div className={className}>
        <Button
          type="button"
          className="w-full font-semibold"
          size="default"
          disabled
          aria-disabled="true"
        >
          {COMMERCE_PUBLIC_COPY.cardCheckoutUnavailable}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {COMMERCE_PUBLIC_COPY.cardCheckoutUnavailableHint}
        </p>
      </div>
    );
  }

  async function handleBuy() {
    if (!isAuthenticated) {
      router.push(`${WEB_APP_ROUTES.login}?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const session = await paymentsService.createCheckoutSession(listing.id);
      if (session.checkoutUrl) {
        window.location.href = session.checkoutUrl;
        return;
      }
      router.push(WEB_APP_ROUTES.accountPurchases);
    } catch (err) {
      setError(formatCheckoutError(err instanceof Error ? err.message : 'Checkout failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        className="w-full font-semibold shadow-brand-sm"
        size="default"
        disabled={loading}
        onClick={() => void handleBuy()}
      >
        {loading ? 'Redirecting to checkout…' : 'Buy now'}
      </Button>
      {error && <p className="mt-2 text-center text-xs text-destructive">{error}</p>}
      {!isAuthenticated && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link href={WEB_APP_ROUTES.login} className="font-medium text-primary hover:underline">
            Log in
          </Link>
          {' to purchase securely with Stripe.'}
        </p>
      )}
    </div>
  );
}
