'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Listing } from '@community-marketplace/types';
import { Button, cn } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { useCountdownLabel } from '@/hooks/use-countdown-label';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { listingReservesService } from '@/services/listing-reserves.service';
import { listingsService } from '@/services/listings.service';

interface ListingReserveCtaProps {
  listing: Pick<Listing, 'id' | 'status' | 'sellerId' | 'reserveWindowHours' | 'reservation'>;
  className?: string;
  onUpdated?: (listing: Listing) => void;
}

export function ListingReserveCta({ listing, className, onUpdated }: ListingReserveCtaProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reservation = listing.reservation;
  const windowHours = reservation?.reserveWindowHours ?? listing.reserveWindowHours ?? 12;

  const holdExpiresAt =
    reservation?.active?.expiresAt ?? reservation?.mine?.expiresAt ?? undefined;
  const pendingExpiresAt = reservation?.mine?.pendingExpiresAt;
  const holdCountdown = useCountdownLabel(
    reservation?.iAmReservingBuyer || listing.status === 'reserved'
      ? holdExpiresAt
      : undefined,
  );
  const pendingCountdown = useCountdownLabel(
    reservation?.mine?.status === 'pending_seller' ? pendingExpiresAt : undefined,
  );
  const otherHoldCountdown = useCountdownLabel(
    listing.status === 'reserved' && !reservation?.iAmReservingBuyer
      ? holdExpiresAt ?? reservation?.active?.expiresAt
      : undefined,
  );

  if (user?.id === listing.sellerId) {
    if (listing.status !== 'reserved') return null;
    return (
      <div className={cn('rounded-lg border border-indigo-200 bg-indigo-50/80 p-3', className)}>
        <p className="text-sm font-medium text-indigo-950">Reserved for a buyer</p>
        <p className="mt-1 text-xs text-indigo-900/80">
          {holdCountdown && holdCountdown !== 'ended'
            ? `Hold ends in ${holdCountdown}`
            : 'Hold window is ending.'}
        </p>
      </div>
    );
  }

  if (!reservation && listing.status !== 'active' && listing.status !== 'reserved') {
    return null;
  }

  async function handleRequest() {
    if (!isAuthenticated) {
      router.push(
        `${WEB_APP_ROUTES.login}?returnUrl=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await listingReservesService.request(listing.id);
      const refreshed = await listingsService.getById(listing.id, { trackView: false });
      if (refreshed) onUpdated?.(refreshed);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request reservation');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(reserveId: string) {
    setLoading(true);
    setError(null);
    try {
      await listingReservesService.cancelByBuyer(reserveId);
      const refreshed = await listingsService.getById(listing.id, { trackView: false });
      if (refreshed) onUpdated?.(refreshed);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel reservation');
    } finally {
      setLoading(false);
    }
  }

  if (reservation?.blockReason === 'reserved_by_other' || listing.status === 'reserved') {
    if (reservation?.iAmReservingBuyer) {
      return (
        <div className={cn('rounded-lg border border-indigo-200 bg-indigo-50/80 p-3', className)}>
          <p className="text-sm font-medium text-indigo-950">Reserved for you</p>
          <p className="mt-1 text-xs text-indigo-900/80">
            {holdCountdown && holdCountdown !== 'ended'
              ? `Ends in ${holdCountdown}`
              : holdCountdown === 'ended'
                ? 'Hold ended — refresh to see availability.'
                : `You have ${windowHours} hours to buy this item.`}
          </p>
          {reservation.mine?.id && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              disabled={loading}
              onClick={() => void handleCancel(reservation.mine!.id)}
            >
              {loading ? 'Cancelling…' : 'Cancel reservation'}
            </Button>
          )}
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>
      );
    }

    if (!reservation?.iAmReservingBuyer && listing.status === 'reserved') {
      return (
        <div className={cn('rounded-lg border border-border bg-muted/40 p-3', className)}>
          <p className="text-sm font-medium text-foreground">Reserved</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {otherHoldCountdown && otherHoldCountdown !== 'ended'
              ? `Someone else has reserved this item. It may become available again after ${otherHoldCountdown}.`
              : 'Someone else has reserved this item. Check back if it becomes available.'}
          </p>
        </div>
      );
    }
  }

  if (reservation?.mine?.status === 'pending_seller' || reservation?.blockReason === 'already_pending') {
    const pendingId = reservation.mine?.id;
    return (
      <div className={cn('rounded-lg border border-amber-200 bg-amber-50/80 p-3', className)}>
        <p className="text-sm font-medium text-amber-950">Reservation requested</p>
        <p className="mt-1 text-xs text-amber-900/80">
          Waiting for the seller to approve
          {pendingCountdown && pendingCountdown !== 'ended'
            ? ` · expires in ${pendingCountdown}`
            : ' · request expires in up to 2 hours'}
          .
        </p>
        {pendingId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            disabled={loading}
            onClick={() => void handleCancel(pendingId)}
          >
            {loading ? 'Cancelling…' : 'Cancel request'}
          </Button>
        )}
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  if (reservation?.blockReason === 'unverified') {
    return (
      <div className={cn('rounded-lg border border-border bg-muted/40 p-3', className)}>
        <p className="text-sm font-medium text-foreground">Reserve this item</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Identity verification is required before you can place a free hold.
        </p>
        <Link
          href={WEB_APP_ROUTES.accountVerification}
          className="mt-3 inline-flex text-xs font-medium text-primary hover:underline"
        >
          Complete verification
        </Link>
      </div>
    );
  }

  if (listing.status !== 'active') return null;
  if (reservation && !reservation.canRequest && reservation.blockReason !== 'unauthenticated') {
    return null;
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={() => void handleRequest()}
      >
        {loading ? 'Requesting…' : `Request ${windowHours}h reserve`}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Free hold after the seller approves. No payment until you buy.
      </p>
      {error && <p className="mt-2 text-center text-xs text-destructive">{error}</p>}
    </div>
  );
}
