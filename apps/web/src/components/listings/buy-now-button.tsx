'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Listing } from '@community-marketplace/types';
import { canActAsBuyer } from '@community-marketplace/types';
import { Button, cn } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { paymentsService } from '@/services/payments.service';

interface BuyNowButtonProps {
  listing: Pick<Listing, 'id' | 'status' | 'sellerId'>;
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
    return 'This seller has not finished payout setup yet.';
  }
  if (message.includes('not available for purchase')) {
    return 'This listing is no longer available for purchase.';
  }
  return message;
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

  if (listing.status !== 'active') return null;
  if (isAuthenticated && user?.id === listing.sellerId) return null;

  if (isAuthenticated && user?.role && !canActAsBuyer(user.role)) {
    return <PurchaseBlockedHint className={className} />;
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
